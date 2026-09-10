import { 
  ClinicalPatient, 
  MicrobialTaxon, 
  EcologicalLink, 
  FunctionalPathway, 
  DonorProfile, 
  MicrobiotaBatch, 
  MatchEvaluation, 
  FMTTreatmentProtocol, 
  SafetyRuleGate, 
  LongitudinalTrackPoint,
  KnowledgeNode,
  KnowledgeLink
} from '../types';

// Mock Patients
export const mockPatients: ClinicalPatient[] = [
  {
    id: 'P-2026-0841',
    name: '张云清',
    gender: '男',
    age: 42,
    mrn: 'ZY-0982341',
    contact: '138****5920',
    primaryDiagnosis: '溃疡性结肠炎 (UC, 慢性复发型, 中度活动期)',
    stage: 'Mayo评分 8分 (内镜下全结肠弥漫充血水肿及多发浅溃疡)',
    currentPhase: '供体已匹配',
    attendingPhysician: '陈建国 主任医师 / MDT首席',
    riskLevel: 'medium',
    lastFollowUp: '2026-09-02',
    chiefComplaint: '反复黏液脓血便伴腹痛腹胀2年，美沙拉嗪与免疫抑制剂应答不佳3月',
    diagnosticTags: ['中度活动期UC', '抗生素耐药史', '严重菌群失衡', '屏障功能受损'],
    pastMedications: ['美沙拉嗪缓释颗粒 4g/d', '硫唑嘌呤片 75mg/d', '左氧氟沙星 (既往)'],
    allergies: ['头孢类抗生素过敏', '青霉素弱阳性'],
    clinicalMarkers: {
      crp: { value: 24.6, unit: 'mg/L', trend: 'up', isAbnormal: true },
      esr: { value: 48, unit: 'mm/h', trend: 'up', isAbnormal: true },
      fecalCalprotectin: { value: 632, unit: 'μg/g', trend: 'up', isAbnormal: true },
      bmi: { value: 18.7, unit: 'kg/m²', trend: 'down', isAbnormal: true },
      albumin: { value: 32.1, unit: 'g/L', trend: 'down', isAbnormal: true },
      prealbumin: { value: 165, unit: 'mg/L', trend: 'down', isAbnormal: true },
    },
    adaptability: {
      overallScore: 86,
      dysbiosisScore: 72,
      inflammationRisk: 68,
      nutritionalRisk: '中等',
      infectionScreening: '已完成(阴性)',
      contraindications: '无禁忌',
      physicianConfirmed: true,
    }
  },
  {
    id: 'P-2026-0719',
    name: '李国强',
    gender: '男',
    age: 67,
    mrn: 'ZY-0871142',
    contact: '139****1124',
    primaryDiagnosis: '复发性艰难梭菌感染 (rCDI, 第3次复发)',
    stage: '重症高危型 (万古霉素减量期再次突发水样泻 8次/天)',
    currentPhase: '移植执行期',
    attendingPhysician: '林素云 主任医师 / 感染科',
    riskLevel: 'high',
    lastFollowUp: '2026-09-07',
    chiefComplaint: '重症肺炎抗生素治疗后继发水样泻伴高热，口服万古霉素停药即复发',
    diagnosticTags: ['rCDI (三次复发)', '抗生素相关性腹泻', '微生态极度崩解', '老年体弱'],
    pastMedications: ['口服万古霉素 500mg qid', '非达霉素 200mg bid (停用)'],
    allergies: ['磺胺类过敏'],
    clinicalMarkers: {
      crp: { value: 58.2, unit: 'mg/L', trend: 'up', isAbnormal: true },
      esr: { value: 64, unit: 'mm/h', trend: 'up', isAbnormal: true },
      fecalCalprotectin: { value: 890, unit: 'μg/g', trend: 'up', isAbnormal: true },
      bmi: { value: 17.5, unit: 'kg/m²', trend: 'down', isAbnormal: true },
      albumin: { value: 28.4, unit: 'g/L', trend: 'down', isAbnormal: true },
      prealbumin: { value: 130, unit: 'mg/L', trend: 'down', isAbnormal: true },
    },
    adaptability: {
      overallScore: 94,
      dysbiosisScore: 91,
      inflammationRisk: 82,
      nutritionalRisk: '高',
      infectionScreening: '已完成(阴性)',
      contraindications: '无禁忌',
      physicianConfirmed: true,
    }
  },
  {
    id: 'P-2026-0925',
    name: '王雅婷',
    gender: '女',
    age: 34,
    mrn: 'ZY-1029831',
    contact: '135****4822',
    primaryDiagnosis: '腹泻型肠易激综合征 (IBS-D, 重度难治性)',
    stage: 'Rome IV标准确诊 (内脏感觉高敏感伴焦虑状态)',
    currentPhase: '随访监测期',
    attendingPhysician: '赵宏波 副主任医师',
    riskLevel: 'low',
    lastFollowUp: '2026-09-08',
    chiefComplaint: '每日腹泻3-5次伴里急后重感，病程4年，多种益生菌调理无效',
    diagnosticTags: ['IBS-D', '肠-脑轴功能失调', '菌群稳态失衡', '低度肠黏膜炎症'],
    pastMedications: ['匹维溴铵片', '蒙脱石散', '复合双歧杆菌活菌胶囊'],
    allergies: ['无已知药物食物过敏'],
    clinicalMarkers: {
      crp: { value: 4.8, unit: 'mg/L', trend: 'normal', isAbnormal: false },
      esr: { value: 15, unit: 'mm/h', trend: 'normal', isAbnormal: false },
      fecalCalprotectin: { value: 120, unit: 'μg/g', trend: 'down', isAbnormal: true },
      bmi: { value: 21.2, unit: 'kg/m²', trend: 'normal', isAbnormal: false },
      albumin: { value: 44.5, unit: 'g/L', trend: 'normal', isAbnormal: false },
      prealbumin: { value: 240, unit: 'mg/L', trend: 'normal', isAbnormal: false },
    },
    adaptability: {
      overallScore: 78,
      dysbiosisScore: 58,
      inflammationRisk: 32,
      nutritionalRisk: '低',
      infectionScreening: '已完成(阴性)',
      contraindications: '无禁忌',
      physicianConfirmed: true,
    }
  }
];

// Microbial Taxa (Key Species in Patient Profile)
export const mockTaxa: MicrobialTaxon[] = [
  {
    id: 'tax-1',
    name: 'Akkermansia muciniphila',
    chineseName: '嗜黏蛋白阿克曼氏菌 (AKK菌)',
    phylum: '疣微菌门(Verrucomicrobia)',
    category: 'beneficial',
    abundance: 0.18,
    normalRange: [1.5, 4.0],
    relativeChange: -88,
    isDonorDerived: true,
    engraftmentStatus: '部分定植',
    clinicalRelevance: '黏膜屏障守护菌，降解外层黏蛋白刺激紧密连接蛋白Claudin-1表达，抗炎定植关键靶标。',
    primaryMetabolites: ['乙酸', '丙酸', '外膜蛋白Amuc_1100'],
    therapeuticTarget: '促进肠道紧密连接重建，阻遏内毒素细菌入血'
  },
  {
    id: 'tax-2',
    name: 'Faecalibacterium prausnitzii',
    chineseName: '普氏栖粪杆菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'beneficial',
    abundance: 0.95,
    normalRange: [5.0, 12.0],
    relativeChange: -79,
    isDonorDerived: true,
    engraftmentStatus: '未定植',
    clinicalRelevance: '人体肠道最主要的丁酸生成菌之一，分泌MAM抗炎蛋白，显著抑制NF-κB通路与IL-8释放。',
    primaryMetabolites: ['丁酸 (Butyrate)', '抗炎多肽MAM'],
    therapeuticTarget: '核心供能结肠上皮细胞，控制炎症因子激增'
  },
  {
    id: 'tax-3',
    name: 'Bifidobacterium longum',
    chineseName: '长双歧杆菌',
    phylum: '放线菌门(Actinobacteria)',
    category: 'beneficial',
    abundance: 1.2,
    normalRange: [3.0, 8.0],
    relativeChange: -60,
    isDonorDerived: true,
    engraftmentStatus: '稳定定植',
    clinicalRelevance: '调节Th1/Th2平衡，抑制致病菌黏附，促进短链脂肪酸合成并降低肠腔pH值。',
    primaryMetabolites: ['乙酸', '乳酸', '细菌素'],
    therapeuticTarget: '酸化肠道微环境，抑制有害兼性厌氧菌过度增殖'
  },
  {
    id: 'tax-4',
    name: 'Roseburia intestinalis',
    chineseName: '肠道罗斯氏菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'beneficial',
    abundance: 0.62,
    normalRange: [2.5, 6.0],
    relativeChange: -75,
    isDonorDerived: true,
    engraftmentStatus: '未定植',
    clinicalRelevance: '利用膳食多糖产生大量丁酸，改善黏膜厚度，与Treg细胞分化密切正相关。',
    primaryMetabolites: ['丁酸', '甲酸'],
    therapeuticTarget: '诱导Foxp3+ Treg细胞活化，恢复免疫耐受'
  },
  {
    id: 'tax-5',
    name: 'Bacteroides fragilis',
    chineseName: '脆弱拟杆菌',
    phylum: '拟杆菌门(Bacteroidetes)',
    category: 'commensal',
    abundance: 6.4,
    normalRange: [4.0, 10.0],
    relativeChange: 5,
    isDonorDerived: false,
    engraftmentStatus: '不适用',
    clinicalRelevance: '分泌多糖A (PSA) 维持免疫平衡，但在黏膜破损时具有向腹腔易位的潜在毒力风险。',
    primaryMetabolites: ['多糖A (PSA)', '丙酸', '鞘脂'],
    therapeuticTarget: '监测肠壁通透性，防止条件致病性转化'
  },
  {
    id: 'tax-6',
    name: 'Escherichia coli',
    chineseName: '大肠埃希氏菌',
    phylum: '变形菌门(Proteobacteria)',
    category: 'opportunistic',
    abundance: 14.8,
    normalRange: [0.5, 3.0],
    relativeChange: 393,
    isDonorDerived: false,
    engraftmentStatus: '不适用',
    clinicalRelevance: '兼性厌氧菌，炎症微环境中硝酸盐呼吸使其异常扩增，释放大量内毒素LPS激活TLR4通路。',
    primaryMetabolites: ['脂多糖 (LPS)', '大肠杆菌素 (Colibactin)'],
    therapeuticTarget: 'FMT供体菌群生态挤压替代目标'
  },
  {
    id: 'tax-7',
    name: 'Enterococcus faecalis',
    chineseName: '粪肠球菌',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'opportunistic',
    abundance: 8.2,
    normalRange: [0.1, 1.5],
    relativeChange: 446,
    isDonorDerived: false,
    engraftmentStatus: '不适用',
    clinicalRelevance: '分泌明胶酶破坏紧密连接蛋白，易形成生物膜并产生超氧阴离子，加剧结肠上皮氧化应激。',
    primaryMetabolites: ['明胶酶GelE', '超氧阴离子', '溶细胞素'],
    therapeuticTarget: '抑制毒力因子表达，减少溃疡面二次损伤'
  },
  {
    id: 'tax-8',
    name: 'Clostridioides difficile',
    chineseName: '艰难梭菌 (产毒株)',
    phylum: '厚壁菌门(Firmicutes)',
    category: 'pathogen',
    abundance: 3.4,
    normalRange: [0.0, 0.05],
    relativeChange: 670,
    isDonorDerived: false,
    engraftmentStatus: '不适用',
    clinicalRelevance: '产生A/B双毒素，催化Rho GTP酶葡萄糖基化导致细胞骨架解聚，引致假膜性结肠炎和剧烈腹泻。',
    primaryMetabolites: ['肠毒素A (TcdA)', '细胞毒素B (TcdB)'],
    therapeuticTarget: '通过供体次级胆汁酸生成菌恢复微生态定植抗力'
  }
];

// Ecological Links between species (for Network Graph)
export const mockEcologicalLinks: EcologicalLink[] = [
  { source: 'tax-1', target: 'tax-2', type: 'synergy', weight: 0.85, description: 'AKK降解黏蛋白释放单糖及短肽，跨营养喂养普氏栖粪杆菌产生丁酸' },
  { source: 'tax-3', target: 'tax-2', type: 'synergy', weight: 0.78, description: '双歧杆菌产生乙酸与乳酸，作为前体供普氏栖粪杆菌合成丁酸' },
  { source: 'tax-3', target: 'tax-4', type: 'synergy', weight: 0.72, description: '双歧杆菌降解复杂聚糖，协助罗斯氏菌完成碳源代谢' },
  { source: 'tax-1', target: 'tax-6', type: 'antagonism', weight: 0.9, description: 'AKK强化黏膜屏障隔绝大肠杆菌与上皮接触，并竞逐表面黏附位点' },
  { source: 'tax-2', target: 'tax-6', type: 'antagonism', weight: 0.82, description: '丁酸降低管腔氧张力并激活PPAR-γ通路，抑制兼性厌氧大肠杆菌增殖' },
  { source: 'tax-2', target: 'tax-8', type: 'antagonism', weight: 0.95, description: '恢复健康菌群胆汁酸代谢（产生脱氧胆酸/石胆酸），直接抑制艰难梭菌芽孢萌发' },
  { source: 'tax-3', target: 'tax-7', type: 'antagonism', weight: 0.75, description: '低pH微环境与双歧杆菌素显著抑制肠球菌生物膜形成' },
  { source: 'tax-6', target: 'tax-7', type: 'synergy', weight: 0.65, description: '炎症微环境下变形菌门与球菌协同消耗氧气并诱导氧化应激' }
];

// Functional Pathways
export const mockPathways: FunctionalPathway[] = [
  {
    id: 'pw-1',
    name: 'SCFA 短链脂肪酸合成能力',
    category: '代谢功能',
    changePercentage: -38,
    status: 'suppressed',
    mechanism: '普氏菌与罗斯氏菌显著亏空，导致结肠乙酸与丙酸总储备减少，上皮供能不足',
    relevanceScore: 92
  },
  {
    id: 'pw-2',
    name: '丁酸 (Butyrate) 生成通路',
    category: '代谢功能',
    changePercentage: -52,
    status: 'suppressed',
    mechanism: '丁酸激酶与丁酰辅酶A转移酶丰度极度匮乏，结肠黏膜营养与紧密连接修复受阻',
    relevanceScore: 96
  },
  {
    id: 'pw-3',
    name: '次级胆汁酸 (Secondary Bile Acids) 代谢',
    category: '代谢功能',
    changePercentage: -28,
    status: 'suppressed',
    mechanism: '胆盐水解酶(BSH)及7α-脱羟化菌群缺失，未结合胆汁酸蓄积，削弱对病原菌抑制力',
    relevanceScore: 84
  },
  {
    id: 'pw-4',
    name: '色氨酸代谢 (Indole / AhR通路)',
    category: '免疫调节',
    changePercentage: -34,
    status: 'suppressed',
    mechanism: '吲哚-3-丙酸(IPA)合成下调，芳香烃受体(AhR)激动不足，IL-22表达受抑',
    relevanceScore: 78
  },
  {
    id: 'pw-5',
    name: '黏膜屏障完整性与紧密连接功能',
    category: '屏障保护',
    changePercentage: -47,
    status: 'suppressed',
    mechanism: 'Occludin、Claudin-1及ZO-1表达缺失，肠道通透性大幅升高，细菌抗原易位',
    relevanceScore: 95
  },
  {
    id: 'pw-6',
    name: '炎症相关 LPS / TLR4 信号通路',
    category: '炎症通路',
    changePercentage: 61,
    status: 'activated',
    mechanism: '致病性革兰阴性菌增殖导致管腔高浓度游离内毒素，持续激活巨噬细胞释放促炎因子',
    relevanceScore: 89
  }
];

// Donors Database
export const mockDonors: DonorProfile[] = [
  {
    id: 'don-0102',
    code: 'D-0102',
    age: 26,
    gender: '男',
    bmi: 21.4,
    rating: 'A+',
    donorType: '超级供体(Super Donor)',
    screeningStatus: '合格(有效期待定)',
    lastScreenedDate: '2026-08-15 (有效期至 2026-11-15)',
    shannonDiversity: 5.12,
    dominantTaxa: ['Faecalibacterium prausnitzii (12.4%)', 'Akkermansia muciniphila (4.2%)', 'Roseburia intestinalis (5.8%)', 'Bifidobacterium (6.1%)'],
    pathogenTest: '全部阴性 (0/38项)',
    amrGeneRisk: '极低(无高危耐药基因)',
    totalDonations: 24,
    clinicalSuccessRate: 91.2,
    idealIndications: ['溃疡性结肠炎', '难治性CDI', '严重微生态崩解']
  },
  {
    id: 'don-0205',
    code: 'D-0205',
    age: 24,
    gender: '女',
    bmi: 20.1,
    rating: 'A',
    donorType: '健康志愿者',
    screeningStatus: '合格(有效期待定)',
    lastScreenedDate: '2026-08-20 (有效期至 2026-11-20)',
    shannonDiversity: 4.85,
    dominantTaxa: ['Bifidobacterium adolescentis (8.1%)', 'Faecalibacterium (9.8%)', 'Lactobacillus (3.2%)'],
    pathogenTest: '全部阴性 (0/38项)',
    amrGeneRisk: '极低(无高危耐药基因)',
    totalDonations: 16,
    clinicalSuccessRate: 85.0,
    idealIndications: ['肠易激综合征 (IBS)', '慢性功能性便秘', '轻中度结肠炎']
  },
  {
    id: 'don-0089',
    code: 'D-0089',
    age: 31,
    gender: '男',
    bmi: 22.8,
    rating: 'B',
    donorType: '健康志愿者',
    screeningStatus: '复筛中',
    lastScreenedDate: '2026-07-02 (临近复检周期)',
    shannonDiversity: 4.41,
    dominantTaxa: ['Bacteroides ovatus (14.2%)', 'Prevotella copri (9.5%)'],
    pathogenTest: '全部阴性 (0/38项)',
    amrGeneRisk: '低',
    totalDonations: 9,
    clinicalSuccessRate: 76.5,
    idealIndications: ['代谢综合征队列', '单纯性抗生素腹泻']
  }
];

// Frozen Microbiota Batches
export const mockBatches: MicrobiotaBatch[] = [
  {
    batchNumber: 'FMT-2026-0819-B1',
    donorCode: 'D-0102',
    sampleDate: '2026-08-19',
    prepDate: '2026-08-19 14:30',
    storageTemp: '-80°C (智能液氮梯度冷冻)',
    location: '上海精准菌库 A区-02架-08层',
    expiryDate: '2027-02-19',
    qualityGrade: '特级 (临床级)',
    status: '已释放(可使用)',
    viableCellCount: '2.4 × 10¹¹ CFU/g (活菌率 89.2%)'
  },
  {
    batchNumber: 'FMT-2026-0828-B3',
    donorCode: 'D-0102',
    sampleDate: '2026-08-28',
    prepDate: '2026-08-28 11:15',
    storageTemp: '-80°C (智能液氮梯度冷冻)',
    location: '上海精准菌库 A区-02架-12层',
    expiryDate: '2027-02-28',
    qualityGrade: '特级 (临床级)',
    status: '已释放(可使用)',
    viableCellCount: '2.1 × 10¹¹ CFU/g (活菌率 88.5%)'
  },
  {
    batchNumber: 'FMT-2026-0815-C2',
    donorCode: 'D-0205',
    sampleDate: '2026-08-15',
    prepDate: '2026-08-15 16:00',
    storageTemp: '-80°C',
    location: '上海精准菌库 B区-01架-04层',
    expiryDate: '2027-02-15',
    qualityGrade: '优级',
    status: '已释放(可使用)',
    viableCellCount: '1.8 × 10¹¹ CFU/g (活菌率 84.1%)'
  }
];

// AI Matching Evaluation (Patient P-2026-0841 with Donor D-0102)
export const mockMatchEvaluation: MatchEvaluation = {
  donorCode: 'D-0102',
  overallScore: 91.6,
  dimensions: {
    microbiomeComplementarity: 0.92,
    functionalGain: 0.88,
    safetyProfile: 0.95,
    colonizationPotential: 0.86,
    historicalEfficacy: 0.83,
    diseaseSuitability: 0.94
  },
  advantages: [
    '完美补足受体重度缺失的 Akkermansia 与普氏栖粪杆菌，促进黏膜物理与生物屏障重塑',
    '供体丁酸合成基因丰度高达9.4%，显著增强受体SCFA生成能力与抗炎潜能',
    '供体菌群多样性极高 (Shannon 5.12)，定植竞争排斥兼性厌氧大肠埃希菌',
    '供体传染病及38种耐药基因靶点均为阴性，临床级制备活菌率89.2%'
  ],
  potentialRisks: [
    '受体与供体存在微量拟杆菌科(Bacteroidaceae)重叠株，需监测定植初期排气反应',
    '初次移植后需维持短链脂肪酸诱导性底物（高可发酵抗性淀粉+水溶性益生元）协同'
  ],
  aiRecommendation: '供体 D-0102 与患者张云清配型高度吻合，强烈建议执行。采用结肠镜喷洒+口服肠溶微囊化胶囊巩固方案。'
};

// FMT Treatment Protocol
export const mockFMTProtocol: FMTTreatmentProtocol = {
  protocolVersion: 'v1.1 (MDT联合优化版)',
  dateCreated: '2026-09-04',
  author: '陈建国 主任医师 / 消化内科 & 微生物组MDT组',
  administrationRoute: '肠溶胶囊(微囊化)',
  recommendedDose: '50 g 临床级新鲜冻干活菌 (折合 1.2 × 10¹² CFU/疗程)',
  frequency: '第1周连续2次，随后每周1次巩固',
  treatmentDuration: '4 周标准强化重构疗程',
  bowelPreparation: '聚乙二醇电解质散 (PEG) 2000ml 前夜清洁肠道，禁食禁水6小时',
  preTreatment: '移植前30分钟口服质子泵抑制剂 (雷贝拉唑 20mg)，减少胃酸对胶囊水解',
  combinedTherapy: '维持美沙拉嗪口服 3g/d (减量25%)，停用既往抗生素与免疫抑制剂',
  nutritionalIntervention: '高纤维抗性淀粉饮食 (每日膳食纤维≥28g) + 水溶性菊粉益生元 10g/d 辅助定植',
  reviewMilestones: [
    '移植后 24-48小时：监测体温、生命体征及腹胀耐受情况',
    '移植后 4周：复查粪便钙卫蛋白(FC)、CRP及宏基因组测序',
    '移植后 12周：评估Mayo临床缓解率与内镜黏膜愈合情况',
    '移植后 24周：微生态稳态长期维持评估'
  ],
  approvalStatus: '医生已签署'
};

// 10 Safety Rule Gates
export const mockSafetyRules: SafetyRuleGate[] = [
  { id: 'gate-1', name: '活动性急性肠道感染排查 (艰难梭菌/沙门菌/志贺菌)', category: '感染排查', status: 'passed', detail: '粪便核酸多联检全阴性，无急性败血症表现', mandatory: true },
  { id: 'gate-2', name: '供体传染病全套复筛 (HIV/HBV/HCV/梅毒/HTLV/EBV)', category: '供体有效性', status: 'passed', detail: '供体 D-0102 筛查有效期内，检验报告核验无误', mandatory: true },
  { id: 'gate-3', name: '超高危多重耐药菌 (CRE/VRE/ESBL) 阴性确认', category: '感染排查', status: 'passed', detail: '供体及受体均无碳青霉烯耐药肠杆菌检出', mandatory: true },
  { id: 'gate-4', name: '菌液批次质量与超低温冷链溯源', category: '菌液质控', status: 'passed', detail: '批次 FMT-2026-0819-B1 活菌率89.2%，温度记录全程低于-75°C', mandatory: true },
  { id: 'gate-5', name: '菌液有效期核验', category: '菌液质控', status: 'passed', detail: '距离有效期到期还有 162 天，符合优质窗标准', mandatory: true },
  { id: 'gate-6', name: '宿主严重免疫缺陷 / 极低中性粒细胞计数排查', category: '宿主禁忌', status: 'passed', detail: 'ANC: 3.8 × 10⁹/L (正常)，无骨髓抑制或急性造血衰竭', mandatory: true },
  { id: 'gate-7', name: '肠管器质性梗阻 / 中毒性巨结肠排查', category: '宿主禁忌', status: 'passed', detail: '全腹CT平扫排除机械性肠梗阻与中毒性扩张', mandatory: true },
  { id: 'gate-8', name: '重度食物过敏原筛查', category: '宿主禁忌', status: 'passed', detail: '无花生、大豆、乳糜泻及胶囊辅料严重超敏史', mandatory: true },
  { id: 'gate-9', name: '患者与家属知情同意书签署', category: '知情同意', status: 'passed', detail: '已充分告知适应症、可能偶发腹胀/发热及长期随访义务', mandatory: true },
  { id: 'gate-10', name: 'MDT多学科联合审核审批', category: '知情同意', status: 'passed', detail: '消化、微生物、临床药学专家三方电子会签通过', mandatory: true },
];

// Longitudinal Efficacy Points (Patient 张云清)
export const mockLongitudinalPoints: LongitudinalTrackPoint[] = [
  {
    stage: 'baseline',
    label: '治疗前基线',
    date: '2026-08-20',
    shannonDiversity: 2.15,
    donorEngraftmentRate: 0,
    fecalCalprotectin: 632,
    mayoScore: 8,
    scfaSynthesisScore: 28,
    dominantBeneficialRatio: 18.5,
    symptomReliefPercentage: 0
  },
  {
    stage: 'fmt_1',
    label: 'FMT #1 次日',
    date: '2026-09-05',
    shannonDiversity: 2.85,
    donorEngraftmentRate: 38,
    fecalCalprotectin: 580,
    mayoScore: 7,
    scfaSynthesisScore: 42,
    dominantBeneficialRatio: 32.0,
    symptomReliefPercentage: 20
  },
  {
    stage: 'fmt_2',
    label: 'FMT #2 (第2周)',
    date: '2026-09-12',
    shannonDiversity: 3.42,
    donorEngraftmentRate: 58,
    fecalCalprotectin: 390,
    mayoScore: 5,
    scfaSynthesisScore: 61,
    dominantBeneficialRatio: 48.2,
    symptomReliefPercentage: 55
  },
  {
    stage: 'week_4',
    label: '第 4 周 (疗程结束)',
    date: '2026-09-28',
    shannonDiversity: 4.10,
    donorEngraftmentRate: 74,
    fecalCalprotectin: 165,
    mayoScore: 3,
    scfaSynthesisScore: 78,
    dominantBeneficialRatio: 64.5,
    symptomReliefPercentage: 82
  },
  {
    stage: 'week_12',
    label: '第 12 周随访',
    date: '2026-11-28',
    shannonDiversity: 4.38,
    donorEngraftmentRate: 81,
    fecalCalprotectin: 68,
    mayoScore: 1,
    scfaSynthesisScore: 86,
    dominantBeneficialRatio: 72.8,
    symptomReliefPercentage: 94
  },
  {
    stage: 'week_24',
    label: '第 24 周长期稳态',
    date: '2027-02-28',
    shannonDiversity: 4.52,
    donorEngraftmentRate: 83,
    fecalCalprotectin: 42,
    mayoScore: 0,
    scfaSynthesisScore: 89,
    dominantBeneficialRatio: 75.6,
    symptomReliefPercentage: 98
  }
];

// Knowledge Graph Nodes (for deep clinical & microbiome knowledge exploration)
export const mockKnowledgeNodes: KnowledgeNode[] = [
  // Diseases
  { id: 'dis-uc', name: '溃疡性结肠炎 (UC)', type: 'disease', categoryLabel: '消化系统自身免疫病', description: '肠黏膜慢性非特异性炎症，以浅表糜烂溃疡为特征，与微生态多样性崩溃强相关。', val: 28 },
  { id: 'dis-cdi', name: '艰难梭菌感染 (CDI)', type: 'disease', categoryLabel: '感染性肠炎', description: '抗生素过度使用破坏定植抗力后，产毒艰难梭菌爆发繁殖引起的结肠炎。', val: 24 },
  { id: 'dis-ibsd', name: '肠易激综合征 (IBS-D)', type: 'disease', categoryLabel: '功能性胃肠病', description: '脑-肠-菌群轴失衡所致的腹部隐痛与大便性状异常，黏膜屏障低度通透。', val: 20 },

  // Microbes
  { id: 'mic-akk', name: '嗜黏蛋白阿克曼氏菌', type: 'microbe', categoryLabel: '有益关键菌', description: '特异降解利用黏蛋白，刺激杯状细胞与紧密连接修复，改善宿主糖脂代谢与黏膜屏障。', val: 22 },
  { id: 'mic-faecal', name: '普氏栖粪杆菌', type: 'microbe', categoryLabel: '有益丁酸生成菌', description: '抗炎核心菌，分泌MAM蛋白阻断NF-κB信号，患者溃疡活动期显著亏空。', val: 24 },
  { id: 'mic-bifido', name: '长双歧杆菌', type: 'microbe', categoryLabel: '益生菌群', description: '酸化肠腔微环境，诱导抑炎细胞因子IL-10产生，对病原菌形成空间占位阻隔。', val: 18 },
  { id: 'mic-ecoli', name: '大肠埃希氏菌', type: 'microbe', categoryLabel: '条件致病菌', description: '含致病岛及毒力因子，在氧化应激状态下优势扩增，释放LPS驱动炎性因子级联。', val: 18 },
  { id: 'mic-cdiff', name: '艰难梭菌 (产毒株)', type: 'microbe', categoryLabel: '绝对致病菌', description: '分泌TcdA/TcdB毒素破坏细胞骨架，造成伪膜形成与严重上皮坏死。', val: 20 },

  // Metabolites
  { id: 'met-butyrate', name: '丁酸 (Butyrate)', type: 'metabolite', categoryLabel: '短链脂肪酸', description: '结肠上皮细胞主要供能物质(提供70%能量)，组蛋白去乙酰化酶(HDAC)抑制剂，促Treg分化。', val: 22 },
  { id: 'met-scfa', name: '乙酸 / 丙酸 (SCFA)', type: 'metabolite', categoryLabel: '短链脂肪酸', description: '激活GPR41/43/109A受体，降低肠腔渗透压，促肠嗜铬细胞释放5-HT。', val: 18 },
  { id: 'met-lps', name: '脂多糖内毒素 (LPS)', type: 'metabolite', categoryLabel: '促炎毒素', description: '革兰氏阴性菌外膜成分，与LBP结合激活TLR4/MD2复合物，诱发剧烈细胞因子风暴。', val: 20 },
  { id: 'met-secba', name: '次级胆汁酸 (DCA/LCA)', type: 'metabolite', categoryLabel: '微生态代谢物', description: '由初级胆汁酸经7α-脱羟基作用转化，高浓度可直接抑制C. diff芽孢萌发。', val: 16 },
  { id: 'met-indole', name: '吲哚-3-丙酸 (IPA)', type: 'metabolite', categoryLabel: '色氨酸代谢产物', description: '芳香烃受体(AhR)强效激动剂，维持潘氏细胞抗菌肽分泌与上皮完整性。', val: 15 },

  // Immune Targets
  { id: 'imm-il10', name: '白介素-10 (IL-10)', type: 'immune', categoryLabel: '抗炎细胞因子', description: '由Treg及调节性B细胞分泌，负调控促炎因子转录，维持黏膜免疫耐受。', val: 16 },
  { id: 'imm-tnfa', name: '肿瘤坏死因子-α (TNF-α)', type: 'immune', categoryLabel: '促炎细胞因子', description: '炎症级联核心介质，增加黏膜微血管通透性，导致上皮坏死脱落。', val: 18 },
  { id: 'imm-barrier', name: '紧密连接蛋白 (Claudin/ZO-1)', type: 'immune', categoryLabel: '黏膜屏障结构', description: '维持上皮细胞极性与选择性通透性的物理基础，抗击抗原渗透的核心防线。', val: 20 },

  // Therapies
  { id: 'the-fmt', name: '精准菌群移植 (MicroFMT)', type: 'therapy', categoryLabel: '微生态干预手段', description: '将健康供体功能性菌群整体移植入患者肠道，实现生态位重构与免疫重置。', val: 26 },
  { id: 'the-superdonor', name: '超级供体 D-0102 配型', type: 'therapy', categoryLabel: '生物制剂', description: '具备超高Shannon多样性、富含AKK与普氏菌的高活菌级微囊化制剂。', val: 22 },
  { id: 'the-diet', name: '益生元与抗性淀粉辅助', type: 'therapy', categoryLabel: '靶向营养干预', description: '为移植菌株定植提供特异性碳源营养基底，加速丁酸与多糖合成。', val: 16 }
];

// Knowledge Graph Links
export const mockKnowledgeLinks: KnowledgeLink[] = [
  // Disease to Microbe
  { source: 'dis-uc', target: 'mic-faecal', relation: '伴随显著缺失', effect: 'negative' },
  { source: 'dis-uc', target: 'mic-akk', relation: '丰度锐减', effect: 'negative' },
  { source: 'dis-uc', target: 'mic-ecoli', relation: '过度扩增', effect: 'positive' },
  { source: 'dis-cdi', target: 'mic-cdiff', relation: '病原菌爆发繁殖', effect: 'positive' },
  { source: 'dis-cdi', target: 'mic-bifido', relation: '定植抗力丧失', effect: 'negative' },
  
  // Microbe to Metabolite
  { source: 'mic-faecal', target: 'met-butyrate', relation: '高效生成合成', effect: 'positive' },
  { source: 'mic-akk', target: 'met-scfa', relation: '产乙酸/丙酸', effect: 'positive' },
  { source: 'mic-akk', target: 'imm-barrier', relation: '上调紧密连接蛋白表达', effect: 'positive' },
  { source: 'mic-bifido', target: 'met-scfa', relation: '分泌乙酸乳酸', effect: 'positive' },
  { source: 'mic-ecoli', target: 'met-lps', relation: '大量释放游离内毒素', effect: 'positive' },
  { source: 'mic-faecal', target: 'met-indole', relation: '促进吲哚衍生物转化', effect: 'positive' },
  
  // Metabolite to Immune / Target
  { source: 'met-butyrate', target: 'imm-il10', relation: '诱导Treg分化分泌', effect: 'positive' },
  { source: 'met-butyrate', target: 'imm-barrier', relation: '供给结肠上皮能量加速修复', effect: 'positive' },
  { source: 'met-butyrate', target: 'imm-tnfa', relation: '强效抑制转录表达', effect: 'negative' },
  { source: 'met-lps', target: 'imm-tnfa', relation: '激活TLR4通路触发释放', effect: 'positive' },
  { source: 'met-secba', target: 'mic-cdiff', relation: '抑制芽孢萌发与繁殖', effect: 'negative' },
  
  // Therapy to System
  { source: 'the-fmt', target: 'dis-uc', relation: '实现深度黏膜愈合与缓解', effect: 'positive' },
  { source: 'the-fmt', target: 'dis-cdi', relation: '临床治愈率高达90%+', effect: 'positive' },
  { source: 'the-superdonor', target: 'the-fmt', relation: '提供高丰度活性菌源', effect: 'positive' },
  { source: 'the-fmt', target: 'mic-akk', relation: '补足缺失活菌定植', effect: 'positive' },
  { source: 'the-fmt', target: 'mic-faecal', relation: '生态重建供体定植', effect: 'positive' },
  { source: 'the-fmt', target: 'mic-ecoli', relation: '菌群生态竞争挤出', effect: 'negative' },
  { source: 'the-diet', target: 'the-fmt', relation: '代谢基底协同增效', effect: 'positive' }
];
