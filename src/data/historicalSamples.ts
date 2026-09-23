import {
  EcologicalLink,
  FMTTreatmentProtocol,
  FunctionalPathway,
  HistoricalSample,
  HistoryProtocolVersion,
  LongitudinalTrackPoint,
  MicrobialTaxon,
  SafetyRuleGate,
  TwinSnapshot
} from '../types';

/* ============================================================================
 * 历史治疗样本参考库 · 入库数据集
 * 仅收录「完整走完 FMT 诊疗闭环」的历史病例：评估 → 菌群画像 → 供受体匹配
 * → 方案制定 → 执行 → 随访结局 → 不良事件，字段齐全方可入库。
 * 所有患者姓名已脱敏，仅保留病历编号。
 * ========================================================================== */

/* ------------------------------ 构造 helper ------------------------------ */

interface TaxonSeed {
  id: string;
  name: string;
  chineseName: string;
  phylum: MicrobialTaxon['phylum'];
  category: MicrobialTaxon['category'];
  normalRange: [number, number];
  baseline: number;
  isDonorDerived: boolean;
  clinicalRelevance: string;
  primaryMetabolites: string[];
  therapeuticTarget: string;
}

const TAXA_SEEDS: TaxonSeed[] = [
  {
    id: 'ht-akk',
    name: 'Akkermansia muciniphila',
    chineseName: '嗜黏蛋白阿克曼氏菌 (AKK菌)',
    phylum: '疣微菌门(Verrucomicrobia)',
    category: 'beneficial',
    normalRange: [1.5, 4.0],
    baseline: 0.2,
    isDonorDerived: true,
    clinicalRelevance: '黏膜屏障守护菌，降解外层黏蛋白刺激 Claudin-1 表达，抗炎定植关键靶标。',
    primaryMetabolites: ['乙酸', '丙酸', '外膜蛋白Amuc_1100'],
    therapeuticTarget: '促进肠道紧密连接重建，阻遏内毒素细菌入血'
  },
  {
    id: 'ht-fprau',
    name: 'Faecalibacterium prausnitzii',
    chineseName: '普氏栖粪杆菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'beneficial',
    normalRange: [5.0, 12.0],
    baseline: 0.9,
    isDonorDerived: true,
    clinicalRelevance: '人体肠道最主要丁酸生成菌之一，分泌 MAM 抗炎蛋白，抑制 NF-κB 通路。',
    primaryMetabolites: ['丁酸 (Butyrate)', '抗炎多肽MAM'],
    therapeuticTarget: '核心供能结肠上皮细胞，控制炎症因子激增'
  },
  {
    id: 'ht-blon',
    name: 'Bifidobacterium longum',
    chineseName: '长双歧杆菌',
    phylum: '放线菌门(Actinobacteria)',
    category: 'beneficial',
    normalRange: [3.0, 8.0],
    baseline: 1.1,
    isDonorDerived: true,
    clinicalRelevance: '调节 Th1/Th2 平衡，抑制致病菌黏附，降低肠腔 pH 值。',
    primaryMetabolites: ['乙酸', '乳酸', '细菌素'],
    therapeuticTarget: '酸化肠道微环境，抑制兼性厌氧菌过度增殖'
  },
  {
    id: 'ht-rose',
    name: 'Roseburia intestinalis',
    chineseName: '肠道罗斯氏菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'beneficial',
    normalRange: [2.5, 6.0],
    baseline: 0.6,
    isDonorDerived: true,
    clinicalRelevance: '利用膳食多糖产生大量丁酸，与 Foxp3+ Treg 分化密切正相关。',
    primaryMetabolites: ['丁酸', '甲酸'],
    therapeuticTarget: '诱导 Treg 细胞活化，恢复免疫耐受'
  },
  {
    id: 'ht-bact',
    name: 'Bacteroides vulgatus',
    chineseName: '普通拟杆菌',
    phylum: '拟杆菌门(Bacteroidetes)',
    category: 'commensal',
    normalRange: [6.0, 14.0],
    baseline: 5.2,
    isDonorDerived: false,
    clinicalRelevance: '多糖酵解核心共生菌，维持肠道厌氧生态位与定植抗力基础。',
    primaryMetabolites: ['丙酸', '琥珀酸'],
    therapeuticTarget: '占据厌氧生态位，竞争性排斥兼性厌氧致病菌'
  },
  {
    id: 'ht-prev',
    name: 'Prevotella copri',
    chineseName: '粪普雷沃菌',
    phylum: '拟杆菌门(Bacteroidetes)',
    category: 'commensal',
    normalRange: [2.0, 7.0],
    baseline: 1.6,
    isDonorDerived: false,
    clinicalRelevance: '高纤维膳食关联菌，其丰度异常升高与部分 IBD 亚型炎症加重相关。',
    primaryMetabolites: ['乙酸', '丙酸'],
    therapeuticTarget: '作为膳食-菌群响应指标，指导营养干预强度'
  },
  {
    id: 'ht-ecoli',
    name: 'Escherichia coli',
    chineseName: '大肠埃希菌 (含 AIEC 黏附表型)',
    phylum: '变形菌门(Proteobacteria)',
    category: 'opportunistic',
    normalRange: [0.5, 2.5],
    baseline: 2.1,
    isDonorDerived: false,
    clinicalRelevance: '兼性厌氧条件致病菌，缺氧耐受使其在黏膜炎症微环境中优先扩张。',
    primaryMetabolites: ['脂多糖(LPS)', '三甲胺'],
    therapeuticTarget: '抑制兼性厌氧扩张，降低内毒素负荷'
  },
  {
    id: 'ht-kleb',
    name: 'Klebsiella pneumoniae',
    chineseName: '肺炎克雷伯菌',
    phylum: '变形菌门(Proteobacteria)',
    category: 'opportunistic',
    normalRange: [0.1, 1.0],
    baseline: 0.4,
    isDonorDerived: false,
    clinicalRelevance: '肠杆菌科过度增殖标志物，与菌群失衡评分、黏膜炎症呈显著正相关。',
    primaryMetabolites: ['脂多糖(LPS)'],
    therapeuticTarget: '作为菌群失衡关键监测指标，触发强化 FMT 决策'
  },
  {
    id: 'ht-entero',
    name: 'Enterococcus faecalis',
    chineseName: '粪肠球菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'opportunistic',
    normalRange: [0.1, 1.2],
    baseline: 0.3,
    isDonorDerived: false,
    clinicalRelevance: '抗生素暴露后高频扩张菌，是继发血流感染的潜在来源，移植前需重点评估。',
    primaryMetabolites: ['乳酸', '胞外聚合物'],
    therapeuticTarget: '降低免疫抑制宿主继发感染风险'
  },
  {
    id: 'ht-cdiff',
    name: 'Clostridioides difficile',
    chineseName: '产毒艰难梭菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'pathogen',
    normalRange: [0, 0.05],
    baseline: 0,
    isDonorDerived: false,
    clinicalRelevance: '产毒株占位性扩张直接导致毒素性结肠炎，是 rCDI 的确定性病原。',
    primaryMetabolites: ['毒素A', '毒素B', '二元毒素'],
    therapeuticTarget: 'FMT 一线清除目标，重建次级胆汁酸定植抗力'
  }
];

type TaxonKey = (typeof TAXA_SEEDS)[number]['id'];

/** 按丰度配置生成菌种谱，相对偏差由正常区间中值确定性推导 */
function buildTaxa(
  abundance: Partial<Record<TaxonKey, number>>,
  engraftment: Partial<Record<TaxonKey, MicrobialTaxon['engraftmentStatus']>> = {}
): MicrobialTaxon[] {
  return TAXA_SEEDS.map(seed => {
    const value = abundance[seed.id] ?? seed.baseline;
    const mid = (seed.normalRange[0] + seed.normalRange[1]) / 2;
    const ratio = mid > 0 ? ((value - mid) / mid) * 100 : value > 0 ? 100 : 0;
    return {
      id: seed.id,
      name: seed.name,
      chineseName: seed.chineseName,
      phylum: seed.phylum,
      category: seed.category,
      abundance: value,
      normalRange: [seed.normalRange[0], seed.normalRange[1]],
      relativeChange: Math.round(ratio),
      isDonorDerived: seed.isDonorDerived,
      engraftmentStatus: engraftment[seed.id] ?? '不适用',
      clinicalRelevance: seed.clinicalRelevance,
      primaryMetabolites: [...seed.primaryMetabolites],
      therapeuticTarget: seed.therapeuticTarget
    };
  });
}

/** 菌群生态网络连边：三种失衡强度共用同一套语义骨架 */
function buildLinks(severity: 'severe' | 'moderate' | 'mild'): EcologicalLink[] {
  const opportunistic = severity === 'severe' ? 'ht-ecoli' : 'ht-kleb';
  return [
    { source: 'ht-fprau', target: 'ht-rose', type: 'synergy', weight: 0.86, description: '共代谢膳食多糖产丁酸，协同供能结肠上皮' },
    { source: 'ht-fprau', target: 'ht-blon', type: 'synergy', weight: 0.72, description: '交叉喂养：双歧杆菌产乙酸供丁酸菌利用' },
    { source: 'ht-akk', target: 'ht-blon', type: 'commensal', weight: 0.58, description: '共同维护黏液层厚度与肠腔低氧环境' },
    { source: 'ht-bact', target: 'ht-akk', type: 'synergy', weight: 0.64, description: '拟杆菌酵解产物为 AKK 提供底物' },
    { source: 'ht-bact', target: opportunistic, type: 'antagonism', weight: severity === 'severe' ? 0.32 : 0.66, description: '定植抗力：厌氧优势菌竞争排斥兼性厌氧菌' },
    { source: opportunistic, target: 'ht-prev', type: 'antagonism', weight: severity === 'severe' ? 0.48 : 0.7, description: '炎症微环境下普雷沃菌与肠杆菌科相互抑制' },
    { source: 'ht-fprau', target: opportunistic, type: 'antagonism', weight: severity === 'severe' ? 0.26 : 0.6, description: '丁酸下调肠腔 pH，抑制肠杆菌科过度增殖' },
    { source: 'ht-entero', target: 'ht-bact', type: 'antagonism', weight: 0.44, description: '抗生素暴露后肠球菌对共生拟杆菌的占位竞争' }
  ];
}

interface PathwaySeed {
  id: string;
  name: string;
  category: FunctionalPathway['category'];
  mechanism: string;
}

const PATHWAY_SEEDS: PathwaySeed[] = [
  { id: 'hp-scfa', name: 'SCFA 短链脂肪酸合成', category: '代谢功能', mechanism: '普氏栖粪杆菌/罗斯氏菌经乙酸-辅酶A途径合成短链脂肪酸，为结肠上皮供能。' },
  { id: 'hp-buty', name: '丁酸生成通路', category: '代谢功能', mechanism: '丁酸作为 HDAC 抑制剂诱导 Foxp3+ Treg 分化，阻断促炎细胞因子释放。' },
  { id: 'hp-bile', name: '次级胆汁酸代谢', category: '代谢功能', mechanism: '胆盐水解酶(BSH)将初级胆酸转化为脱氧胆酸，竞争性抑制艰难梭菌芽孢萌发。' },
  { id: 'hp-barrier', name: '黏膜屏障保护', category: '屏障保护', mechanism: 'AKK 外膜蛋白 Amuc_1100 结合 TLR2，强化紧密连接 Claudin-1 表达。' },
  { id: 'hp-lps', name: '炎症 LPS 通路', category: '炎症通路', mechanism: '肠杆菌科 LPS 经 TLR4/NF-κB 轴放大黏膜炎症，是内毒素负荷的直接读数。' }
];

/** 五条核心功能通路的相对变化（正=功能增强，负=受损） */
function buildPathways(change: Record<string, number>): FunctionalPathway[] {
  return PATHWAY_SEEDS.map(seed => {
    const changePercentage = change[seed.id] ?? 0;
    return {
      id: seed.id,
      name: seed.name,
      category: seed.category,
      changePercentage,
      status: changePercentage >= 5 ? 'activated' : changePercentage <= -5 ? 'suppressed' : 'normalized',
      mechanism: seed.mechanism,
      relevanceScore: Math.max(8, Math.min(100, Math.round(Math.abs(changePercentage) * 1.2 + 20)))
    };
  });
}

interface GateSeed {
  id: string;
  name: string;
  category: SafetyRuleGate['category'];
  mandatory: boolean;
  defaultDetail: string;
}

const GATE_SEEDS: GateSeed[] = [
  { id: 'hg-inf1', name: '供体 38 项感染病原筛查', category: '感染排查', mandatory: true, defaultDetail: 'HIV/HBV/HCV/梅毒/多重耐药菌全部阴性' },
  { id: 'hg-inf2', name: '受体感染活动期排查', category: '感染排查', mandatory: true, defaultDetail: '血/粪培养阴性，无活动性全身感染' },
  { id: 'hg-don1', name: '供体菌液活性与效期核验', category: '供体有效性', mandatory: true, defaultDetail: '活菌计数与剩余效期均满足执行窗口' },
  { id: 'hg-don2', name: '供受体菌群互补度复核', category: '供体有效性', mandatory: false, defaultDetail: '互补度得分达到预设阈值' },
  { id: 'hg-qc1', name: '菌液批次 cGMP 质控放行', category: '菌液质控', mandatory: true, defaultDetail: '批次放行报告齐全，基因组 Q30 > 92%' },
  { id: 'hg-qc2', name: '冷链温控曲线完整性', category: '菌液质控', mandatory: true, defaultDetail: '-80°C 全程温控曲线无断点' },
  { id: 'hg-hos1', name: '宿主绝对禁忌症排查', category: '宿主禁忌', mandatory: true, defaultDetail: '无肠梗阻、穿孔、活动性大出血' },
  { id: 'hg-hos2', name: '免疫抑制与感染风险分层', category: '宿主禁忌', mandatory: true, defaultDetail: '免疫抑制状态已分级并制定监护方案' },
  { id: 'hg-con1', name: '知情同意签署与随访承诺', category: '知情同意', mandatory: true, defaultDetail: '患者/家属已签署并承诺完成随访节点' },
  { id: 'hg-con2', name: 'MDT 多学科复核意见', category: '知情同意', mandatory: false, defaultDetail: 'MDT 讨论纪要已归档' }
];

function buildGates(
  overrides: Partial<Record<string, SafetyRuleGate['status']>> = {},
  details: Partial<Record<string, string>> = {}
): SafetyRuleGate[] {
  return GATE_SEEDS.map(seed => ({
    id: seed.id,
    name: seed.name,
    category: seed.category,
    status: overrides[seed.id] ?? 'passed',
    detail: details[seed.id] ?? seed.defaultDetail,
    mandatory: seed.mandatory
  }));
}

interface TrackSeed {
  stage: string;
  label: string;
  date: string;
  shannon: number;
  engraft: number;
  fc: number;
  mayo: number;
  scfa: number;
  beneficial: number;
  relief: number;
}

const track = (s: TrackSeed): LongitudinalTrackPoint => ({
  stage: s.stage,
  label: s.label,
  date: s.date,
  shannonDiversity: s.shannon,
  donorEngraftmentRate: s.engraft,
  fecalCalprotectin: s.fc,
  mayoScore: s.mayo,
  scfaSynthesisScore: s.scfa,
  dominantBeneficialRatio: s.beneficial,
  symptomReliefPercentage: s.relief
});

const twin = (
  ecologicalStability: number,
  dysbiosisDegree: number,
  donorEngraftment: number,
  inflammationLevel: number,
  functionalRecovery: number
): TwinSnapshot => ({ ecologicalStability, dysbiosisDegree, donorEngraftment, inflammationLevel, functionalRecovery });

function proto(cfg: {
  v: string;
  date: string;
  author: string;
  route: FMTTreatmentProtocol['administrationRoute'];
  dose: string;
  freq: string;
  duration: string;
  prep: string;
  pre: string;
  combo: string;
  nutrition: string;
  milestones: string[];
  approval: FMTTreatmentProtocol['approvalStatus'];
}): FMTTreatmentProtocol {
  return {
    protocolVersion: cfg.v,
    dateCreated: cfg.date,
    author: cfg.author,
    administrationRoute: cfg.route,
    recommendedDose: cfg.dose,
    frequency: cfg.freq,
    treatmentDuration: cfg.duration,
    bowelPreparation: cfg.prep,
    preTreatment: cfg.pre,
    combinedTherapy: cfg.combo,
    nutritionalIntervention: cfg.nutrition,
    reviewMilestones: cfg.milestones,
    approvalStatus: cfg.approval
  };
}

const version = (
  v: string,
  date: string,
  author: string,
  summary: string,
  changes: string[],
  protocol: FMTTreatmentProtocol
): HistoryProtocolVersion => ({ version: v, date, author, summary, changes, protocol });

/* ------------------------------ 样本数据 ------------------------------ */

export const historicalSamples: HistoricalSample[] = [
  /* ---------------------------- H-001 胶囊方案典型 ---------------------------- */
  {
    id: 'H-001',
    anonymizedMrn: 'MRN-H2025-001',
    gender: '男',
    age: 34,
    bmi: 18.3,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 左半结肠型, 中度活动期)',
    diseaseStage: '左半结肠型 · 直肠至降结肠弥漫糜烂',
    diseaseActivityLabel: 'Mayo 7 分 · 中度活动期',
    nutritionRisk: '中等',
    immuneStatus: '免疫正常（无免疫抑制剂暴露）',
    immunosuppressed: false,
    contraindicationNote: '无绝对禁忌症',
    allergyNote: '青霉素皮试阳性',
    comorbidities: ['轻度脂肪肝'],
    surgicalHistory: ['无'],
    priorMedications: ['美沙拉嗪缓释颗粒 4g/d', '泼尼松 20mg/d（已减停 3 个月）'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 22.4, esr: 41, fecalCalprotectin: 588, albumin: 33.6, prealbumin: 178 },
    microbiome: {
      shannonDiversity: 2.28,
      dysbiosisScore: 70,
      beneficialRatio: 19.8,
      pathogenLoad: 40.2,
      fmtAdaptabilityScore: 87,
      dominantFeature: '产丁酸菌群塌陷，兼性厌氧肠杆菌科扩张',
      taxa: buildTaxa({ 'ht-akk': 0.22, 'ht-fprau': 1.05, 'ht-blon': 1.35, 'ht-rose': 0.7, 'ht-bact': 5.4, 'ht-ecoli': 5.6, 'ht-kleb': 1.6 }),
      ecologicalLinks: buildLinks('moderate'),
      pathways: buildPathways({ 'hp-scfa': -46, 'hp-buty': -52, 'hp-bile': -28, 'hp-barrier': -34, 'hp-lps': 74 }),
      twin: { pre: twin(38, 70, 0, 66, 32), post: twin(79, 24, 72, 26, 74) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 91.6,
      dimensions: { microbiomeComplementarity: 94, functionalGain: 92, safetyProfile: 97, colonizationPotential: 88, historicalEfficacy: 89, diseaseSuitability: 90 },
      advantages: ['供体富含普氏栖粪杆菌与 AKK 菌，直接补齐受体两大缺口菌', '次级胆汁酸代谢通路完整，定植抗力重建潜力高', '供体无 IBD 家族史，安全性评级 A+'],
      potentialRisks: ['受体既往激素暴露，需警惕早期一过性低热', '供体菌液含少量拟杆菌属，重度免疫抑制宿主需谨慎'],
      matchDate: '2025-03-12'
    },
    protocolVersions: [
      version('v1.0', '2025-03-14', 'AI 决策辅助引擎', 'AI 初始方案：单疗程肠溶胶囊序贯，标准剂量',
        ['初版方案生成', '移植路径：肠溶胶囊(微囊化)', '疗程 4 周，每周 2 次'],
        proto({
          v: 'v1.0', date: '2025-03-14', author: 'AI 决策辅助引擎',
          route: '肠溶胶囊(微囊化)', dose: '菌液 60mL/次（约 1.2×10^11 CFU）', freq: '每周 2 次',
          duration: '连续 4 周（共 8 次）', prep: '移植前 1 日半流质饮食，当日口服聚乙二醇清肠',
          pre: '移植前 30 分钟口服奥美拉唑 20mg 抑酸',
          combo: '美沙拉嗪 4g/d 维持不变', nutrition: '高纤维膳食 + 益生元 10g/d',
          milestones: ['第 2 周耐受性评估', '第 4 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-03-16', '陈建国 主任医师', '医生调整：受体营养储备偏低，追加营养干预强度并延长至 6 周',
        ['疗程 4 周 → 6 周', '新增：口服营养补充(ONS) 每日 400kcal', '新增：移植前益生元预适应 7 天'],
        proto({
          v: 'v1.1', date: '2025-03-16', author: '陈建国 主任医师',
          route: '肠溶胶囊(微囊化)', dose: '菌液 60mL/次（约 1.2×10^11 CFU）', freq: '每周 2 次',
          duration: '连续 6 周（共 12 次）', prep: '移植前 1 日半流质饮食，当日口服聚乙二醇清肠',
          pre: '移植前 30 分钟口服奥美拉唑 20mg 抑酸；移植前 7 天益生元预适应',
          combo: '美沙拉嗪 4g/d 维持不变', nutrition: '高纤维膳食 + 益生元 10g/d + ONS 400kcal/d',
          milestones: ['第 2 周耐受性评估', '第 6 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '待MDT二次复核'
        })
      ),
      version('v1.2', '2025-03-18', 'FMT MDT 多学科小组', 'MDT 修订：确认 6 周疗程，增设免疫抑制风险监护条款',
        ['确认 v1.1 全部参数', '新增：每次移植后 72 小时体温与排便日记上报', '新增：若第 6 周 Mayo 下降 < 3 分则启动追加单剂预案'],
        proto({
          v: 'v1.2', date: '2025-03-18', author: 'FMT MDT 多学科小组',
          route: '肠溶胶囊(微囊化)', dose: '菌液 60mL/次（约 1.2×10^11 CFU）', freq: '每周 2 次',
          duration: '连续 6 周（共 12 次）', prep: '移植前 1 日半流质饮食，当日口服聚乙二醇清肠',
          pre: '移植前 30 分钟口服奥美拉唑 20mg 抑酸；移植前 7 天益生元预适应',
          combo: '美沙拉嗪 4g/d 维持不变；暂停任何抗生素 14 天',
          nutrition: '高纤维膳食 + 益生元 10g/d + ONS 400kcal/d',
          milestones: ['第 2 周耐受性评估', '第 6 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-con2': 'passed' },
      { 'hg-don2': '互补度 94 分，远高于 80 分阈值', 'hg-hos2': '无免疫抑制暴露，按低风险分层监护' }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-03-20', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '陈建国 主任医师' },
      { seq: 'FMT #4', date: '2025-04-03', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '轻度腹胀，18 小时自行消退', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #8', date: '2025-04-17', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #12', date: '2025-05-08', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-03-19', shannon: 2.28, engraft: 0, fc: 588, mayo: 7, scfa: 31, beneficial: 19.8, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周', date: '2025-04-02', shannon: 2.86, engraft: 26, fc: 412, mayo: 6, scfa: 44, beneficial: 27.5, relief: 22 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-04-16', shannon: 3.42, engraft: 48, fc: 268, mayo: 4, scfa: 58, beneficial: 35.2, relief: 45 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-06-11', shannon: 4.18, engraft: 71, fc: 96, mayo: 2, scfa: 76, beneficial: 46.8, relief: 78 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-09-03', shannon: 4.36, engraft: 74, fc: 62, mayo: 1, scfa: 82, beneficial: 51.4, relief: 89 })
    ],
    adverseEvents: [
      { id: 'ae-1-1', timing: 'FMT #4 次日', type: '轻度腹胀伴排气增多', severity: '轻度', handling: '观察，未予药物干预，18 小时后自行缓解', isSAE: false },
      { id: 'ae-1-2', timing: 'FMT #5 当晚', type: '一过性低热 37.4°C', severity: '轻度', handling: '多饮水，物理降温，次日晨体温正常，血培养阴性', isSAE: false }
    ],
    outcome: 'remission',
    outcomeLabel: '临床缓解（24 周随访）',
    followUpWeeks: 24,
    finalEngraftmentRate: 74,
    mdtDiscussed: true,
    mdtNotes: [
      '受体为左半结肠型中度活动期 UC，菌群失衡模式以「产丁酸菌塌陷 + 肠杆菌科扩张」为主，属于 FMT 应答预期较好的表型。',
      '激素已减停 3 个月，免疫抑制窗口关闭，可排除免疫抑制导致的定植障碍。',
      '关键决策理由：营养储备偏低（白蛋白 33.6 g/L），单靠胶囊序贯难以支撑菌群定植所需的黏膜修复底物，故追加 ONS 与益生元预适应。',
      '讨论结论：采用 6 周肠溶胶囊序贯方案，不启用结肠镜，降低有创操作风险。'
    ],
    physicianNotes: [
      '该患者最大特点是「菌群缺口清晰」——补上普氏栖粪杆菌与 AKK 后应答快，第 4 周 Mayo 已降至 4 分。',
      '建议同类病例（左半结肠型、无免疫抑制、白蛋白 < 35 g/L）可直接参考本方案的营养干预强度。'
    ],
    caseTags: ['胶囊FMT典型', 'MDT疑难病例'],
    libraryStatus: 'in_library',
    typicalCase: true,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-002 重症 IBD 部分应答 ---------------------------- */
  {
    id: 'H-002',
    anonymizedMrn: 'MRN-H2025-002',
    gender: '女',
    age: 41,
    bmi: 19.6,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 全结肠型, 重度活动期)',
    diseaseStage: '全结肠型 · 广泛深凿溃疡伴假息肉',
    diseaseActivityLabel: 'Mayo 10 分 · 重度活动期（激素依赖）',
    nutritionRisk: '中等',
    immuneStatus: '部分免疫抑制（激素依赖 + 既往硫唑嘌呤）',
    immunosuppressed: true,
    contraindicationNote: '相对禁忌：激素依赖状态下需强化感染监护',
    allergyNote: '无已知过敏',
    comorbidities: ['缺铁性贫血', '焦虑状态'],
    surgicalHistory: ['无'],
    priorMedications: ['泼尼松 30mg/d（依赖）', '硫唑嘌呤 100mg/d（既往，因肝酶升高停用）', '英夫利西单抗（原发无应答）'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 46.8, esr: 58, fecalCalprotectin: 812, albumin: 30.2, prealbumin: 142 },
    microbiome: {
      shannonDiversity: 1.86,
      dysbiosisScore: 81,
      beneficialRatio: 13.4,
      pathogenLoad: 51.6,
      fmtAdaptabilityScore: 76,
      dominantFeature: '丁酸通路近乎停摆，肠杆菌科与肠球菌双扩张',
      taxa: buildTaxa({ 'ht-akk': 0.12, 'ht-fprau': 0.55, 'ht-blon': 0.9, 'ht-rose': 0.4, 'ht-bact': 4.1, 'ht-ecoli': 7.8, 'ht-kleb': 2.6, 'ht-entero': 1.9 }),
      ecologicalLinks: buildLinks('severe'),
      pathways: buildPathways({ 'hp-scfa': -64, 'hp-buty': -71, 'hp-bile': -42, 'hp-barrier': -56, 'hp-lps': 96 }),
      twin: { pre: twin(26, 81, 0, 82, 20), post: twin(58, 44, 51, 48, 52) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 88.4,
      dimensions: { microbiomeComplementarity: 93, functionalGain: 90, safetyProfile: 92, colonizationPotential: 74, historicalEfficacy: 86, diseaseSuitability: 88 },
      advantages: ['供体丁酸通路完整度极高，直击受体最严重缺口', '供体无免疫相关病史，对免疫抑制宿主相对安全'],
      potentialRisks: ['受体激素依赖，定植窗口可能被免疫抑制削弱', '既往英夫利西原发无应答，提示宿主免疫-菌群互作异常，应答预期需下调'],
      matchDate: '2025-05-08'
    },
    protocolVersions: [
      version('v1.0', '2025-05-09', 'AI 决策辅助引擎', 'AI 初始方案：结肠镜直达回盲部单剂 + 序贯胶囊强化',
        ['初版方案生成', '移植路径：结肠镜直达回盲部', '首次 120mL 单剂，后续胶囊序贯 4 周'],
        proto({
          v: 'v1.0', date: '2025-05-09', author: 'AI 决策辅助引擎',
          route: '结肠镜直达回盲部', dose: '首剂 120mL 菌液经肠镜喷洒回盲部及全结肠', freq: '首剂 1 次 + 胶囊每周 2 次',
          duration: '首剂 + 序贯 4 周', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉注射甲氧氯普胺 10mg 促动力',
          combo: '泼尼松维持 30mg/d 暂不减量', nutrition: '低渣饮食 + 肠内营养 600kcal/d',
          milestones: ['首剂后 72 小时安全评估', '第 4 周疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-05-11', 'FMT MDT 多学科小组', 'MDT 修订：受体激素依赖，首剂改为分次递进并延长监护窗',
        ['首剂 120mL 单次 → 分两次各 80mL（间隔 48 小时）', '新增：首剂后住院监护 5 天', '激素减量节奏放缓至每 2 周减 5mg'],
        proto({
          v: 'v1.1', date: '2025-05-11', author: 'FMT MDT 多学科小组',
          route: '结肠镜直达回盲部', dose: '首剂 80mL，48 小时后追加 80mL 经肠镜喷洒', freq: '首剂 2 次 + 胶囊每周 2 次',
          duration: '首剂 2 次 + 序贯 4 周', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉注射甲氧氯普胺 10mg 促动力；首剂后住院监护 5 天',
          combo: '泼尼松 30mg/d 维持，每 2 周减 5mg', nutrition: '低渣饮食 + 肠内营养 600kcal/d',
          milestones: ['首剂后 72 小时安全评估', '第 4 周疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-hos2': 'pending' },
      { 'hg-hos2': '激素依赖状态，免疫抑制分级为中度，需住院监护首剂反应', 'hg-con2': 'MDT 已复核，采纳分次递进方案' }
    ),
    executionRecords: [
      { seq: 'FMT #1a', date: '2025-05-15', route: '结肠镜', actualDose: '80mL 回盲部喷洒', tolerance: '可耐受', immediateAE: '术中轻度腹痛，退镜后缓解', operator: '陈建国 主任医师' },
      { seq: 'FMT #1b', date: '2025-05-17', route: '结肠镜', actualDose: '80mL 回盲部喷洒', tolerance: '可耐受', immediateAE: '无', operator: '陈建国 主任医师' },
      { seq: 'FMT #5', date: '2025-06-05', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #9', date: '2025-06-26', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '中度腹胀，持续 2 天', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-05-14', shannon: 1.86, engraft: 0, fc: 812, mayo: 10, scfa: 22, beneficial: 13.4, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周', date: '2025-05-28', shannon: 2.14, engraft: 18, fc: 706, mayo: 9, scfa: 28, beneficial: 16.8, relief: 12 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-06-11', shannon: 2.62, engraft: 34, fc: 548, mayo: 7, scfa: 38, beneficial: 23.6, relief: 28 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-08-06', shannon: 3.14, engraft: 51, fc: 342, mayo: 5, scfa: 52, beneficial: 31.2, relief: 46 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-10-29', shannon: 3.28, engraft: 55, fc: 296, mayo: 4, scfa: 56, beneficial: 34.0, relief: 52 })
    ],
    adverseEvents: [
      { id: 'ae-2-1', timing: 'FMT #1a 术中', type: '结肠镜操作相关轻度腹痛', severity: '轻度', handling: '退镜后自行缓解，无需镇痛干预', isSAE: false },
      { id: 'ae-2-2', timing: 'FMT #9 次日', type: '中度腹胀伴排便次数增多至 6 次/日', severity: '中度', handling: '调整胶囊频次为每周 1 次，加用蒙脱石散，3 天后缓解', isSAE: false }
    ],
    outcome: 'partial',
    outcomeLabel: '部分应答（24 周未达缓解）',
    followUpWeeks: 24,
    finalEngraftmentRate: 55,
    mdtDiscussed: true,
    mdtNotes: [
      '受体为全结肠型重度 UC，且对英夫利西单抗原发无应答，提示存在非菌群驱动的免疫异常成分。',
      'FMT 后菌群指标确有改善（多样性 1.86 → 3.28），但临床仅达部分应答，说明菌群重构未完全转化为黏膜愈合。',
      '关键决策理由：MDT 判断该病例属于「菌群应答但临床不完全应答」表型，建议 FMT 作为桥接手段而非单一疗法。',
      '后续建议：联合小分子药物（如托法替布）而非继续加码 FMT 剂量。'
    ],
    physicianNotes: [
      '本案例价值在于「部分应答」——提醒医生同类重症激素依赖患者不要对 FMT 抱有过高预期。',
      '激素减量节奏放缓是必要的，第 4 周时曾尝试加快减量导致 FC 反弹。'
    ],
    caseTags: ['重症IBD', 'MDT疑难病例', '免疫抑制宿主'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-003 rCDI 临床缓解 ---------------------------- */
  {
    id: 'H-003',
    anonymizedMrn: 'MRN-H2025-003',
    gender: '男',
    age: 67,
    bmi: 21.4,
    diagnosisCategory: 'rCDI',
    diagnosisLabel: '复发性艰难梭菌感染 (rCDI, 第 3 次复发)',
    diseaseStage: '重症高危型 · 万古霉素减量期再次复发',
    diseaseActivityLabel: '每日水样泻 8 次 · 伴低热',
    nutritionRisk: '高',
    immuneStatus: '免疫衰退（高龄 + 多重基础病）',
    immunosuppressed: false,
    contraindicationNote: '无绝对禁忌症',
    allergyNote: '磺胺类过敏',
    comorbidities: ['2 型糖尿病', '慢性肾病 3 期', '冠心病（支架植入后）'],
    surgicalHistory: ['胆囊切除（2019）', '冠脉支架植入（2021）'],
    priorMedications: ['口服万古霉素 125mg qid（第 3 疗程）', '非达霉素 200mg bid（既往，停药后复发）', '二甲双胍 0.5g bid'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 62.4, esr: 68, fecalCalprotectin: 902, albumin: 27.8, prealbumin: 126 },
    microbiome: {
      shannonDiversity: 1.28,
      dysbiosisScore: 93,
      beneficialRatio: 4.6,
      pathogenLoad: 71.2,
      fmtAdaptabilityScore: 93,
      dominantFeature: '产毒艰难梭菌爆发占位，次级胆汁酸定植抗力瓦解',
      taxa: buildTaxa({ 'ht-akk': 0.05, 'ht-fprau': 0.18, 'ht-blon': 0.28, 'ht-rose': 0.12, 'ht-bact': 1.4, 'ht-prev': 0.4, 'ht-ecoli': 6.2, 'ht-kleb': 2.1, 'ht-entero': 3.4, 'ht-cdiff': 28.5 }),
      ecologicalLinks: buildLinks('severe'),
      pathways: buildPathways({ 'hp-scfa': -82, 'hp-buty': -86, 'hp-bile': -88, 'hp-barrier': -72, 'hp-lps': 98 }),
      twin: { pre: twin(14, 93, 0, 90, 10), post: twin(74, 31, 68, 32, 68) }
    },
    donorMatch: {
      donorCode: 'D-0205',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 93.2,
      dimensions: { microbiomeComplementarity: 96, functionalGain: 95, safetyProfile: 90, colonizationPotential: 92, historicalEfficacy: 94, diseaseSuitability: 96 },
      advantages: ['供体胆盐水解酶(BSH)活性高，直击 rCDI 定植抗力缺口', '供体既往 rCDI 移植成功率 94%，疾病适配性极佳'],
      potentialRisks: ['受体高龄合并慢性肾病，需严格控制菌液容量避免容量负荷', '受体合并冠心病，需评估结肠镜操作的心血管风险'],
      matchDate: '2025-06-02'
    },
    protocolVersions: [
      version('v1.0', '2025-06-03', 'AI 决策辅助引擎', 'AI 初始方案：结肠镜单剂标准剂量，rCDI 一线推荐路径',
        ['初版方案生成', '移植路径：结肠镜直达回盲部', '单剂 150mL 菌液'],
        proto({
          v: 'v1.0', date: '2025-06-03', author: 'AI 决策辅助引擎',
          route: '结肠镜直达回盲部', dose: '单剂 150mL 菌液回盲部及全结肠喷洒', freq: '单次',
          duration: '单剂（第 4 周复评决定是否追加）', prep: '移植前 1 日聚乙二醇全肠道灌洗，移植前 24 小时停用万古霉素',
          pre: '移植前 30 分钟静脉补液 500mL 维持容量',
          combo: '移植后 24 小时恢复口服万古霉素 125mg qid 减量方案', nutrition: '低渣饮食 + 肠内营养 800kcal/d',
          milestones: ['移植后 48 小时腹泻频次评估', '第 4 周毒素复测', '第 12 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-06-05', '林素云 主任医师 / 感染科', '医生调整：高龄合并肾病，容量下调并改为分段灌注',
        ['单剂 150mL → 分段 100mL（回盲部 60mL + 左半结肠 40mL）', '新增：术中持续心电监护', '万古霉素减量方案调整为移植后 48 小时启动'],
        proto({
          v: 'v1.1', date: '2025-06-05', author: '林素云 主任医师 / 感染科',
          route: '结肠镜直达回盲部', dose: '分段 100mL（回盲部 60mL + 左半结肠 40mL）', freq: '单次',
          duration: '单剂（第 4 周复评决定是否追加）', prep: '移植前 1 日聚乙二醇全肠道灌洗，移植前 24 小时停用万古霉素',
          pre: '移植前 30 分钟静脉补液 500mL；术中持续心电监护',
          combo: '移植后 48 小时恢复口服万古霉素 125mg qid 减量方案', nutrition: '低渣饮食 + 肠内营养 800kcal/d',
          milestones: ['移植后 48 小时腹泻频次评估', '第 4 周毒素复测', '第 12 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      {},
      { 'hg-inf2': '移植前 24 小时停用万古霉素，粪毒素复查阳性（符合移植指征）', 'hg-hos1': '无肠梗阻/穿孔；冠心病史已由心内科会诊确认可耐受肠镜' }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-06-09', route: '结肠镜（分段灌注）', actualDose: '100mL', tolerance: '良好', immediateAE: '无，术中生命体征平稳', operator: '林素云 主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-06-08', shannon: 1.28, engraft: 0, fc: 902, mayo: 11, scfa: 12, beneficial: 4.6, relief: 0 }),
      track({ stage: 'w1', label: '第 1 周', date: '2025-06-16', shannon: 2.44, engraft: 38, fc: 486, mayo: 6, scfa: 34, beneficial: 18.2, relief: 52 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-07-07', shannon: 3.86, engraft: 66, fc: 148, mayo: 2, scfa: 68, beneficial: 38.6, relief: 82 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-09-01', shannon: 4.32, engraft: 78, fc: 74, mayo: 1, scfa: 81, beneficial: 46.2, relief: 92 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-11-24', shannon: 4.44, engraft: 81, fc: 58, mayo: 0, scfa: 86, beneficial: 49.8, relief: 95 })
    ],
    adverseEvents: [
      { id: 'ae-3-1', timing: '移植后第 2 天', type: '一过性腹泻加重（12 次/日）', severity: '中度', handling: '静脉补液纠正电解质，洛哌丁胺对症，48 小时内频次回落至 5 次/日', isSAE: false },
      { id: 'ae-3-2', timing: '移植后第 5 天', type: '血肌酐一过性升高（148 μmol/L）', severity: '中度', handling: '暂停二甲双胍，补液后 3 天恢复至基线 112 μmol/L', isSAE: false }
    ],
    outcome: 'remission',
    outcomeLabel: '临床缓解（24 周无复发）',
    followUpWeeks: 24,
    finalEngraftmentRate: 81,
    mdtDiscussed: false,
    mdtNotes: [
      '（本例未经 MDT，为感染科单学科决策）',
      '关键决策理由：rCDI 第 3 次复发，指南推荐 FMT 为一线，无需继续延长抗生素疗程。'
    ],
    physicianNotes: [
      '容量控制是这个病例的核心——150mL 对 CKD 3 期高龄患者偏多，分段 100mL 是更稳妥的选择。',
      '移植后第 2 天的腹泻加重容易被误判为失败，实际上是菌群重建期的常见反应，不应过早追加第二剂。'
    ],
    caseTags: ['老年低营养'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-004 免疫抑制宿主无应答（风险警示） ---------------------------- */
  {
    id: 'H-004',
    anonymizedMrn: 'MRN-H2025-004',
    gender: '女',
    age: 28,
    bmi: 17.1,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 全结肠型, 重度活动期, 激素难治)',
    diseaseStage: '全结肠型 · 深大溃疡伴自发性出血',
    diseaseActivityLabel: 'Mayo 11 分 · 重度活动期（激素难治）',
    nutritionRisk: '高',
    immuneStatus: '重度免疫抑制（三联免疫抑制 + 生物制剂继发失效）',
    immunosuppressed: true,
    contraindicationNote: '相对禁忌：重度免疫抑制，感染风险分层为高危',
    allergyNote: '英夫利西单抗输注反应',
    comorbidities: ['重度营养不良', '低蛋白血症', '既往肺孢子菌肺炎预防中'],
    surgicalHistory: ['无'],
    priorMedications: ['泼尼松 40mg/d（激素难治）', '英夫利西单抗（继发失效）', '乌司奴单抗（无效）', '环孢素 A 静脉（桥接中）'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 88.6, esr: 82, fecalCalprotectin: 1240, albumin: 25.4, prealbumin: 98 },
    microbiome: {
      shannonDiversity: 1.42,
      dysbiosisScore: 91,
      beneficialRatio: 8.2,
      pathogenLoad: 62.8,
      fmtAdaptabilityScore: 62,
      dominantFeature: '厌氧共生菌近乎清空，肠球菌与肠杆菌科主导',
      taxa: buildTaxa({ 'ht-akk': 0.06, 'ht-fprau': 0.22, 'ht-blon': 0.34, 'ht-rose': 0.15, 'ht-bact': 1.8, 'ht-ecoli': 9.4, 'ht-kleb': 3.8, 'ht-entero': 4.6 }),
      ecologicalLinks: buildLinks('severe'),
      pathways: buildPathways({ 'hp-scfa': -78, 'hp-buty': -84, 'hp-bile': -58, 'hp-barrier': -82, 'hp-lps': 99 }),
      twin: { pre: twin(12, 91, 0, 96, 12), post: twin(21, 84, 16, 88, 18) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 79.6,
      dimensions: { microbiomeComplementarity: 92, functionalGain: 88, safetyProfile: 68, colonizationPotential: 52, historicalEfficacy: 74, diseaseSuitability: 80 },
      advantages: ['供体菌群互补度极高，理论上可补齐全部缺口菌'],
      potentialRisks: ['受体重度免疫抑制，供体菌在异常免疫环境中的定植与致病风险不可控', '低蛋白血症导致黏膜修复底物严重不足，定植窗口极窄', '既往肺孢子菌肺炎预防中，任何菌群扰动都可能放大机会性感染风险'],
      matchDate: '2025-07-18'
    },
    protocolVersions: [
      version('v1.0', '2025-07-19', 'AI 决策辅助引擎', 'AI 初始方案：结肠镜单剂 + 胶囊序贯，标准重症路径',
        ['初版方案生成', '移植路径：结肠镜直达回盲部', '单剂 150mL + 序贯胶囊 4 周'],
        proto({
          v: 'v1.0', date: '2025-07-19', author: 'AI 决策辅助引擎',
          route: '结肠镜直达回盲部', dose: '单剂 150mL 菌液喷洒', freq: '首剂 + 胶囊每周 2 次',
          duration: '首剂 + 序贯 4 周', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉补液 500mL',
          combo: '环孢素 A 静脉维持，泼尼松 40mg/d 暂不减量', nutrition: '肠内营养 1200kcal/d',
          milestones: ['首剂后 72 小时安全评估', '第 4 周疗效初评', '第 12 周内镜复查'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-07-21', 'FMT MDT 多学科小组', 'MDT 修订：感染风险不可接受，下调剂量并设置中止条款',
        ['单剂 150mL → 80mL', '新增：首剂后 7 天血培养与影像学监护', '新增中止条款：出现发热 > 38.5°C 立即中止后续移植'],
        proto({
          v: 'v1.1', date: '2025-07-21', author: 'FMT MDT 多学科小组',
          route: '结肠镜直达回盲部', dose: '单剂 80mL 菌液喷洒', freq: '首剂 1 次 + 评估后决定是否序贯',
          duration: '首剂 + 视耐受情况序贯', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉补液 500mL；首剂后 7 天血培养与腹盆腔影像学监护',
          combo: '环孢素 A 静脉维持，泼尼松 40mg/d 暂不减量', nutrition: '肠内营养 1200kcal/d + 白蛋白输注支持',
          milestones: ['首剂后 72 小时安全评估', '第 7 天感染排查', '第 4 周疗效初评'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-hos2': 'pending', 'hg-don2': 'passed' },
      {
        'hg-hos2': '重度免疫抑制（三联治疗 + 环孢素桥接），感染风险分层为高危，门控未完全通过',
        'hg-don2': '互补度 92 分，但定植潜力仅 52 分，综合收益需权衡'
      }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-07-25', route: '结肠镜', actualDose: '80mL', tolerance: '术中可耐受', immediateAE: '退镜后出现低热 37.8°C', operator: '陈建国 主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-07-24', shannon: 1.42, engraft: 0, fc: 1240, mayo: 11, scfa: 15, beneficial: 8.2, relief: 0 }),
      track({ stage: 'w1', label: '第 1 周', date: '2025-08-01', shannon: 1.36, engraft: 8, fc: 1310, mayo: 11, scfa: 14, beneficial: 7.6, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周（中止）', date: '2025-08-08', shannon: 1.24, engraft: 6, fc: 1420, mayo: 12, scfa: 11, beneficial: 6.2, relief: 0 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-08-22', shannon: 1.18, engraft: 4, fc: 1480, mayo: 12, scfa: 10, beneficial: 5.4, relief: 0 }),
      track({ stage: 'w12', label: '第 12 周（转外科）', date: '2025-10-17', shannon: 1.22, engraft: 5, fc: 1360, mayo: 11, scfa: 12, beneficial: 6.0, relief: 0 })
    ],
    adverseEvents: [
      { id: 'ae-4-1', timing: 'FMT #1 当日', type: '低热 37.8°C', severity: '轻度', handling: '观察，次日晨体温正常', isSAE: false },
      { id: 'ae-4-2', timing: '移植后第 9 天', type: '血培养阳性（粪肠球菌血流感染）', severity: '严重(SAE)', handling: '立即启动万古霉素 + 哌拉西林他唑巴坦经验性抗感染，停用环孢素，转入 ICU 监护 6 天，血培养转阴', isSAE: true }
    ],
    outcome: 'no_response',
    outcomeLabel: '临床无应答（12 周转外科手术）',
    followUpWeeks: 12,
    finalEngraftmentRate: 5,
    mdtDiscussed: true,
    mdtNotes: [
      '本案例是典型的「指标相似 ≠ 预后相同」警示案例：菌群缺口与供体互补度都很理想，但受体免疫环境完全不具备定植条件。',
      '关键决策理由（事后复盘）：MDT 在术前已标记感染风险高危，但受体为激素难治重症、外科手术意愿强烈，家属强烈要求尝试 FMT，最终以 80mL 减量方案试行。',
      '结论：重度免疫抑制 + 低蛋白血症（白蛋白 < 26 g/L）是 FMT 的相对禁区，建议此类病例优先纠正营养与免疫状态，或直接转外科评估。',
      '不良事件归因：粪肠球菌血流感染与移植前肠球菌扩张（4.6%）直接相关，移植操作可能促成菌血症。'
    ],
    physicianNotes: [
      '强烈建议同类病例参考本样本的风险路径：移植前若肠球菌丰度 > 3%，且宿主重度免疫抑制，应视为高危。',
      '白蛋白 < 26 g/L 时黏膜修复底物不足，FMT 几乎不可能转化为临床应答——这个阈值建议写入知识规则。',
      '本案例已标记为「超高龄SAE警示」同类风险样本，不推荐直接复用方案参数。'
    ],
    caseTags: ['免疫抑制宿主', '重症IBD', 'MDT疑难病例'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-005 克罗恩病 鼻肠管 ---------------------------- */
  {
    id: 'H-005',
    anonymizedMrn: 'MRN-H2025-005',
    gender: '男',
    age: 45,
    bmi: 22.8,
    diagnosisCategory: 'CD',
    diagnosisLabel: '克罗恩病 (CD, 回结肠型, 活动期)',
    diseaseStage: '回结肠型 · 回盲瓣节段性鹅卵石样溃疡',
    diseaseActivityLabel: 'SES-CD 12 分 · 中度活动期',
    nutritionRisk: '低',
    immuneStatus: '免疫正常（生物制剂初治）',
    immunosuppressed: false,
    contraindicationNote: '无禁忌症（无狭窄、无瘘管）',
    allergyNote: '无已知过敏',
    comorbidities: ['无'],
    surgicalHistory: ['阑尾切除（2012）'],
    priorMedications: ['美沙拉嗪 4g/d', '布地奈德 9mg/d'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 34.2, esr: 46, fecalCalprotectin: 664, albumin: 36.8, prealbumin: 196 },
    microbiome: {
      shannonDiversity: 2.52,
      dysbiosisScore: 74,
      beneficialRatio: 21.6,
      pathogenLoad: 44.6,
      fmtAdaptabilityScore: 88,
      dominantFeature: 'AIEC 黏附侵袭性大肠杆菌富集，丁酸通路受损',
      taxa: buildTaxa({ 'ht-akk': 0.34, 'ht-fprau': 1.4, 'ht-blon': 1.8, 'ht-rose': 0.85, 'ht-bact': 6.2, 'ht-prev': 3.4, 'ht-ecoli': 6.8, 'ht-kleb': 1.4 }),
      ecologicalLinks: buildLinks('moderate'),
      pathways: buildPathways({ 'hp-scfa': -42, 'hp-buty': -48, 'hp-bile': -22, 'hp-barrier': -30, 'hp-lps': 68 }),
      twin: { pre: twin(44, 74, 0, 62, 38), post: twin(81, 22, 76, 24, 78) }
    },
    donorMatch: {
      donorCode: 'D-0311',
      donorRating: 'A',
      donorType: '健康志愿者',
      overallScore: 89.8,
      dimensions: { microbiomeComplementarity: 90, functionalGain: 88, safetyProfile: 95, colonizationPotential: 86, historicalEfficacy: 87, diseaseSuitability: 92 },
      advantages: ['供体拟杆菌门丰度适中，适合 CD 回结肠型患者', '供体无消化道手术史，菌群结构稳定'],
      potentialRisks: ['受体有阑尾切除史，回盲部解剖改变可能影响鼻肠管定位'],
      matchDate: '2025-04-08'
    },
    protocolVersions: [
      version('v1.0', '2025-04-09', 'AI 决策辅助引擎', 'AI 初始方案：鼻肠管注入，规避肠镜对回盲瓣的操作风险',
        ['初版方案生成', '移植路径：鼻肠管注入', '每日 1 次，连续 10 天'],
        proto({
          v: 'v1.0', date: '2025-04-09', author: 'AI 决策辅助引擎',
          route: '鼻肠管注入', dose: '菌液 100mL/次', freq: '每日 1 次',
          duration: '连续 10 天', prep: '移植前 1 日低渣饮食，当日晨起禁食',
          pre: '移植前 30 分钟静推甲氧氯普胺 10mg，鼻肠管置入至屈氏韧带下 20cm',
          combo: '布地奈德 9mg/d 维持', nutrition: '全肠内营养 1800kcal/d',
          milestones: ['第 5 天耐受性评估', '第 10 天疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-04-11', '陈建国 主任医师', '医生调整：鼻肠管改为隔日注入，减少导管相关不适',
        ['频次：每日 1 次 → 隔日 1 次（共 6 次）', '新增：每次注入后生理盐水 20mL 冲管'],
        proto({
          v: 'v1.1', date: '2025-04-11', author: '陈建国 主任医师',
          route: '鼻肠管注入', dose: '菌液 120mL/次', freq: '隔日 1 次',
          duration: '连续 12 天（共 6 次）', prep: '移植前 1 日低渣饮食，当日晨起禁食',
          pre: '移植前 30 分钟静推甲氧氯普胺 10mg；每次注入后生理盐水 20mL 冲管',
          combo: '布地奈德 9mg/d 维持', nutrition: '全肠内营养 1800kcal/d',
          milestones: ['第 5 天耐受性评估', '第 12 天疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      {},
      { 'hg-hos1': '已排除狭窄与瘘管，鼻肠管置入路径通畅', 'hg-don2': '互补度 90 分，且供体拟杆菌门丰度适配 CD 表型' }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-04-15', route: '鼻肠管', actualDose: '120mL', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #3', date: '2025-04-19', route: '鼻肠管', actualDose: '120mL', tolerance: '良好', immediateAE: '轻度鼻咽部不适', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #6', date: '2025-04-27', route: '鼻肠管', actualDose: '120mL', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-04-14', shannon: 2.52, engraft: 0, fc: 664, mayo: 8, scfa: 34, beneficial: 21.6, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周', date: '2025-04-28', shannon: 3.08, engraft: 32, fc: 442, mayo: 6, scfa: 48, beneficial: 29.4, relief: 30 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-05-12', shannon: 3.66, engraft: 54, fc: 264, mayo: 4, scfa: 62, beneficial: 37.8, relief: 52 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-07-07', shannon: 4.28, engraft: 76, fc: 92, mayo: 2, scfa: 79, beneficial: 48.6, relief: 81 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-09-29', shannon: 4.41, engraft: 79, fc: 68, mayo: 1, scfa: 84, beneficial: 52.2, relief: 88 })
    ],
    adverseEvents: [
      { id: 'ae-5-1', timing: 'FMT #3 当日', type: '轻度鼻咽部不适伴异物感', severity: '轻度', handling: '调整导管固定位置，石蜡油润滑，未影响后续治疗', isSAE: false }
    ],
    outcome: 'remission',
    outcomeLabel: '临床缓解（24 周随访，SES-CD 降至 3 分）',
    followUpWeeks: 24,
    finalEngraftmentRate: 79,
    mdtDiscussed: false,
    mdtNotes: ['（本例未经 MDT，为消化内科单学科决策）'],
    physicianNotes: [
      'CD 回结肠型若存在回盲瓣狭窄风险，鼻肠管路径比肠镜更安全——本案例是典型示范。',
      '隔日注入的耐受性明显优于每日注入，且疗效未见下降，建议作为同类病例的默认频次。'
    ],
    caseTags: ['生物制剂初治'],
    libraryStatus: 'in_library',
    typicalCase: true,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-006 IBS-D 部分应答 ---------------------------- */
  {
    id: 'H-006',
    anonymizedMrn: 'MRN-H2025-006',
    gender: '女',
    age: 39,
    bmi: 20.5,
    diagnosisCategory: 'IBS-D',
    diagnosisLabel: '腹泻型肠易激综合征 (IBS-D, 重度难治性)',
    diseaseStage: 'Rome IV 确诊 · 内脏感觉高敏感伴焦虑状态',
    diseaseActivityLabel: 'IBS-SSS 320 分 · 重度',
    nutritionRisk: '低',
    immuneStatus: '免疫正常',
    immunosuppressed: false,
    contraindicationNote: '无禁忌症',
    allergyNote: '乳糖不耐受',
    comorbidities: ['焦虑状态（GAD-7 12 分）', '睡眠障碍'],
    surgicalHistory: ['无'],
    priorMedications: ['匹维溴铵片', '洛哌丁胺', '多种益生菌制剂（无效）', '帕罗西汀 20mg/d'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 5.2, esr: 16, fecalCalprotectin: 138, albumin: 42.6, prealbumin: 228 },
    microbiome: {
      shannonDiversity: 3.16,
      dysbiosisScore: 56,
      beneficialRatio: 32.4,
      pathogenLoad: 22.4,
      fmtAdaptabilityScore: 79,
      dominantFeature: '青春双歧杆菌缺失，脑肠轴 5-HT 高敏分泌',
      taxa: buildTaxa({ 'ht-akk': 1.1, 'ht-fprau': 4.2, 'ht-blon': 1.4, 'ht-rose': 2.1, 'ht-bact': 8.6, 'ht-prev': 4.8, 'ht-ecoli': 2.8, 'ht-kleb': 0.6 }),
      ecologicalLinks: buildLinks('mild'),
      pathways: buildPathways({ 'hp-scfa': -18, 'hp-buty': -22, 'hp-bile': -8, 'hp-barrier': -14, 'hp-lps': 26 }),
      twin: { pre: twin(62, 56, 0, 38, 58), post: twin(78, 34, 52, 26, 72) }
    },
    donorMatch: {
      donorCode: 'D-0205',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 85.2,
      dimensions: { microbiomeComplementarity: 86, functionalGain: 84, safetyProfile: 97, colonizationPotential: 82, historicalEfficacy: 85, diseaseSuitability: 88 },
      advantages: ['供体青春双歧杆菌丰度高，直击受体缺口', '供体无精神心理病史，脑肠轴相关菌群结构稳定'],
      potentialRisks: ['受体症状以脑肠轴高敏为主，菌群干预对中枢症状的改善幅度有限'],
      matchDate: '2025-08-04'
    },
    protocolVersions: [
      version('v1.0', '2025-08-05', 'AI 决策辅助引擎', 'AI 初始方案：肠溶胶囊低剂量长疗程，侧重耐受性',
        ['初版方案生成', '移植路径：肠溶胶囊(微囊化)', '每周 1 次，连续 8 周'],
        proto({
          v: 'v1.0', date: '2025-08-05', author: 'AI 决策辅助引擎',
          route: '肠溶胶囊(微囊化)', dose: '菌液 40mL/次（约 8×10^10 CFU）', freq: '每周 1 次',
          duration: '连续 8 周（共 8 次）', prep: '无需肠道准备，移植当日空腹 2 小时',
          pre: '无需抑酸预处理',
          combo: '帕罗西汀 20mg/d 维持不变', nutrition: '低 FODMAP 饮食 + 可溶性膳食纤维 6g/d',
          milestones: ['第 4 周 IBS-SSS 复评', '第 8 周菌群复测', '第 12 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-08-07', '赵宏波 副主任医师', '医生调整：新增肠-脑轴行为干预并行，明确疗效预期',
        ['新增：认知行为疗法(CBT)每周 1 次并行', '新增：移植前向患者明确「菌群改善未必等同症状缓解」的预期管理'],
        proto({
          v: 'v1.1', date: '2025-08-07', author: '赵宏波 副主任医师',
          route: '肠溶胶囊(微囊化)', dose: '菌液 40mL/次（约 8×10^10 CFU）', freq: '每周 1 次',
          duration: '连续 8 周（共 8 次）', prep: '无需肠道准备，移植当日空腹 2 小时',
          pre: '无需抑酸预处理；并行认知行为疗法每周 1 次',
          combo: '帕罗西汀 20mg/d 维持不变', nutrition: '低 FODMAP 饮食 + 可溶性膳食纤维 6g/d',
          milestones: ['第 4 周 IBS-SSS 复评', '第 8 周菌群复测', '第 12 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      {},
      { 'hg-hos1': '无器质性病变，IBS-D 为功能性诊断，禁忌症筛查通过', 'hg-con2': '本例未强制 MDT，医生独立决策' }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-08-12', route: '肠溶胶囊', actualDose: '40mL / 20 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #4', date: '2025-09-02', route: '肠溶胶囊', actualDose: '40mL / 20 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #8', date: '2025-09-30', route: '肠溶胶囊', actualDose: '40mL / 20 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-08-11', shannon: 3.16, engraft: 0, fc: 138, mayo: 5, scfa: 52, beneficial: 32.4, relief: 0 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-09-08', shannon: 3.62, engraft: 34, fc: 104, mayo: 4, scfa: 62, beneficial: 38.6, relief: 28 }),
      track({ stage: 'w8', label: '第 8 周', date: '2025-10-06', shannon: 3.94, engraft: 51, fc: 82, mayo: 3, scfa: 70, beneficial: 43.2, relief: 42 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-11-03', shannon: 4.06, engraft: 56, fc: 74, mayo: 3, scfa: 73, beneficial: 45.0, relief: 48 }),
      track({ stage: 'w24', label: '第 24 周', date: '2026-01-26', shannon: 4.08, engraft: 57, fc: 70, mayo: 3, scfa: 74, beneficial: 45.6, relief: 50 })
    ],
    adverseEvents: [],
    outcome: 'partial',
    outcomeLabel: '部分应答（症状改善 50%，未达完全缓解）',
    followUpWeeks: 24,
    finalEngraftmentRate: 57,
    mdtDiscussed: false,
    mdtNotes: ['（本例未经 MDT，为消化内科单学科决策）'],
    physicianNotes: [
      '这是「菌群指标漂亮但症状改善有限」的典型 IBS-D 病例。菌群多样性 3.16 → 4.08，定植率 57%，但 IBS-SSS 仅下降 50%。',
      '结论：IBS-D 的 FMT 疗效受脑肠轴高敏主导，菌群干预只是其中一环。同类病例应提前做预期管理，并并行心理行为干预。',
      '不建议对纯功能性 IBS-D 患者承诺「治愈」，本样本的 50% 改善率可作为沟通参考基准。'
    ],
    caseTags: ['胶囊FMT典型'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-007 老年低营养 复发 ---------------------------- */
  {
    id: 'H-007',
    anonymizedMrn: 'MRN-H2025-007',
    gender: '女',
    age: 72,
    bmi: 17.9,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 直乙结肠型, 中度活动期)',
    diseaseStage: '直乙结肠型 · 黏膜弥漫充血伴点状出血',
    diseaseActivityLabel: 'Mayo 8 分 · 中度活动期',
    nutritionRisk: '高',
    immuneStatus: '免疫衰退（高龄，未用免疫抑制剂）',
    immunosuppressed: false,
    contraindicationNote: '相对禁忌：高龄 + 肌少症，需评估操作耐受性',
    allergyNote: '无已知过敏',
    comorbidities: ['肌少症', '骨质疏松', '轻度认知障碍'],
    surgicalHistory: ['子宫切除（2008）'],
    priorMedications: ['美沙拉嗪栓剂 1g/d', '美沙拉嗪缓释 3g/d', '碳酸钙 + 维生素 D'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 28.4, esr: 54, fecalCalprotectin: 612, albumin: 29.6, prealbumin: 134 },
    microbiome: {
      shannonDiversity: 2.06,
      dysbiosisScore: 76,
      beneficialRatio: 16.2,
      pathogenLoad: 46.8,
      fmtAdaptabilityScore: 71,
      dominantFeature: '产丁酸菌低丰度，黏膜屏障修复能力显著下降',
      taxa: buildTaxa({ 'ht-akk': 0.18, 'ht-fprau': 0.78, 'ht-blon': 1.1, 'ht-rose': 0.5, 'ht-bact': 4.6, 'ht-ecoli': 6.4, 'ht-kleb': 2.2, 'ht-entero': 1.4 }),
      ecologicalLinks: buildLinks('moderate'),
      pathways: buildPathways({ 'hp-scfa': -56, 'hp-buty': -62, 'hp-bile': -36, 'hp-barrier': -64, 'hp-lps': 82 }),
      twin: { pre: twin(30, 76, 0, 72, 26), post: twin(58, 46, 54, 46, 54) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 84.6,
      dimensions: { microbiomeComplementarity: 88, functionalGain: 86, safetyProfile: 90, colonizationPotential: 68, historicalEfficacy: 84, diseaseSuitability: 82 },
      advantages: ['供体产丁酸菌丰度高，可补齐受体核心缺口', '供体菌液经过微囊化处理，对高龄患者更易耐受'],
      potentialRisks: ['受体高龄 + 肌少症，营养底物不足可能限制定植持久性', '受体认知障碍，随访依从性存在不确定性'],
      matchDate: '2025-02-10'
    },
    protocolVersions: [
      version('v1.0', '2025-02-11', 'AI 决策辅助引擎', 'AI 初始方案：保留灌肠 + 胶囊联合，兼顾局部与整体',
        ['初版方案生成', '移植路径：保留灌肠(局部) + 肠溶胶囊(整体)', '灌肠每周 2 次，胶囊每周 1 次'],
        proto({
          v: 'v1.0', date: '2025-02-11', author: 'AI 决策辅助引擎',
          route: '保留灌肠', dose: '灌肠 100mL/次 + 胶囊 40mL/次', freq: '灌肠每周 2 次 + 胶囊每周 1 次',
          duration: '连续 6 周', prep: '灌肠前排空大便，无需全肠道灌洗',
          pre: '灌肠液水浴加温至 37°C，灌注后保持左侧卧位 30 分钟',
          combo: '美沙拉嗪栓剂 1g/d + 缓释 3g/d 维持', nutrition: '高蛋白软食 + 口服营养补充 500kcal/d',
          milestones: ['第 3 周耐受性评估', '第 6 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-02-13', '赵宏波 副主任医师', '医生调整：认知障碍影响灌肠依从性，改为胶囊为主',
        ['灌肠频次 每周 2 次 → 每周 1 次', '胶囊剂量上调至 60mL/次', '新增：家属协助执行并记录排便日记'],
        proto({
          v: 'v1.1', date: '2025-02-13', author: '赵宏波 副主任医师',
          route: '保留灌肠', dose: '灌肠 100mL/次 + 胶囊 60mL/次', freq: '灌肠每周 1 次 + 胶囊每周 2 次',
          duration: '连续 6 周', prep: '灌肠前排空大便，无需全肠道灌洗',
          pre: '灌肠液水浴加温至 37°C，灌注后保持左侧卧位 30 分钟；家属协助执行并记录排便日记',
          combo: '美沙拉嗪栓剂 1g/d + 缓释 3g/d 维持', nutrition: '高蛋白软食 + 口服营养补充 500kcal/d',
          milestones: ['第 3 周耐受性评估', '第 6 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-hos1': 'pending' },
      { 'hg-hos1': '高龄 + 肌少症，灌肠操作的黏膜损伤风险评估为待确认', 'hg-hos2': '未用免疫抑制剂，感染风险低' }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-02-18', route: '保留灌肠 + 胶囊', actualDose: '灌肠 100mL + 胶囊 20 粒', tolerance: '可耐受', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #5', date: '2025-03-18', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #10', date: '2025-04-08', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '轻度腹胀', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-02-17', shannon: 2.06, engraft: 0, fc: 612, mayo: 8, scfa: 26, beneficial: 16.2, relief: 0 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-03-17', shannon: 2.88, engraft: 41, fc: 328, mayo: 5, scfa: 46, beneficial: 28.4, relief: 44 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-05-12', shannon: 3.72, engraft: 62, fc: 142, mayo: 2, scfa: 66, beneficial: 40.2, relief: 76 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-08-04', shannon: 3.84, engraft: 64, fc: 128, mayo: 2, scfa: 69, beneficial: 41.6, relief: 79 }),
      track({ stage: 'w36', label: '第 36 周（复发）', date: '2025-10-27', shannon: 2.94, engraft: 38, fc: 486, mayo: 6, scfa: 44, beneficial: 26.8, relief: 41 }),
      track({ stage: 'w48', label: '第 48 周（再干预）', date: '2026-01-19', shannon: 3.22, engraft: 46, fc: 372, mayo: 5, scfa: 52, beneficial: 31.4, relief: 52 })
    ],
    adverseEvents: [
      { id: 'ae-7-1', timing: 'FMT #10 次日', type: '轻度腹胀', severity: '轻度', handling: '观察，24 小时内缓解', isSAE: false },
      { id: 'ae-7-2', timing: '第 36 周随访', type: '临床复发（Mayo 2 → 6 分）', severity: '中度', handling: '启动第二次 FMT 疗程，同时加强营养支持；未判定为 SAE', isSAE: false }
    ],
    outcome: 'relapse',
    outcomeLabel: '复发（36 周复发，已启动二次 FMT）',
    followUpWeeks: 48,
    finalEngraftmentRate: 38,
    mdtDiscussed: true,
    mdtNotes: [
      '本案例的核心教训：高龄 + 肌少症 + 白蛋白 < 30 g/L 的宿主，即使短期应答良好（第 24 周 Mayo 2 分），定植仍难以长期维持。',
      '关键决策理由：MDT 讨论认为复发根因不在菌液本身，而在于营养底物持续不足——供体菌缺乏可发酵膳食纤维与黏膜修复原料。',
      '第 36 周复发后采取「二次 FMT + 强化营养」联合策略，第 48 周部分恢复。',
      '结论：老年低营养宿主的 FMT 应视为「需重复维持」的干预，而非一次性治愈手段。'
    ],
    physicianNotes: [
      '不要被第 24 周的漂亮数据迷惑——本样本的价值就在第 36 周的复发。',
      '同类病例建议：疗程结束后每 8 周复查一次粪便钙卫蛋白，一旦 FC > 250 μg/g 即启动强化营养干预，不要等临床复发。'
    ],
    caseTags: ['老年低营养', '难治复发病例', 'MDT疑难病例'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-008 生物制剂初治 临床缓解 ---------------------------- */
  {
    id: 'H-008',
    anonymizedMrn: 'MRN-H2025-008',
    gender: '男',
    age: 26,
    bmi: 20.1,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 直乙结肠型, 轻中度活动期)',
    diseaseStage: '直乙结肠型 · 黏膜充血水肿伴散在糜烂',
    diseaseActivityLabel: 'Mayo 5 分 · 轻中度活动期',
    nutritionRisk: '低',
    immuneStatus: '免疫正常（生物制剂初治，未暴露）',
    immunosuppressed: false,
    contraindicationNote: '无禁忌症',
    allergyNote: '无已知过敏',
    comorbidities: ['无'],
    surgicalHistory: ['无'],
    priorMedications: ['美沙拉嗪缓释 3g/d', '美沙拉嗪灌肠液 4g/次'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 12.6, esr: 28, fecalCalprotectin: 386, albumin: 40.2, prealbumin: 214 },
    microbiome: {
      shannonDiversity: 2.74,
      dysbiosisScore: 62,
      beneficialRatio: 24.8,
      pathogenLoad: 34.2,
      fmtAdaptabilityScore: 91,
      dominantFeature: '双歧杆菌与罗斯氏菌低丰度，轻中度失衡',
      taxa: buildTaxa({ 'ht-akk': 0.62, 'ht-fprau': 2.1, 'ht-blon': 1.6, 'ht-rose': 1.2, 'ht-bact': 6.8, 'ht-prev': 3.2, 'ht-ecoli': 4.2, 'ht-kleb': 0.9 }),
      ecologicalLinks: buildLinks('mild'),
      pathways: buildPathways({ 'hp-scfa': -30, 'hp-buty': -34, 'hp-bile': -16, 'hp-barrier': -24, 'hp-lps': 48 }),
      twin: { pre: twin(56, 62, 0, 48, 52), post: twin(86, 18, 82, 18, 84) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 92.4,
      dimensions: { microbiomeComplementarity: 95, functionalGain: 93, safetyProfile: 97, colonizationPotential: 90, historicalEfficacy: 90, diseaseSuitability: 92 },
      advantages: ['受体年轻、免疫正常、无生物制剂暴露，定植窗口极佳', '供体菌群多样性与受体缺口高度互补'],
      potentialRisks: ['轻中度活动期患者存在自愈可能，需权衡 FMT 的必要性'],
      matchDate: '2025-09-15'
    },
    protocolVersions: [
      version('v1.0', '2025-09-16', 'AI 决策辅助引擎', 'AI 初始方案：肠溶胶囊标准疗程',
        ['初版方案生成', '移植路径：肠溶胶囊(微囊化)', '每周 2 次，连续 4 周'],
        proto({
          v: 'v1.0', date: '2025-09-16', author: 'AI 决策辅助引擎',
          route: '肠溶胶囊(微囊化)', dose: '菌液 60mL/次', freq: '每周 2 次',
          duration: '连续 4 周（共 8 次）', prep: '移植当日空腹 2 小时',
          pre: '移植前 30 分钟口服奥美拉唑 20mg 抑酸',
          combo: '美沙拉嗪 3g/d 维持不变', nutrition: '地中海饮食模式，膳食纤维 25g/d',
          milestones: ['第 4 周疗效初评', '第 12 周菌群复测', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates({}, { 'hg-don2': '互补度 95 分，为全部候选供体最高' }),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-09-20', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #8', date: '2025-10-15', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-09-19', shannon: 2.74, engraft: 0, fc: 386, mayo: 5, scfa: 40, beneficial: 24.8, relief: 0 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-10-17', shannon: 3.78, engraft: 62, fc: 168, mayo: 3, scfa: 64, beneficial: 38.4, relief: 58 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-12-12', shannon: 4.52, engraft: 83, fc: 58, mayo: 1, scfa: 86, beneficial: 52.6, relief: 88 }),
      track({ stage: 'w24', label: '第 24 周', date: '2026-03-06', shannon: 4.66, engraft: 86, fc: 42, mayo: 0, scfa: 90, beneficial: 55.8, relief: 94 })
    ],
    adverseEvents: [],
    outcome: 'remission',
    outcomeLabel: '临床缓解（24 周 Mayo 0 分，内镜黏膜愈合）',
    followUpWeeks: 24,
    finalEngraftmentRate: 86,
    mdtDiscussed: false,
    mdtNotes: ['（本例未经 MDT，为消化内科单学科决策）'],
    physicianNotes: [
      '最理想的一类受体：年轻、免疫正常、未暴露生物制剂、营养状态良好。这类病例的 FMT 应答率最高，本样本可作为「最佳预期」基准。',
      '第 24 周 Mayo 0 分、内镜黏膜愈合，定植率 86%，是全部入库样本中定植表现最好的。'
    ],
    caseTags: ['生物制剂初治', '胶囊FMT典型'],
    libraryStatus: 'in_library',
    typicalCase: true,
    allowClinicalReference: true,
    dataCompleteness: 100
  },

  /* ---------------------------- H-009 超高龄 SAE 警示 ---------------------------- */
  {
    id: 'H-009',
    anonymizedMrn: 'MRN-H2025-009',
    gender: '男',
    age: 78,
    bmi: 18.8,
    diagnosisCategory: 'rCDI',
    diagnosisLabel: '复发性艰难梭菌感染 (rCDI, 第 4 次复发)',
    diseaseStage: '暴发型 · 中毒性巨结肠前期',
    diseaseActivityLabel: '每日水样泻 12 次 · 腹胀显著 · 低血压倾向',
    nutritionRisk: '高',
    immuneStatus: '免疫衰退（超高龄 + 多器官功能减退）',
    immunosuppressed: false,
    contraindicationNote: '相对禁忌：中毒性巨结肠前期，肠镜操作风险高',
    allergyNote: '青霉素过敏',
    comorbidities: ['慢性心衰 NYHA III 级', '慢性肾病 4 期', '房颤', '轻度痴呆'],
    surgicalHistory: ['前列腺切除（2015）', '起搏器植入（2020）'],
    priorMedications: ['口服万古霉素 125mg qid（第 4 疗程）', '呋塞米 20mg/d', '美托洛尔 25mg bid', '利伐沙班 15mg/d'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 96.2, esr: 78, fecalCalprotectin: 1180, albumin: 26.2, prealbumin: 108 },
    microbiome: {
      shannonDiversity: 1.04,
      dysbiosisScore: 96,
      beneficialRatio: 3.2,
      pathogenLoad: 78.6,
      fmtAdaptabilityScore: 58,
      dominantFeature: '艰难梭菌与肠球菌共占位，厌氧共生菌几乎不可检出',
      taxa: buildTaxa({ 'ht-akk': 0.03, 'ht-fprau': 0.1, 'ht-blon': 0.16, 'ht-rose': 0.08, 'ht-bact': 0.9, 'ht-prev': 0.2, 'ht-ecoli': 7.4, 'ht-kleb': 3.2, 'ht-entero': 6.8, 'ht-cdiff': 34.6 }),
      ecologicalLinks: buildLinks('severe'),
      pathways: buildPathways({ 'hp-scfa': -91, 'hp-buty': -94, 'hp-bile': -92, 'hp-barrier': -88, 'hp-lps': 100 }),
      twin: { pre: twin(8, 96, 0, 97, 6), post: twin(19, 88, 12, 92, 14) }
    },
    donorMatch: {
      donorCode: 'D-0205',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 76.8,
      dimensions: { microbiomeComplementarity: 94, functionalGain: 92, safetyProfile: 58, colonizationPotential: 48, historicalEfficacy: 82, diseaseSuitability: 78 },
      advantages: ['供体菌群互补度极高，理论上可清除艰难梭菌占位'],
      potentialRisks: ['超高龄 + 中毒性巨结肠前期，结肠镜穿孔风险显著升高', '慢性心衰 + CKD 4 期，麻醉与容量负荷耐受性极差', '利伐沙班抗凝中，操作出血风险高'],
      matchDate: '2025-11-03'
    },
    protocolVersions: [
      version('v1.0', '2025-11-04', 'AI 决策辅助引擎', 'AI 初始方案：结肠镜单剂（rCDI 标准路径）',
        ['初版方案生成', '移植路径：结肠镜直达回盲部', '单剂 150mL'],
        proto({
          v: 'v1.0', date: '2025-11-04', author: 'AI 决策辅助引擎',
          route: '结肠镜直达回盲部', dose: '单剂 150mL 菌液喷洒', freq: '单次',
          duration: '单剂', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉补液 500mL',
          combo: '万古霉素 125mg qid 维持', nutrition: '肠内营养 1000kcal/d',
          milestones: ['移植后 48 小时安全评估', '第 4 周毒素复测'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-11-06', 'FMT MDT 多学科小组', 'MDT 否决结肠镜路径，改为鼻肠管 + 严格心肾监护',
        ['移植路径：结肠镜 → 鼻肠管注入（规避穿孔与抗凝出血风险）', '新增：术前停用利伐沙班 48 小时并桥接低分子肝素', '新增：ICU 级监护 72 小时'],
        proto({
          v: 'v1.1', date: '2025-11-06', author: 'FMT MDT 多学科小组',
          route: '鼻肠管注入', dose: '菌液 100mL 经鼻肠管注入', freq: '单次，第 3 天评估后决定是否追加',
          duration: '单剂（视耐受追加）', prep: '移植前 1 日低渣饮食；术前停用利伐沙班 48 小时并桥接低分子肝素',
          pre: '鼻肠管置入至屈氏韧带下 20cm；ICU 级监护 72 小时',
          combo: '万古霉素 125mg qid 维持，逐步减量', nutrition: '肠内营养 1000kcal/d + 白蛋白输注',
          milestones: ['移植后 48 小时安全评估', '第 7 天感染与心功能评估', '第 4 周毒素复测'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-hos1': 'blocked', 'hg-hos2': 'pending', 'hg-qc1': 'passed' },
      {
        'hg-hos1': '中毒性巨结肠前期 + 抗凝治疗中，结肠镜路径判定为禁止；已改鼻肠管路径规避',
        'hg-hos2': '慢性心衰 NYHA III 级 + CKD 4 期，围术期风险分层为极高危',
        'hg-qc1': '菌液批次质控正常放行，非风险点'
      }
    ),
    executionRecords: [
      { seq: 'FMT #1', date: '2025-11-10', route: '鼻肠管', actualDose: '100mL', tolerance: '勉强耐受', immediateAE: '注入过程中出现心率增快至 118 次/分，血压 92/56 mmHg', operator: '林素云 主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-11-09', shannon: 1.04, engraft: 0, fc: 1180, mayo: 12, scfa: 9, beneficial: 3.2, relief: 0 }),
      track({ stage: 'w1', label: '第 1 周', date: '2025-11-17', shannon: 1.12, engraft: 10, fc: 1120, mayo: 12, scfa: 11, beneficial: 3.8, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周', date: '2025-11-24', shannon: 1.18, engraft: 12, fc: 1064, mayo: 11, scfa: 12, beneficial: 4.2, relief: 5 }),
      track({ stage: 'w4', label: '第 4 周（转 ICU）', date: '2025-12-08', shannon: 1.22, engraft: 12, fc: 980, mayo: 11, scfa: 14, beneficial: 4.6, relief: 8 })
    ],
    adverseEvents: [
      { id: 'ae-9-1', timing: 'FMT #1 注入中', type: '心率增快 118 次/分伴血压下降 92/56 mmHg', severity: '中度', handling: '暂停注入，静脉补液并调整美托洛尔剂量，30 分钟后生命体征恢复', isSAE: false },
      { id: 'ae-9-2', timing: '移植后第 12 天', type: '艰难梭菌毒素性巨结肠伴急性肾损伤（AKI 2 期）', severity: '严重(SAE)', handling: '转入 ICU，行结肠减压 + 万古霉素静脉给药，评估结肠切除指征，家属选择保守治疗，第 26 天因多器官衰竭死亡', isSAE: true }
    ],
    outcome: 'no_response',
    outcomeLabel: '临床无应答（发生 SAE，第 26 天死亡）',
    followUpWeeks: 4,
    finalEngraftmentRate: 12,
    mdtDiscussed: true,
    mdtNotes: [
      '本样本是本参考库中风险等级最高的一例，作为「超高龄 + 中毒性巨结肠前期」的绝对警示案例入库。',
      '关键决策理由：MDT 已否决结肠镜路径（正确），但仍低估了毒素性巨结肠的进展速度——移植后第 12 天出现巨结肠与 AKI。',
      '事后复盘结论：暴发型 rCDI 合并中毒性巨结肠前期，FMT 不应作为首选，应优先评估结肠切除手术时机。',
      '本样本明确标记为「仅作风险借鉴，不推荐复用任何方案参数」。'
    ],
    physicianNotes: [
      '这是全库唯一一例死亡病例，价值极高——提醒医生：高龄暴发型 rCDI 的 FMT 时机窗口极窄，延误手术可能致命。',
      '强烈建议：毒素性巨结肠前期的 rCDI 患者，FMT 前必须先完成外科会诊并明确手术指征评估。'
    ],
    caseTags: ['超高龄SAE警示', '老年低营养', 'MDT疑难病例'],
    libraryStatus: 'in_library',
    typicalCase: false,
    allowClinicalReference: false,
    dataCompleteness: 100
  },

  /* ---------------------------- H-010 重症激素难治 临床缓解（MDT 疑难） ---------------------------- */
  {
    id: 'H-010',
    anonymizedMrn: 'MRN-H2025-010',
    gender: '女',
    age: 33,
    bmi: 18.6,
    diagnosisCategory: 'UC',
    diagnosisLabel: '溃疡性结肠炎 (UC, 全结肠型, 重度活动期, 激素难治)',
    diseaseStage: '全结肠型 · 深凿溃疡伴黏膜桥',
    diseaseActivityLabel: 'Mayo 11 分 · 重度活动期',
    nutritionRisk: '中等',
    immuneStatus: '部分免疫抑制（激素 + 既往硫唑嘌呤）',
    immunosuppressed: true,
    contraindicationNote: '相对禁忌：激素暴露中，需强化感染监护',
    allergyNote: '无已知过敏',
    comorbidities: ['缺铁性贫血'],
    surgicalHistory: ['无'],
    priorMedications: ['泼尼松 40mg/d', '硫唑嘌呤 100mg/d（既往）', '美沙拉嗪 4g/d'],
    infectionScreening: '已完成(阴性)',
    clinicalMarkers: { crp: 58.4, esr: 66, fecalCalprotectin: 986, albumin: 31.4, prealbumin: 156 },
    microbiome: {
      shannonDiversity: 1.68,
      dysbiosisScore: 86,
      beneficialRatio: 11.2,
      pathogenLoad: 56.4,
      fmtAdaptabilityScore: 82,
      dominantFeature: '丁酸合成菌群塌陷，肠杆菌科显著扩张',
      taxa: buildTaxa({ 'ht-akk': 0.09, 'ht-fprau': 0.42, 'ht-blon': 0.68, 'ht-rose': 0.3, 'ht-bact': 3.2, 'ht-ecoli': 8.6, 'ht-kleb': 3.1, 'ht-entero': 2.4 }),
      ecologicalLinks: buildLinks('severe'),
      pathways: buildPathways({ 'hp-scfa': -70, 'hp-buty': -76, 'hp-bile': -46, 'hp-barrier': -64, 'hp-lps': 94 }),
      twin: { pre: twin(20, 86, 0, 88, 18), post: twin(76, 26, 74, 28, 76) }
    },
    donorMatch: {
      donorCode: 'D-0102',
      donorRating: 'A+',
      donorType: '超级供体(Super Donor)',
      overallScore: 90.2,
      dimensions: { microbiomeComplementarity: 94, functionalGain: 92, safetyProfile: 84, colonizationPotential: 76, historicalEfficacy: 88, diseaseSuitability: 90 },
      advantages: ['供体菌群高度互补，可同步补齐丁酸通路与屏障通路缺口', '供体历史对重症 UC 的缓解率达 89%'],
      potentialRisks: ['受体激素暴露中，早期感染风险需强化监护', '白蛋白 31.4 g/L 处于临界，需并行营养支持'],
      matchDate: '2025-01-08'
    },
    protocolVersions: [
      version('v1.0', '2025-01-09', 'AI 决策辅助引擎', 'AI 初始方案：结肠镜首剂 + 胶囊序贯',
        ['初版方案生成', '移植路径：结肠镜直达回盲部 + 肠溶胶囊序贯', '首剂 120mL + 序贯 6 周'],
        proto({
          v: 'v1.0', date: '2025-01-09', author: 'AI 决策辅助引擎',
          route: '结肠镜直达回盲部', dose: '首剂 120mL + 胶囊 60mL/次', freq: '首剂 1 次 + 胶囊每周 2 次',
          duration: '首剂 + 序贯 6 周', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉注射甲氧氯普胺 10mg',
          combo: '泼尼松 40mg/d 维持，第 3 周起每 2 周减 5mg', nutrition: '肠内营养 1000kcal/d',
          milestones: ['首剂后 72 小时安全评估', '第 4 周疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '草稿'
        })
      ),
      version('v1.1', '2025-01-11', 'FMT MDT 多学科小组', 'MDT 修订：受体营养临界，首剂拆分并强化肠内营养',
        ['首剂 120mL → 分两次各 70mL（间隔 24 小时）', '肠内营养 1000 → 1400 kcal/d', '新增：白蛋白 < 30 g/L 时输注人血白蛋白'],
        proto({
          v: 'v1.1', date: '2025-01-11', author: 'FMT MDT 多学科小组',
          route: '结肠镜直达回盲部', dose: '首剂 70mL × 2 次（间隔 24 小时）+ 胶囊 60mL/次', freq: '首剂 2 次 + 胶囊每周 2 次',
          duration: '首剂 + 序贯 6 周', prep: '移植前 1 日聚乙二醇全肠道灌洗',
          pre: '移植前 30 分钟静脉注射甲氧氯普胺 10mg；白蛋白 < 30 g/L 时输注人血白蛋白',
          combo: '泼尼松 40mg/d 维持，第 3 周起每 2 周减 5mg', nutrition: '肠内营养 1400kcal/d + 高蛋白膳食',
          milestones: ['首剂后 72 小时安全评估', '第 4 周疗效初评', '第 12 周内镜复查', '第 24 周结局判定'],
          approval: '医生已签署'
        })
      )
    ],
    safetyGates: buildGates(
      { 'hg-hos2': 'pending' },
      { 'hg-hos2': '激素暴露中，免疫抑制分级中度，已制定感染监护方案', 'hg-don2': '互补度 94 分，定植潜力 76 分，收益大于风险' }
    ),
    executionRecords: [
      { seq: 'FMT #1a', date: '2025-01-15', route: '结肠镜', actualDose: '70mL', tolerance: '可耐受', immediateAE: '无', operator: '陈建国 主任医师' },
      { seq: 'FMT #1b', date: '2025-01-16', route: '结肠镜', actualDose: '70mL', tolerance: '可耐受', immediateAE: '轻度腹痛', operator: '陈建国 主任医师' },
      { seq: 'FMT #6', date: '2025-02-05', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' },
      { seq: 'FMT #12', date: '2025-02-26', route: '肠溶胶囊', actualDose: '60mL / 30 粒', tolerance: '良好', immediateAE: '无', operator: '赵宏波 副主任医师' }
    ],
    longitudinalPoints: [
      track({ stage: 'baseline', label: '治疗前基线', date: '2025-01-14', shannon: 1.68, engraft: 0, fc: 986, mayo: 11, scfa: 19, beneficial: 11.2, relief: 0 }),
      track({ stage: 'w2', label: '第 2 周', date: '2025-01-28', shannon: 2.32, engraft: 24, fc: 682, mayo: 9, scfa: 34, beneficial: 20.4, relief: 20 }),
      track({ stage: 'w4', label: '第 4 周', date: '2025-02-11', shannon: 3.06, engraft: 46, fc: 386, mayo: 6, scfa: 54, beneficial: 31.6, relief: 48 }),
      track({ stage: 'w12', label: '第 12 周', date: '2025-04-08', shannon: 4.12, engraft: 72, fc: 108, mayo: 2, scfa: 78, beneficial: 47.2, relief: 82 }),
      track({ stage: 'w24', label: '第 24 周', date: '2025-07-01', shannon: 4.34, engraft: 77, fc: 64, mayo: 1, scfa: 85, beneficial: 51.6, relief: 91 })
    ],
    adverseEvents: [
      { id: 'ae-10-1', timing: 'FMT #1b 术后', type: '轻度腹痛', severity: '轻度', handling: '观察，2 小时内缓解', isSAE: false },
      { id: 'ae-10-2', timing: '第 3 周激素减量期', type: '一过性 FC 反弹（386 → 452 μg/g）', severity: '中度', handling: '暂停激素减量 2 周，强化肠内营养，FC 回落至 386 μg/g 后继续减量', isSAE: false }
    ],
    outcome: 'remission',
    outcomeLabel: '临床缓解（24 周 Mayo 1 分）',
    followUpWeeks: 24,
    finalEngraftmentRate: 77,
    mdtDiscussed: true,
    mdtNotes: [
      '与 H-002 同属「重症激素难治 UC」，但结局完全不同——关键差异在免疫抑制深度与营养储备。',
      '关键决策理由：本病例免疫抑制仅中度（激素 + 既往硫唑嘌呤，无生物制剂继发失效），且白蛋白 31.4 g/L 高于 H-004 的 25.4 g/L，定植窗口仍可争取。',
      'MDT 决定拆分首剂并强化营养，事后证明这是本案例成功的关键——避免了一次性大剂量菌液对黏膜的冲击。',
      '对比结论：同样 Mayo 11 分，H-004 无应答，H-010 完全缓解。差异不在菌群缺口，而在宿主免疫-营养状态。'
    ],
    physicianNotes: [
      '本样本与 H-002、H-004 构成一组极有价值的「重症 UC 对照三例」，建议医生同时调阅三条样本做横向比较。',
      '激素减量期 FC 反弹是常见现象，不要急于判定失败——暂停减量 2 周通常可回落。'
    ],
    caseTags: ['重症IBD', 'MDT疑难病例', '免疫抑制宿主'],
    libraryStatus: 'in_library',
    typicalCase: true,
    allowClinicalReference: true,
    dataCompleteness: 100
  }
];

/* ------------------------------ 查询辅助 ------------------------------ */

export const SAMPLE_OUTCOME_META: Record<
  HistoricalSample['outcome'],
  { label: string; short: string; color: string; bg: string; border: string }
> = {
  remission: { label: '临床缓解', short: '缓解', color: '#23e6b1', bg: 'rgba(35,230,177,0.14)', border: 'rgba(35,230,177,0.45)' },
  partial: { label: '部分应答', short: '部分应答', color: '#ffb84d', bg: 'rgba(255,184,77,0.14)', border: 'rgba(255,184,77,0.45)' },
  no_response: { label: '无应答', short: '无应答', color: '#ff536c', bg: 'rgba(255,83,108,0.14)', border: 'rgba(255,83,108,0.45)' },
  relapse: { label: '复发', short: '复发', color: '#ff536c', bg: 'rgba(255,83,108,0.14)', border: 'rgba(255,83,108,0.45)' }
};

/** 结局长标签，用于列表与详情头部 */
export function describeOutcome(sample: HistoricalSample): string {
  return `${SAMPLE_OUTCOME_META[sample.outcome].label} · ${sample.outcomeLabel}`;
}

/** 该样本是否存在需要医生警觉的安全事件 */
export function hasSafetyConcern(sample: HistoricalSample): boolean {
  return sample.adverseEvents.some(ae => ae.isSAE) || sample.outcome === 'no_response' || sample.outcome === 'relapse';
}
