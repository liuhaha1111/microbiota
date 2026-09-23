// MicroFMT Platform Types & Interfaces

export type ModuleTab = 
  | 'workbench'          // 工作台 (3D微生态孪生驾驶舱)
  | 'patient_center'      // 患者精准诊疗中心 (菌群画像与生态网络)
  | 'donor_matching'      // 供受体智能匹配与精准方案
  | 'efficacy_tracker'    // 疗效与菌群重构监测
  | 'history_library';    // 历史治疗样本参考库 (相似病例 & 方案样本参考)

/**
 * 应用视图。
 *
 * 本项目按「5 块物理屏 ↔ 5 个模块」的 1:1 关系部署，**没有第 6 块屏**。
 * `'home'` 是这 5 块屏的**初始态**（都显示同一个启动台主屏），
 * 而不是一个额外的屏位；从主屏点击入口卡后，对应屏位才加载它的模块。
 */
export type AppView = 'home' | ModuleTab;

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Patient Clinical Profile
export interface ClinicalPatient {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  mrn: string; // 病历号
  contact: string;
  primaryDiagnosis: string;
  stage: string;
  currentPhase: '评估期待' | '菌群检测完成' | '供体已匹配' | '移植执行期' | '随访监测期';
  attendingPhysician: string;
  riskLevel: RiskLevel;
  lastFollowUp: string;
  chiefComplaint: string;
  diagnosticTags: string[];
  pastMedications: string[];
  allergies: string[];
  
  // Clinical markers
  clinicalMarkers: {
    crp: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
    esr: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
    fecalCalprotectin: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
    bmi: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
    albumin: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
    prealbumin: { value: number; unit: string; trend: 'up' | 'down' | 'normal'; isAbnormal: boolean };
  };

  // FMT Adaptability Score
  adaptability: {
    overallScore: number; // 0-100
    dysbiosisScore: number; // 0-100
    inflammationRisk: number; // 0-100
    nutritionalRisk: '低' | '中等' | '高';
    infectionScreening: '已完成(阴性)' | '待复查' | '异常';
    contraindications: '无禁忌' | '相对禁忌' | '绝对禁忌';
    physicianConfirmed: boolean;
  };

  // Patient-specific microbiome summary and mapping helpers
  microbiomeSummary?: {
    shannonDiversity: number;
    beneficialRatio: number;
    pathogenLoad: number;
    dominantDysbiosis: string;
  };
  recommendedDonorCode?: string;
  targetDiseaseNodeId?: string;
  lesionFocusSegment?: string;
}

// Microbial Taxa (Species/Genus level)
export interface MicrobialTaxon {
  id: string;
  name: string;
  chineseName: string;
  phylum: '厚壁菌门(Firmicutes)' | '拟杆菌门(Bacteroidetes)' | '放线菌门(Actinobacteria)' | '变形菌门(Proteobacteria)' | '疣微菌门(Verrucomicrobia)';
  category: 'beneficial' | 'commensal' | 'opportunistic' | 'pathogen';
  abundance: number; // 0-100%
  normalRange: [number, number];
  relativeChange: number; // e.g. -45%
  isDonorDerived: boolean;
  engraftmentStatus: '未定植' | '部分定植' | '稳定定植' | '不适用';
  clinicalRelevance: string;
  primaryMetabolites: string[];
  therapeuticTarget: string;
}

// Ecological Network Link
export interface EcologicalLink {
  source: string;
  target: string;
  type: 'synergy' | 'antagonism' | 'commensal';
  weight: number; // 0.1 to 1.0
  description: string;
}

// Microbial Functional Pathway
export interface FunctionalPathway {
  id: string;
  name: string;
  category: '代谢功能' | '免疫调节' | '屏障保护' | '炎症通路';
  changePercentage: number; // + or -
  status: 'suppressed' | 'activated' | 'normalized';
  mechanism: string;
  relevanceScore: number; // 0-100
}

// Donor Profile
export interface DonorProfile {
  id: string;
  code: string; // e.g. "D-0102"
  age: number;
  gender: '男' | '女';
  bmi: number;
  rating: 'A+' | 'A' | 'B' | 'C';
  donorType: '超级供体(Super Donor)' | '健康志愿者' | '亲属供体';
  screeningStatus: '合格(有效期待定)' | '复筛中' | '临近过期' | '不可用';
  lastScreenedDate: string;
  shannonDiversity: number; // e.g. 5.1
  dominantTaxa: string[];
  pathogenTest: '全部阴性 (0/38项)' | '阴性';
  amrGeneRisk: '极低(无高危耐药基因)' | '低';
  totalDonations: number;
  clinicalSuccessRate: number; // e.g. 88.5%
  idealIndications: string[];
}

// Microbiota Batch
export interface MicrobiotaBatch {
  batchNumber: string;
  donorCode: string;
  sampleDate: string;
  prepDate: string;
  storageTemp: string; // e.g. "-80°C"
  location: string; // e.g. "超低温生物样本库 B-04-12"
  expiryDate: string;
  qualityGrade: '特级 (临床级)' | '优级' | '待评定';
  status: '已释放(可使用)' | '检测中' | '已使用' | '已临期';
  usedInPatient?: string;
  viableCellCount: string; // e.g. "1.2 x 10^11 CFU/g"
}

// Matching Dimensions
export interface MatchEvaluation {
  donorCode: string;
  overallScore: number; // e.g. 91.6
  dimensions: {
    microbiomeComplementarity: number; // 菌群互补
    functionalGain: number;            // 功能互补
    safetyProfile: number;             // 安全性
    colonizationPotential: number;     // 定植潜力
    historicalEfficacy: number;        // 历史疗效
    diseaseSuitability: number;        // 疾病适配
  };
  advantages: string[];
  potentialRisks: string[];
  aiRecommendation: string;
}

// FMT Treatment Prescription
export interface FMTTreatmentProtocol {
  protocolVersion: string;
  dateCreated: string;
  author: string;
  administrationRoute: '肠溶胶囊(微囊化)' | '结肠镜直达回盲部' | '鼻肠管注入' | '保留灌肠';
  recommendedDose: string;
  frequency: string;
  treatmentDuration: string;
  bowelPreparation: string;
  preTreatment: string;
  combinedTherapy: string;
  nutritionalIntervention: string;
  reviewMilestones: string[];
  approvalStatus: '医生已签署' | '待MDT二次复核' | '草稿';
}

// Safety Rule Gate
export interface SafetyRuleGate {
  id: string;
  name: string;
  category: '感染排查' | '供体有效性' | '菌液质控' | '宿主禁忌' | '知情同意';
  status: 'passed' | 'pending' | 'blocked';
  detail: string;
  mandatory: boolean;
}

// Longitudinal Efficacy Point
export interface LongitudinalTrackPoint {
  stage: string;
  label: string;
  date: string;
  shannonDiversity: number;
  donorEngraftmentRate: number; // 0-100%
  fecalCalprotectin: number;    // ug/g
  mayoScore: number;            // 0-12
  scfaSynthesisScore: number;   // 0-100
  dominantBeneficialRatio: number; // 0-100%
  symptomReliefPercentage: number;
}

// Knowledge Graph Node and Link
export interface KnowledgeNode {
  id: string;
  name: string;
  /**
   * 图谱内展示用的短名。节点标签在画布上横向空间有限，
   * 全称（含拉丁学名/英文缩写）会互相压盖，故单独给出精简名。
   */
  shortName?: string;
  type: 'disease' | 'microbe' | 'metabolite' | 'immune' | 'therapy';
  categoryLabel: string;
  description: string;
  val: number; // size
  /**
   * 图谱密度分级。缺省视为 'core'。
   * core：构成知识图谱主干的实体，任何画布尺寸下都渲染；
   * extended：适应症外延与补充知识，仅在「全量知识库」密度下渲染。
   */
  tier?: 'core' | 'extended';
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface KnowledgeLink {
  source: string | KnowledgeNode;
  target: string | KnowledgeNode;
  relation: string;
  effect: 'positive' | 'negative' | 'neutral';
}

/* ============================================================================
 * 历史治疗样本参考库（第五模块）
 * 面向临床医生单病例研判：以当前接诊患者为查询输入 → 多维度相似度召回
 * 历史已闭环 FMT 病例 → 展开完整诊疗档案 + 历史方案样本 → 参考复制草稿。
 * ========================================================================== */

/** 适应症大类（相似度匹配的第一层硬约束） */
export type DiseaseCategory = 'UC' | 'CD' | 'rCDI' | 'IBS-D' | 'IBD-U';

/** 最终临床结局标签 */
export type SampleOutcome = 'remission' | 'partial' | 'no_response' | 'relapse';

/** 历史案例标签（知识规则中心可维护） */
export type SampleCaseTag =
  | 'MDT疑难病例'
  | '胶囊FMT典型'
  | '重症IBD'
  | '难治复发病例'
  | '老年低营养'
  | '免疫抑制宿主'
  | '超高龄SAE警示'
  | '生物制剂初治';

/** 样本库管理状态 */
export type SampleLibraryStatus = 'in_library' | 'blocked';

/** 三维度相似度权重（界面可调，归一化前为百分比） */
export interface SimilarityWeights {
  clinical: number;
  physical: number;
  microbiome: number;
}

/**
 * 相似度特征向量。
 * 不落库、不冗余存储：两侧都由各自权威字段实时派生
 * （当前患者 ← 病历 + 菌群多组学；历史样本 ← 入库档案 + 通路实测值），
 * 保证「详情页展示的数值」与「参与打分的数值」永远一致。
 */
export interface SimilarityFeatureVector {
  // ① 临床病情 & 疾病史
  diagnosisCategory: DiseaseCategory;
  diseaseActivity: number;        // 0-100 归一化活动度
  biologicExposure: number;       // 既往生物制剂/免疫抑制剂暴露项数
  // ② 身体状态
  age: number;
  bmi: number;
  crp: number;                    // mg/L
  fecalCalprotectin: number;      // μg/g
  albumin: number;                // g/L
  nutritionalRisk: 0 | 1 | 2;     // 低 / 中等 / 高
  immunosuppressed: boolean;
  // ③ 菌群微生态
  shannonDiversity: number;
  dysbiosisScore: number;         // 0-100
  beneficialRatio: number;        // %
  scfaScore: number;              // 0-100
  butyrateScore: number;
  bileAcidScore: number;
  barrierScore: number;
  inflammationPathwayScore: number;
  fmtAdaptability: number;        // 0-100
}

export type SimilarityDimensionKey = 'clinical' | 'physical' | 'microbiome';

/** 单条相似 / 差异说明 */
export interface SimilarityExplanationPoint {
  dimension: SimilarityDimensionKey;
  label: string;
  /** 两侧取值的人话描述，例如「当前 632 μg/g ／ 历史 210 μg/g」 */
  detail: string;
  /** 0-1，越高越像 */
  score: number;
}

export interface SimilarityResult {
  overall: number;                // 0-100
  dimensions: Record<SimilarityDimensionKey, number>;
  matchedPoints: SimilarityExplanationPoint[];
  diffPoints: SimilarityExplanationPoint[];
}

/** 肠道微生态数字孪生快照指标 */
export interface TwinSnapshot {
  ecologicalStability: number;
  dysbiosisDegree: number;
  donorEngraftment: number;
  inflammationLevel: number;
  functionalRecovery: number;
}

export interface HistoryAdverseEvent {
  id: string;
  timing: string;
  type: string;
  severity: '轻度' | '中度' | '严重(SAE)';
  handling: string;
  isSAE: boolean;
}

export interface HistoryExecutionRecord {
  seq: string;
  date: string;
  route: string;
  actualDose: string;
  tolerance: string;
  immediateAE: string;
  operator: string;
}

export interface HistoryProtocolVersion {
  version: string;
  date: string;
  author: string;
  summary: string;
  /** 相对上一版的修改项 */
  changes: string[];
  protocol: FMTTreatmentProtocol;
}

export interface HistoricalDonorMatch {
  donorCode: string;
  donorRating: 'A+' | 'A' | 'B' | 'C';
  donorType: string;
  overallScore: number;
  dimensions: MatchEvaluation['dimensions'];
  advantages: string[];
  potentialRisks: string[];
  matchDate: string;
}

export interface HistoricalMicrobiome {
  shannonDiversity: number;
  dysbiosisScore: number;
  beneficialRatio: number;
  pathogenLoad: number;
  fmtAdaptabilityScore: number;
  dominantFeature: string;
  taxa: MicrobialTaxon[];
  ecologicalLinks: EcologicalLink[];
  pathways: FunctionalPathway[];
  twin: { pre: TwinSnapshot; post: TwinSnapshot };
}

/** 一条完整闭环的历史治疗样本 */
export interface HistoricalSample {
  id: string;                     // H-001
  anonymizedMrn: string;          // 脱敏病历编号
  gender: '男' | '女';
  age: number;
  bmi: number;
  diagnosisCategory: DiseaseCategory;
  diagnosisLabel: string;
  diseaseStage: string;
  diseaseActivityLabel: string;
  nutritionRisk: '低' | '中等' | '高';
  immuneStatus: string;
  immunosuppressed: boolean;
  contraindicationNote: string;
  allergyNote: string;
  comorbidities: string[];
  surgicalHistory: string[];
  priorMedications: string[];
  infectionScreening: string;
  clinicalMarkers: {
    crp: number;
    esr: number;
    fecalCalprotectin: number;
    albumin: number;
    prealbumin: number;
  };
  microbiome: HistoricalMicrobiome;
  donorMatch: HistoricalDonorMatch;
  protocolVersions: HistoryProtocolVersion[];
  safetyGates: SafetyRuleGate[];
  executionRecords: HistoryExecutionRecord[];
  longitudinalPoints: LongitudinalTrackPoint[];
  adverseEvents: HistoryAdverseEvent[];
  outcome: SampleOutcome;
  outcomeLabel: string;
  followUpWeeks: number;
  finalEngraftmentRate: number;
  mdtDiscussed: boolean;
  mdtNotes: string[];
  physicianNotes: string[];
  caseTags: SampleCaseTag[];
  libraryStatus: SampleLibraryStatus;
  typicalCase: boolean;
  allowClinicalReference: boolean;
  /** 数据完整度，< 100 的病例按规则禁止入库 */
  dataCompleteness: number;
}
