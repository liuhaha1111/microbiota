import {
  ClinicalPatient,
  DiseaseCategory,
  HistoricalSample,
  SimilarityDimensionKey,
  SimilarityExplanationPoint,
  SimilarityFeatureVector,
  SimilarityResult,
  SimilarityWeights
} from '../types';
import { PatientDataPackage } from '../data/patientSpecificData';

/* ============================================================================
 * 历史样本参考库 · 相似度计算引擎
 *
 * 设计约束（医疗场景，必须可解释、可复现）：
 * 1. 两侧特征向量都由各自权威字段实时派生，不落库、不冗余，页面显示什么就按什么算；
 * 2. 全程无随机数，同一对患者每次得到完全相同的结果；
 * 3. 每个维度输出「为什么相似 / 差在哪」，供医生核对，不做黑箱打分。
 * ========================================================================== */

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const near = (delta: number, span: number) => clamp(1 - Math.abs(delta) / span);

/** 疾病活动度归一化：FC 与 CRP 各占 60/40，封顶后线性映射到 0-100 */
export function diseaseActivityFromMarkers(fecalCalprotectin: number, crp: number): number {
  return Math.round(clamp(Math.min(fecalCalprotectin, 1200) / 1200, 0, 1) * 60 + clamp(Math.min(crp, 100) / 100, 0, 1) * 40);
}

/** 功能通路变化率 → 0-100 得分（-100% → 0 分，+100% → 100 分） */
export function pathwayScore(changePercentage: number): number {
  return Math.max(5, Math.min(100, Math.round(50 + changePercentage / 2)));
}

const NUTRITION_RISK_INDEX: Record<string, 0 | 1 | 2> = { 低: 0, 中等: 1, 高: 2 };
const NUTRITION_RISK_LABEL = ['低', '中等', '高'];

/** 从主诊断文本识别适应症大类（相似度的第一层硬约束） */
export function diagnosisCategoryFromText(text: string): DiseaseCategory {
  if (/艰难梭菌|rCDI|CDI/.test(text)) return 'rCDI';
  if (/克罗恩|Crohn/i.test(text)) return 'CD';
  if (/肠易激|IBS/i.test(text)) return 'IBS-D';
  if (/未定型|IBD-U/i.test(text)) return 'IBD-U';
  return 'UC';
}

const BIOLOGIC_PATTERN = /英夫利西|阿达木|维得利珠|乌司奴|戈利木|硫唑嘌呤|甲氨蝶呤|环孢素|他克莫司|托法替布|泼尼松|激素|免疫抑制剂/;

/** 统计既往生物制剂 / 免疫抑制剂暴露项数 */
export function biologicExposureFromMedications(medications: string[]): number {
  return medications.filter(m => BIOLOGIC_PATTERN.test(m)).length;
}

/** 是否处于免疫抑制状态：≥2 项免疫相关用药，或病历明确标注免疫抑制 */
export function isImmunosuppressed(medications: string[], tags: string[] = []): boolean {
  return biologicExposureFromMedications(medications) >= 2 || tags.some(t => /免疫抑制/.test(t));
}

interface PathwayLike {
  name: string;
  changePercentage: number;
}

function pickPathway(pathways: PathwayLike[], pattern: RegExp): number {
  const hit = pathways.find(p => pattern.test(p.name));
  return hit ? pathwayScore(hit.changePercentage) : 50;
}

const PW_SCFA = /SCFA|短链脂肪酸/;
const PW_BUTYRATE = /丁酸|Butyrate/i;
const PW_BILE = /胆汁酸/;
const PW_BARRIER = /屏障|紧密连接|Claudin/i;
const PW_INFLAMMATION = /炎症|LPS|TLR4/i;

/**
 * 当前接诊患者 → 相似度特征向量。
 * 全部字段取自既有病历与菌群多组学，不引入任何人工假设值。
 */
export function buildPatientFeatureVector(patient: ClinicalPatient, pkg: PatientDataPackage): SimilarityFeatureVector {
  const pathways = pkg.pathways as PathwayLike[];
  const medications = patient.pastMedications ?? [];
  return {
    diagnosisCategory: diagnosisCategoryFromText(patient.primaryDiagnosis),
    diseaseActivity: diseaseActivityFromMarkers(patient.clinicalMarkers.fecalCalprotectin.value, patient.clinicalMarkers.crp.value),
    biologicExposure: biologicExposureFromMedications(medications),
    age: patient.age,
    bmi: patient.clinicalMarkers.bmi.value,
    crp: patient.clinicalMarkers.crp.value,
    fecalCalprotectin: patient.clinicalMarkers.fecalCalprotectin.value,
    albumin: patient.clinicalMarkers.albumin.value,
    nutritionalRisk: NUTRITION_RISK_INDEX[patient.adaptability.nutritionalRisk] ?? 1,
    immunosuppressed: isImmunosuppressed(medications, patient.diagnosticTags),
    shannonDiversity: patient.microbiomeSummary?.shannonDiversity ?? pkg.microbiomeStats.shannonDiversity,
    dysbiosisScore: patient.adaptability.dysbiosisScore,
    beneficialRatio: patient.microbiomeSummary?.beneficialRatio ?? pkg.microbiomeStats.beneficialRatio,
    scfaScore: pickPathway(pathways, PW_SCFA),
    butyrateScore: pickPathway(pathways, PW_BUTYRATE),
    bileAcidScore: pickPathway(pathways, PW_BILE),
    barrierScore: pickPathway(pathways, PW_BARRIER),
    inflammationPathwayScore: pickPathway(pathways, PW_INFLAMMATION),
    fmtAdaptability: patient.adaptability.overallScore
  };
}

/** 历史样本 → 相似度特征向量，同样全部取自样本自身展示字段 */
export function buildSampleFeatureVector(sample: HistoricalSample): SimilarityFeatureVector {
  const pathways = sample.microbiome.pathways as PathwayLike[];
  return {
    diagnosisCategory: sample.diagnosisCategory,
    diseaseActivity: diseaseActivityFromMarkers(sample.clinicalMarkers.fecalCalprotectin, sample.clinicalMarkers.crp),
    biologicExposure: biologicExposureFromMedications(sample.priorMedications),
    age: sample.age,
    bmi: sample.bmi,
    crp: sample.clinicalMarkers.crp,
    fecalCalprotectin: sample.clinicalMarkers.fecalCalprotectin,
    albumin: sample.clinicalMarkers.albumin,
    nutritionalRisk: NUTRITION_RISK_INDEX[sample.nutritionRisk] ?? 1,
    immunosuppressed: sample.immunosuppressed,
    shannonDiversity: sample.microbiome.shannonDiversity,
    dysbiosisScore: sample.microbiome.dysbiosisScore,
    beneficialRatio: sample.microbiome.beneficialRatio,
    scfaScore: pickPathway(pathways, PW_SCFA),
    butyrateScore: pickPathway(pathways, PW_BUTYRATE),
    bileAcidScore: pickPathway(pathways, PW_BILE),
    barrierScore: pickPathway(pathways, PW_BARRIER),
    inflammationPathwayScore: pickPathway(pathways, PW_INFLAMMATION),
    fmtAdaptability: sample.microbiome.fmtAdaptabilityScore
  };
}

/* ------------------------------ 字段比较表 ------------------------------ */

/**
 * 每个数值字段的「相似度衰减跨度」（near(delta, span)）按该指标在本队列中的真实
 * 取值范围标定，而不是统一取 100 —— 例如 Shannon 实际落在 1.0~4.7 之间，
 * 用 100 做分母会让所有病例都判成「高度相似」，失去区分度。
 */
interface FieldSpec {
  dimension: SimilarityDimensionKey;
  label: string;
  weight: number;
  score: (a: SimilarityFeatureVector, b: SimilarityFeatureVector) => number;
  detail: (a: SimilarityFeatureVector, b: SimilarityFeatureVector) => string;
}

const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();

const FIELD_SPECS: FieldSpec[] = [
  /* ① 临床病情 & 疾病史 */
  {
    dimension: 'clinical', label: '主要诊断分型', weight: 3.0,
    score: (a, b) => (a.diagnosisCategory === b.diagnosisCategory ? 1 : 0.32),
    detail: (a, b) => `当前 ${a.diagnosisCategory} ／ 历史 ${b.diagnosisCategory}`
  },
  {
    dimension: 'clinical', label: '疾病活动度', weight: 2.2,
    score: (a, b) => near(a.diseaseActivity - b.diseaseActivity, 100),
    detail: (a, b) => `活动度指数 当前 ${a.diseaseActivity} ／ 历史 ${b.diseaseActivity}（由 FC、CRP 归一化）`
  },
  {
    dimension: 'clinical', label: '既往免疫/生物制剂暴露', weight: 1.4,
    score: (a, b) => near(a.biologicExposure - b.biologicExposure, 4),
    detail: (a, b) => `暴露项数 当前 ${a.biologicExposure} 项 ／ 历史 ${b.biologicExposure} 项`
  },
  /* ② 身体状态 */
  {
    dimension: 'physical', label: '年龄', weight: 1.4,
    score: (a, b) => near(a.age - b.age, 32),
    detail: (a, b) => `当前 ${a.age} 岁 ／ 历史 ${b.age} 岁`
  },
  {
    dimension: 'physical', label: 'BMI', weight: 1.2,
    score: (a, b) => near(a.bmi - b.bmi, 8),
    detail: (a, b) => `当前 ${f1(a.bmi)} ／ 历史 ${f1(b.bmi)} kg/m²`
  },
  {
    dimension: 'physical', label: 'CRP', weight: 1.2,
    score: (a, b) => near(a.crp - b.crp, 70),
    detail: (a, b) => `当前 ${f1(a.crp)} ／ 历史 ${f1(b.crp)} mg/L`
  },
  {
    dimension: 'physical', label: '粪便钙卫蛋白', weight: 1.6,
    score: (a, b) => near(a.fecalCalprotectin - b.fecalCalprotectin, 900),
    detail: (a, b) => `当前 ${Math.round(a.fecalCalprotectin)} ／ 历史 ${Math.round(b.fecalCalprotectin)} μg/g`
  },
  {
    dimension: 'physical', label: '血清白蛋白', weight: 1.4,
    score: (a, b) => near(a.albumin - b.albumin, 20),
    detail: (a, b) => `当前 ${f1(a.albumin)} ／ 历史 ${f1(b.albumin)} g/L`
  },
  {
    dimension: 'physical', label: '营养风险等级', weight: 1.2,
    score: (a, b) => 1 - Math.abs(a.nutritionalRisk - b.nutritionalRisk) / 2,
    detail: (a, b) => `当前 ${NUTRITION_RISK_LABEL[a.nutritionalRisk]} ／ 历史 ${NUTRITION_RISK_LABEL[b.nutritionalRisk]}`
  },
  {
    dimension: 'physical', label: '免疫状态', weight: 1.6,
    score: (a, b) => (a.immunosuppressed === b.immunosuppressed ? 1 : 0.3),
    detail: (a, b) => `当前 ${a.immunosuppressed ? '存在免疫抑制' : '免疫正常'} ／ 历史 ${b.immunosuppressed ? '存在免疫抑制' : '免疫正常'}`
  },
  /* ③ 菌群微生态 */
  {
    dimension: 'microbiome', label: 'Shannon 多样性', weight: 1.6,
    score: (a, b) => near(a.shannonDiversity - b.shannonDiversity, 2.2),
    detail: (a, b) => `当前 ${f2(a.shannonDiversity)} ／ 历史 ${f2(b.shannonDiversity)}`
  },
  {
    dimension: 'microbiome', label: '菌群失衡评分', weight: 1.6,
    score: (a, b) => near(a.dysbiosisScore - b.dysbiosisScore, 65),
    detail: (a, b) => `当前 ${a.dysbiosisScore} ／ 历史 ${b.dysbiosisScore} 分`
  },
  {
    dimension: 'microbiome', label: '有益菌丰度占比', weight: 1.2,
    score: (a, b) => near(a.beneficialRatio - b.beneficialRatio, 30),
    detail: (a, b) => `当前 ${f1(a.beneficialRatio)}% ／ 历史 ${f1(b.beneficialRatio)}%`
  },
  {
    dimension: 'microbiome', label: 'SCFA 合成通路', weight: 1.2,
    score: (a, b) => near(a.scfaScore - b.scfaScore, 60),
    detail: (a, b) => `通路得分 当前 ${a.scfaScore} ／ 历史 ${b.scfaScore}`
  },
  {
    dimension: 'microbiome', label: '丁酸生成通路', weight: 1.3,
    score: (a, b) => near(a.butyrateScore - b.butyrateScore, 60),
    detail: (a, b) => `通路得分 当前 ${a.butyrateScore} ／ 历史 ${b.butyrateScore}`
  },
  {
    dimension: 'microbiome', label: '次级胆汁酸代谢', weight: 0.9,
    score: (a, b) => near(a.bileAcidScore - b.bileAcidScore, 80),
    detail: (a, b) => `通路得分 当前 ${a.bileAcidScore} ／ 历史 ${b.bileAcidScore}`
  },
  {
    dimension: 'microbiome', label: '黏膜屏障通路', weight: 1.1,
    score: (a, b) => near(a.barrierScore - b.barrierScore, 65),
    detail: (a, b) => `通路得分 当前 ${a.barrierScore} ／ 历史 ${b.barrierScore}`
  },
  {
    dimension: 'microbiome', label: '炎症 LPS 通路', weight: 0.9,
    score: (a, b) => near(a.inflammationPathwayScore - b.inflammationPathwayScore, 70),
    detail: (a, b) => `通路得分 当前 ${a.inflammationPathwayScore} ／ 历史 ${b.inflammationPathwayScore}`
  },
  {
    dimension: 'microbiome', label: 'FMT 适应性评分', weight: 0.8,
    score: (a, b) => near(a.fmtAdaptability - b.fmtAdaptability, 55),
    detail: (a, b) => `当前 ${a.fmtAdaptability} ／ 历史 ${b.fmtAdaptability} 分`
  }
];

const DIMENSION_LABEL: Record<SimilarityDimensionKey, string> = {
  clinical: '临床病情',
  physical: '身体状态',
  microbiome: '菌群微生态'
};

export { DIMENSION_LABEL };

/** 归一化权重：界面滑块为 0-100 的相对值，全为 0 时退回默认配比 */
export function normalizeWeights(weights: SimilarityWeights): SimilarityWeights {
  const sum = weights.clinical + weights.physical + weights.microbiome;
  if (sum <= 0) return { clinical: 0.4, physical: 0.25, microbiome: 0.35 };
  return {
    clinical: weights.clinical / sum,
    physical: weights.physical / sum,
    microbiome: weights.microbiome / sum
  };
}

export const DEFAULT_WEIGHTS: SimilarityWeights = { clinical: 40, physical: 25, microbiome: 35 };

function evaluate(
  a: SimilarityFeatureVector,
  b: SimilarityFeatureVector,
  weights: SimilarityWeights
): SimilarityResult {
  const w = normalizeWeights(weights);

  const perDimension: Record<SimilarityDimensionKey, { weighted: number; total: number }> = {
    clinical: { weighted: 0, total: 0 },
    physical: { weighted: 0, total: 0 },
    microbiome: { weighted: 0, total: 0 }
  };

  const points: SimilarityExplanationPoint[] = FIELD_SPECS.map(spec => {
    const raw = clamp(spec.score(a, b));
    perDimension[spec.dimension].weighted += raw * spec.weight;
    perDimension[spec.dimension].total += spec.weight;
    return {
      dimension: spec.dimension,
      label: spec.label,
      detail: spec.detail(a, b),
      score: raw
    };
  });

  const dimensions: Record<SimilarityDimensionKey, number> = {
    clinical: (perDimension.clinical.weighted / perDimension.clinical.total) * 100,
    physical: (perDimension.physical.weighted / perDimension.physical.total) * 100,
    microbiome: (perDimension.microbiome.weighted / perDimension.microbiome.total) * 100
  };

  const overall =
    dimensions.clinical * w.clinical + dimensions.physical * w.physical + dimensions.microbiome * w.microbiome;

  const matchedPoints = [...points].sort((x, y) => y.score - x.score).filter(p => p.score >= 0.72).slice(0, 4);
  const diffPoints = [...points].sort((x, y) => x.score - y.score).filter(p => p.score <= 0.66).slice(0, 4);

  return {
    overall: Math.round(overall * 10) / 10,
    dimensions: {
      clinical: Math.round(dimensions.clinical * 10) / 10,
      physical: Math.round(dimensions.physical * 10) / 10,
      microbiome: Math.round(dimensions.microbiome * 10) / 10
    },
    matchedPoints,
    diffPoints
  };
}

export interface ScoredSample {
  sample: HistoricalSample;
  similarity: SimilarityResult;
}

/** 对全库执行相似度召回（默认按综合相似度降序） */
export function rankSamples(
  query: SimilarityFeatureVector,
  samples: HistoricalSample[],
  weights: SimilarityWeights
): ScoredSample[] {
  return samples
    .map(sample => ({ sample, similarity: evaluate(query, buildSampleFeatureVector(sample), weights) }))
    .sort((x, y) => y.similarity.overall - x.similarity.overall);
}

/** 单条样本的相似度（用于详情页与对比视图） */
export function scoreSingle(
  query: SimilarityFeatureVector,
  sample: HistoricalSample,
  weights: SimilarityWeights
): SimilarityResult {
  return evaluate(query, buildSampleFeatureVector(sample), weights);
}

/** 相似度分档配色（沿用平台规范） */
export function similarityTone(overall: number): { color: string; label: string } {
  if (overall >= 80) return { color: '#20cfff', label: '高度相似' };
  if (overall >= 60) return { color: '#397cff', label: '中度相似' };
  return { color: '#8996b8', label: '低度相似' };
}
