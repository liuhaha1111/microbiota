import { 
  MicrobialTaxon, 
  EcologicalLink, 
  FunctionalPathway, 
  MatchEvaluation, 
  FMTTreatmentProtocol, 
  SafetyRuleGate, 
  LongitudinalTrackPoint
} from '../types';

export interface PatientDataPackage {
  patientId: string;
  microbiomeStats: {
    shannonDiversity: number;
    beneficialRatio: number;
    pathogenLoad: number;
    dominantFeature: string;
    lesionSegment: string;
    targetDiseaseId: string;
    clinicalAlert: {
      level: 'critical' | 'warning' | 'normal';
      title: string;
      time: string;
      desc: string;
      actionText: string;
      targetTab: string;
    };
  };
  taxa: MicrobialTaxon[];
  ecologicalLinks: EcologicalLink[];
  pathways: FunctionalPathway[];
  matchEvaluation: MatchEvaluation;
  fmtProtocol: FMTTreatmentProtocol;
  safetyRules: SafetyRuleGate[];
  longitudinalPoints: LongitudinalTrackPoint[];
  aiAdvice: string;
}

// 1. 张云清 (P-2026-0841) - 溃疡性结肠炎 (UC, 中度活动期)
const patientUC: PatientDataPackage = {
  patientId: 'P-2026-0841',
  microbiomeStats: {
    shannonDiversity: 2.15,
    beneficialRatio: 18.5,
    pathogenLoad: 42.8,
    dominantFeature: '极度缺失产丁酸菌与AKK菌，兼性厌氧变形菌门异常增殖',
    lesionSegment: 'descending',
    targetDiseaseId: 'dis-uc',
    clinicalAlert: {
      level: 'warning',
      title: '供体 D-0102 菌液已出库，待签署执行',
      time: '1小时前',
      desc: '批次 FMT-2026-0819-B1 处于最佳活性窗口期 (剩162天)，已匹配受体张云清，请尽速签署执行医嘱。',
      actionText: '查看供受体匹配方案',
      targetTab: 'donor_matching'
    }
  },
  taxa: [
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
      abundance: 0.02,
      normalRange: [0.0, 0.05],
      relativeChange: 0,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '常规阴性状态，处于安全门控低风险范围。',
      primaryMetabolites: ['微量代谢物'],
      therapeuticTarget: '微生态屏障常态化防护'
    },
    {
      id: 'tax-9',
      name: 'Eubacterium rectale',
      chineseName: '直肠真杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.38,
      normalRange: [2.0, 5.5],
      relativeChange: -81,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '产丁酸梭菌群核心成员，经丁酰辅酶A途径生成丁酸，是结肠上皮细胞最主要的外源能量来源。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乙酸'],
      therapeuticTarget: '重建产丁酸菌群，修补上皮细胞的能量代谢缺口'
    },
    {
      id: 'tax-10',
      name: 'Anaerostipes hadrus',
      chineseName: '哈氏厌氧丁酸菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.22,
      normalRange: [1.2, 3.8],
      relativeChange: -76,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '交叉喂养型丁酸菌，自身不产乳酸，依赖双歧杆菌与罗斯氏菌提供的乳酸、乙酸完成丁酸合成。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乳酸转化产物'],
      therapeuticTarget: '打通乳酸—丁酸转化链，防止乳酸在肠腔堆积刺激内脏感觉神经'
    },
    {
      id: 'tax-11',
      name: 'Bifidobacterium bifidum',
      chineseName: '双叉双歧杆菌',
      phylum: '放线菌门(Actinobacteria)',
      category: 'beneficial',
      abundance: 0.85,
      normalRange: [2.0, 6.0],
      relativeChange: -58,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '表达黏蛋白降解酶与菌毛样黏附蛋白，可早期定植并稳定黏膜免疫耐受，是放线菌门的定植先导菌。',
      primaryMetabolites: ['乙酸', '叶酸', '胞外多糖'],
      therapeuticTarget: '恢复放线菌门丰度，重建黏膜免疫耐受'
    },
    {
      id: 'tax-12',
      name: 'Blautia producta',
      chineseName: '产气布劳特氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'commensal',
      abundance: 2.4,
      normalRange: [3.0, 8.5],
      relativeChange: -34,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '常见共生菌，可将乳酸与乙酸转化为丁酸；其丰度下降与肠道炎症活动度升高显著相关。',
      primaryMetabolites: ['丁酸', '乙酸'],
      therapeuticTarget: '监测共生菌群的缓冲能力，作为炎症活动度的参考指标'
    },
    {
      id: 'tax-13',
      name: 'Parabacteroides distasonis',
      chineseName: '迪氏副拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 1.6,
      normalRange: [2.5, 7.0],
      relativeChange: -42,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '分泌琥珀酸并参与次级胆汁酸代谢，可诱导宿主糖原异生改善代谢，与低炎症表型正相关。',
      primaryMetabolites: ['琥珀酸', '次级胆汁酸'],
      therapeuticTarget: '恢复次级胆汁酸代谢通路，抑制致病芽孢萌发'
    },
    {
      id: 'tax-14',
      name: 'Bacteroides thetaiotaomicron',
      chineseName: '多形拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 3.8,
      normalRange: [4.0, 11.0],
      relativeChange: -21,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '多糖利用位点最丰富的拟杆菌，降解膳食纤维维持肠腔碳源供给，是菌群互养网络的代谢枢纽。',
      primaryMetabolites: ['丙酸', '乙酸', '多糖降解酶'],
      therapeuticTarget: '维持碳源供给枢纽，防止菌群营养链断裂'
    },
    {
      id: 'tax-15',
      name: 'Klebsiella pneumoniae',
      chineseName: '肺炎克雷伯菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 5.2,
      normalRange: [0.1, 1.0],
      relativeChange: 264,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '炎症肠段硝酸盐富集使其异常扩增；荚膜与生物膜增强黏附力，部分菌株携带碳青霉烯酶。',
      primaryMetabolites: ['脂多糖 (LPS)', '荚膜多糖'],
      therapeuticTarget: '挤压变形菌门生态位，防范耐药株形成肠道储库'
    },
    {
      id: 'tax-16',
      name: 'Proteus mirabilis',
      chineseName: '奇异变形杆菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 2.1,
      normalRange: [0.05, 0.8],
      relativeChange: 180,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '具脲酶活性的兼性厌氧菌，产氨抬高肠腔 pH 并削弱屏障，是黏膜破损时的易位风险源。',
      primaryMetabolites: ['尿素酶', '氨', '脂多糖 (LPS)'],
      therapeuticTarget: '抑制脲酶活性，阻断氨致黏膜碱化损伤'
    }

  ],
  ecologicalLinks: [
    { source: 'tax-1', target: 'tax-2', type: 'synergy', weight: 0.85, description: 'AKK降解黏蛋白释放单糖及短肽，跨营养喂养普氏栖粪杆菌产生丁酸' },
    { source: 'tax-3', target: 'tax-2', type: 'synergy', weight: 0.78, description: '双歧杆菌产生乙酸与乳酸，作为前体供普氏栖粪杆菌合成丁酸' },
    { source: 'tax-3', target: 'tax-4', type: 'synergy', weight: 0.72, description: '双歧杆菌降解复杂聚糖，协助罗斯氏菌完成碳源代谢' },
    { source: 'tax-1', target: 'tax-6', type: 'antagonism', weight: 0.9, description: 'AKK强化黏膜屏障隔绝大肠杆菌与上皮接触，并竞逐表面黏附位点' },
    { source: 'tax-2', target: 'tax-6', type: 'antagonism', weight: 0.82, description: '丁酸降低管腔氧张力并激活PPAR-γ通路，抑制兼性厌氧大肠杆菌增殖' },
    { source: 'tax-2', target: 'tax-8', type: 'antagonism', weight: 0.95, description: '维持健康胆汁酸代谢抑制致病芽孢萌发' },
    { source: 'tax-3', target: 'tax-7', type: 'antagonism', weight: 0.75, description: '低pH微环境与双歧杆菌素显著抑制肠球菌生物膜形成' },
    { source: 'tax-6', target: 'tax-7', type: 'synergy', weight: 0.65, description: '炎症微环境下变形菌门与球菌协同消耗氧气并诱导氧化应激' },
{ source: 'tax-1', target: 'tax-9', type: 'synergy', weight: 0.70, description: 'AKK 降解释放的乙酸与单糖为直肠真杆菌补充碳源，共同抬高肠腔丁酸产量' },
{ source: 'tax-3', target: 'tax-10', type: 'synergy', weight: 0.68, description: '双歧杆菌水解聚果糖的产物经交叉喂养供哈氏厌氧丁酸菌转化为丁酸' },
{ source: 'tax-4', target: 'tax-11', type: 'synergy', weight: 0.66, description: '罗斯氏菌与双叉双歧杆菌协同降解宿主黏蛋白聚糖，形成互养代谢对' },
{ source: 'tax-2', target: 'tax-12', type: 'synergy', weight: 0.60, description: '丁酸下调管腔 pH，为产气布劳特氏菌创造适宜定植的酸性生态位' },
{ source: 'tax-5', target: 'tax-13', type: 'commensal', weight: 0.55, description: '拟杆菌属间共享多糖利用位点，迪氏副拟杆菌与脆弱拟杆菌协同降解膳食纤维' },
{ source: 'tax-5', target: 'tax-14', type: 'commensal', weight: 0.58, description: '多形拟杆菌与脆弱拟杆菌共用荚膜多糖合成通路，维持拟杆菌门内部稳态' },
{ source: 'tax-1', target: 'tax-15', type: 'antagonism', weight: 0.84, description: 'AKK 维持的黏液层完整性限制克雷伯菌穿透上皮，并竞争同一黏附受体' },
{ source: 'tax-2', target: 'tax-15', type: 'antagonism', weight: 0.80, description: '丁酸抑制克雷伯菌荚膜表达与生物膜形成，削弱其肠道定植能力' },
{ source: 'tax-15', target: 'tax-6', type: 'synergy', weight: 0.70, description: '两种变形菌门成员在硝酸盐富集环境中协同进行厌氧硝酸盐呼吸，共同扩增' },
{ source: 'tax-16', target: 'tax-7', type: 'synergy', weight: 0.62, description: '奇异变形杆菌脲酶抬高局部 pH，为粪肠球菌提供更有利的生存微环境' },
{ source: 'tax-9', target: 'tax-6', type: 'antagonism', weight: 0.78, description: '直肠真杆菌产丁酸降低管腔氧张力，抑制兼性厌氧大肠杆菌的呼吸优势' },
{ source: 'tax-13', target: 'tax-6', type: 'antagonism', weight: 0.64, description: '迪氏副拟杆菌分泌琥珀酸竞争碳源，抑制大肠杆菌在炎症肠段的过度增殖' }

  ],
  pathways: [
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
      name: '次级胆汁酸代谢 (Secondary Bile Acids)',
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
  ],
  matchEvaluation: {
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
  },
  fmtProtocol: {
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
  },
  safetyRules: [
    { id: 'gate-1', name: '活动性急性肠道感染排查 (艰难梭菌/沙门菌/志贺菌)', category: '感染排查', status: 'passed', detail: '粪便核酸多联检全阴性，无急性败血症表现', mandatory: true },
    { id: 'gate-2', name: '供体传染病全套复筛 (HIV/HBV/HCV/梅毒/HTLV/EBV)', category: '供体有效性', status: 'passed', detail: '供体 D-0102 筛查有效期内，检验报告核验无误', mandatory: true },
    { id: 'gate-3', name: '超高危多重耐药菌 (CRE/VRE/ESBL) 阴性确认', category: '感染排查', status: 'passed', detail: '供体及受体均无碳青霉烯耐药肠杆菌检出', mandatory: true },
    { id: 'gate-4', name: '菌液批次质量与超低温冷链溯源', category: '菌液质控', status: 'passed', detail: '批次 FMT-2026-0819-B1 活菌率89.2%，全程低于-75°C', mandatory: true },
    { id: 'gate-5', name: '菌液有效期核验', category: '菌液质控', status: 'passed', detail: '距离有效期到期还有 162 天，符合优质窗标准', mandatory: true },
    { id: 'gate-6', name: '宿主严重免疫缺陷 / 极低中性粒细胞计数排查', category: '宿主禁忌', status: 'passed', detail: 'ANC: 3.8 × 10⁹/L (正常)，无骨髓抑制', mandatory: true },
    { id: 'gate-7', name: '肠管器质性梗阻 / 中毒性巨结肠排查', category: '宿主禁忌', status: 'passed', detail: '全腹CT平扫排除机械性肠梗阻与中毒性扩张', mandatory: true },
    { id: 'gate-8', name: '重度食物过敏原筛查', category: '宿主禁忌', status: 'passed', detail: '无花生、大豆、乳糜泻及胶囊辅料严重超敏史', mandatory: true },
    { id: 'gate-9', name: '患者与家属知情同意书签署', category: '知情同意', status: 'passed', detail: '已充分告知适应症及随访义务', mandatory: true },
    { id: 'gate-10', name: 'MDT多学科联合审核审批', category: '知情同意', status: 'passed', detail: '消化、微生物、临床药学专家三方电子会签通过', mandatory: true }
  ],
  longitudinalPoints: [
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
  ],
  aiAdvice: '建议实施 FMT + 靶向营养干预 联合方案。通过高活性供体菌液定植补足 Akkermansia 与产丁酸菌，配合口服高纤维抗性淀粉作为定植底物，并维持原抗炎用药。'
};

// 2. 李国强 (P-2026-0719) - 复发性艰难梭菌感染 (rCDI, 重症高危型)
const patientCDI: PatientDataPackage = {
  patientId: 'P-2026-0719',
  microbiomeStats: {
    shannonDiversity: 1.42,
    beneficialRatio: 5.2,
    pathogenLoad: 68.4,
    dominantFeature: '艰难梭菌爆发繁殖(28.5%)，产毒株A/B毒素释放，次级胆汁酸定植抗力完全崩解',
    lesionSegment: 'cecum',
    targetDiseaseId: 'dis-cdi',
    clinicalAlert: {
      level: 'critical',
      title: '高热与水样泻危急值 (李国强)',
      time: '10分钟前',
      desc: '移植执行期体温38.4°C，CRP激增至58.2mg/L。已锁定抗生素使用记录并完成万古霉素洗脱停药，需即刻内镜喷洒。',
      actionText: '调阅执行期处方与安全门控',
      targetTab: 'donor_matching'
    }
  },
  taxa: [
    {
      id: 'tax-cd-1',
      name: 'Clostridioides difficile',
      chineseName: '艰难梭菌 (产毒株 TcdA/B+)',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'pathogen',
      abundance: 28.5,
      normalRange: [0.0, 0.05],
      relativeChange: 57000,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '三次复发核心致病原，A/B双毒素大量分泌破坏上皮微丝，引致伪膜形成与严重暴发性水样泻。',
      primaryMetabolites: ['肠毒素A (TcdA)', '细胞毒素B (TcdB)'],
      therapeuticTarget: '紧急通过供体次级胆汁酸转化菌实施生态位挤压阻断'
    },
    {
      id: 'tax-cd-2',
      name: 'Enterococcus faecium',
      chineseName: '屎肠球菌 (多重耐药株)',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'opportunistic',
      abundance: 16.8,
      normalRange: [0.1, 1.0],
      relativeChange: 1580,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '广谱抗生素压力下筛选出的优势机会致病菌，加剧肠黏膜氧化应激与穿孔风险。',
      primaryMetabolites: ['溶细胞素', '超氧阴离子'],
      therapeuticTarget: '供体厌氧菌群群落占位抑制'
    },
    {
      id: 'tax-cd-3',
      name: 'Klebsiella pneumoniae',
      chineseName: '肺炎克雷伯菌 (肠道扩增株)',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 12.4,
      normalRange: [0.1, 1.2],
      relativeChange: 933,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '兼性厌氧产气致病菌，随微生态崩溃而疯狂占位，具有菌血症播散高危风险。',
      primaryMetabolites: ['荚膜多糖', '内毒素LPS'],
      therapeuticTarget: '通过供体定植降低管腔氧含量实施厌氧反扑'
    },
    {
      id: 'tax-cd-4',
      name: 'Escherichia coli',
      chineseName: '大肠埃希氏菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 10.7,
      normalRange: [0.5, 3.0],
      relativeChange: 256,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '炎性微环境中硝酸盐呼吸扩增，协同产毒梭菌破坏黏膜。',
      primaryMetabolites: ['脂多糖 (LPS)'],
      therapeuticTarget: '微生态置换目标'
    },
    {
      id: 'tax-cd-5',
      name: 'Faecalibacterium prausnitzii',
      chineseName: '普氏栖粪杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.05,
      normalRange: [5.0, 12.0],
      relativeChange: -99,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '抗生素清剿后几乎灭绝，导致丁酸合成完全停滞，肠上皮供能衰竭。',
      primaryMetabolites: ['丁酸 (极匮乏)'],
      therapeuticTarget: '超级供体核心移植重建菌株'
    },
    {
      id: 'tax-cd-6',
      name: 'Bifidobacterium longum',
      chineseName: '长双歧杆菌',
      phylum: '放线菌门(Actinobacteria)',
      category: 'beneficial',
      abundance: 0.12,
      normalRange: [3.0, 8.0],
      relativeChange: -98,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '天然定植抗力屏障崩溃，肠腔失去抑菌有机酸缓冲。',
      primaryMetabolites: ['乙酸 (匮乏)'],
      therapeuticTarget: '供体高丰度菌株定植'
    },
    {
      id: 'tax-cd-7',
      name: 'Akkermansia muciniphila',
      chineseName: '嗜黏蛋白阿克曼氏菌',
      phylum: '疣微菌门(Verrucomicrobia)',
      category: 'beneficial',
      abundance: 0.22,
      normalRange: [1.5, 4.0],
      relativeChange: -93,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '黏液层几乎完全剥脱，基底膜暴露于双毒素直接攻击。',
      primaryMetabolites: ['外膜蛋白Amuc_1100'],
      therapeuticTarget: '重建杯状细胞黏蛋白保护带'
    },
    {
      id: 'tax-cd-8',
      name: 'Bacteroides thetaiotaomicron',
      chineseName: '多形拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 3.1,
      normalRange: [4.0, 10.0],
      relativeChange: -55,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '残存中性共生拟杆菌，碳水化合物利用受限。',
      primaryMetabolites: ['丙酸', '短链聚糖'],
      therapeuticTarget: '恢复复杂聚糖发酵网络'
    },
    {
      id: 'tax-cd-9',
      name: 'Eubacterium rectale',
      chineseName: '直肠真杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.03,
      normalRange: [2.0, 5.5],
      relativeChange: -98,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '产丁酸梭菌群核心成员，经丁酰辅酶A途径生成丁酸，是结肠上皮细胞最主要的外源能量来源。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乙酸'],
      therapeuticTarget: '重建产丁酸菌群，修补上皮细胞的能量代谢缺口'
    },
    {
      id: 'tax-cd-10',
      name: 'Roseburia intestinalis',
      chineseName: '肠道罗斯氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.04,
      normalRange: [2.5, 6.0],
      relativeChange: -97,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '利用膳食多糖产生大量丁酸，改善黏膜厚度；在菌群贫化肠道中属于最早消失的一批产丁酸菌。',
      primaryMetabolites: ['丁酸', '甲酸'],
      therapeuticTarget: '重建丁酸供给，恢复上皮屏障厚度'
    },
    {
      id: 'tax-cd-11',
      name: 'Blautia producta',
      chineseName: '产气布劳特氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'commensal',
      abundance: 1.2,
      normalRange: [3.0, 8.5],
      relativeChange: -71,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '常见共生菌，可将乳酸与乙酸转化为丁酸；其丰度下降与肠道炎症活动度升高显著相关。',
      primaryMetabolites: ['丁酸', '乙酸'],
      therapeuticTarget: '监测共生菌群的缓冲能力，作为炎症活动度的参考指标'
    },
    {
      id: 'tax-cd-12',
      name: 'Bacteroides vulgatus',
      chineseName: '普通拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 2.8,
      normalRange: [3.0, 9.0],
      relativeChange: -58,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '拟杆菌门常见成员，参与多糖降解与胆汁酸转化；其异常增殖与内脏高敏感存在关联。',
      primaryMetabolites: ['丙酸', '乙酸'],
      therapeuticTarget: '监测拟杆菌门内部平衡，评估内脏敏感风险'
    },
    {
      id: 'tax-cd-13',
      name: 'Parabacteroides distasonis',
      chineseName: '迪氏副拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 1.1,
      normalRange: [2.5, 7.0],
      relativeChange: -74,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '分泌琥珀酸并参与次级胆汁酸代谢，可诱导宿主糖原异生改善代谢，与低炎症表型正相关。',
      primaryMetabolites: ['琥珀酸', '次级胆汁酸'],
      therapeuticTarget: '恢复次级胆汁酸代谢通路，抑制致病芽孢萌发'
    },
    {
      id: 'tax-cd-14',
      name: 'Proteus mirabilis',
      chineseName: '奇异变形杆菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 4.6,
      normalRange: [0.05, 0.8],
      relativeChange: 340,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '具脲酶活性的兼性厌氧菌，产氨抬高肠腔 pH 并削弱屏障，是黏膜破损时的易位风险源。',
      primaryMetabolites: ['尿素酶', '氨', '脂多糖 (LPS)'],
      therapeuticTarget: '抑制脲酶活性，阻断氨致黏膜碱化损伤'
    },
    {
      id: 'tax-cd-15',
      name: 'Streptococcus anginosus',
      chineseName: '咽峡炎链球菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'opportunistic',
      abundance: 2.2,
      normalRange: [0.1, 1.2],
      relativeChange: 210,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '米勒链球菌群成员，消耗残余氧气并分泌透明质酸酶，在黏膜破损时可协同促炎。',
      primaryMetabolites: ['透明质酸酶', '乳酸'],
      therapeuticTarget: '抑制协同促炎效应，保护溃疡面'
    },
    {
      id: 'tax-cd-16',
      name: 'Enterobacter cloacae',
      chineseName: '阴沟肠杆菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 3.4,
      normalRange: [0.05, 0.6],
      relativeChange: 268,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '兼性厌氧的医院获得性条件致病菌，可在抗生素压力下快速扩增并获得多重耐药表型。',
      primaryMetabolites: ['脂多糖 (LPS)', 'AmpC β-内酰胺酶'],
      therapeuticTarget: '限制抗生素后扩增，防止院内耐药株定植'
    }

  ],
  ecologicalLinks: [
    { source: 'tax-cd-1', target: 'tax-cd-2', type: 'synergy', weight: 0.88, description: '产毒梭菌破坏上皮屏障，协助肠球菌形成深部侵润生物膜' },
    { source: 'tax-cd-1', target: 'tax-cd-3', type: 'synergy', weight: 0.82, description: '克雷伯菌消耗残余氧气，为专性厌氧艰难梭菌创造极佳发酵温床' },
    { source: 'tax-cd-5', target: 'tax-cd-1', type: 'antagonism', weight: 0.98, description: '供体普氏菌与拟杆菌合成次级胆汁酸 (DCA)，直接抑制艰难梭菌芽孢萌发' },
    { source: 'tax-cd-6', target: 'tax-cd-1', type: 'antagonism', weight: 0.92, description: '双歧杆菌生成高浓度乙酸酸化肠腔，破坏产毒梭菌营养体细胞活性' },
    { source: 'tax-cd-7', target: 'tax-cd-1', type: 'antagonism', weight: 0.85, description: 'AKK黏蛋白定植空间竞争，隔绝毒素A/B接触上皮受体' },
    { source: 'tax-cd-5', target: 'tax-cd-3', type: 'antagonism', weight: 0.78, description: '丁酸激活结肠上皮氧化磷酸化，剥夺变形菌门硝酸盐呼吸电子受体' },
{ source: 'tax-cd-9', target: 'tax-cd-1', type: 'antagonism', weight: 0.90, description: '直肠真杆菌产丁酸抑制艰难梭菌营养体生长，并显著降低芽孢萌发率' },
{ source: 'tax-cd-10', target: 'tax-cd-1', type: 'antagonism', weight: 0.88, description: '罗斯氏菌产丁酸与甲酸酸化肠腔，破坏产毒梭菌赖以发酵的微环境' },
{ source: 'tax-cd-11', target: 'tax-cd-1', type: 'antagonism', weight: 0.76, description: '产气布劳特氏菌竞争碳源并维持低 pH，压缩艰难梭菌的生态位' },
{ source: 'tax-cd-12', target: 'tax-cd-2', type: 'antagonism', weight: 0.72, description: '普通拟杆菌与屎肠球菌争夺同一多糖底物，抑制后者在回肠末端定植' },
{ source: 'tax-cd-13', target: 'tax-cd-3', type: 'antagonism', weight: 0.70, description: '迪氏副拟杆菌分泌琥珀酸竞争碳源，削弱克雷伯菌的扩增优势' },
{ source: 'tax-cd-14', target: 'tax-cd-2', type: 'synergy', weight: 0.64, description: '奇异变形杆菌脲酶产氨抬高肠腔 pH，与屎肠球菌协同形成碱性生物膜微环境' },
{ source: 'tax-cd-15', target: 'tax-cd-1', type: 'synergy', weight: 0.68, description: '咽峡炎链球菌消耗残余氧气并释放代谢物，协助产毒梭菌维持厌氧发酵条件' },
{ source: 'tax-cd-16', target: 'tax-cd-1', type: 'synergy', weight: 0.72, description: '阴沟肠杆菌硝酸盐呼吸消耗氧，为专性厌氧艰难梭菌创造更佳的发酵温床' },
{ source: 'tax-cd-9', target: 'tax-cd-3', type: 'antagonism', weight: 0.74, description: '丁酸激活上皮氧化磷酸化，剥夺变形菌门硝酸盐呼吸所需的电子受体' },
{ source: 'tax-cd-11', target: 'tax-cd-4', type: 'antagonism', weight: 0.66, description: '产气布劳特氏菌酸化肠腔，抑制大肠杆菌在菌群贫化肠道中的过度增殖' },
{ source: 'tax-cd-12', target: 'tax-cd-3', type: 'commensal', weight: 0.52, description: '拟杆菌属内共享多糖利用位点，维持残余共生菌的碳源互养网络' },
{ source: 'tax-cd-13', target: 'tax-cd-8', type: 'commensal', weight: 0.48, description: '迪氏副拟杆菌与多形拟杆菌协同降解膳食纤维，构成残余的碳源供给枢纽' }

  ],
  pathways: [
    {
      id: 'pw-cd-1',
      name: '次级胆汁酸 (Secondary Bile Acids) 芽孢抑制通路',
      category: '代谢功能',
      changePercentage: -86,
      status: 'suppressed',
      mechanism: '胆盐水解酶(BSH)及7α-脱羟基酶菌群彻底归零，脱氧胆酸/石胆酸缺失导致芽孢无休止萌发',
      relevanceScore: 99
    },
    {
      id: 'pw-cd-2',
      name: '艰难梭菌毒素A/B介导细胞骨架解聚',
      category: '炎症通路',
      changePercentage: 94,
      status: 'activated',
      mechanism: 'Rho GTP酶高水平葡萄糖基化，肌动蛋白微丝解聚，肠上皮极性丧失并形成弥漫假膜',
      relevanceScore: 98
    },
    {
      id: 'pw-cd-3',
      name: '肠道微生态定植抗力 (Colonization Resistance)',
      category: '屏障保护',
      changePercentage: -92,
      status: 'suppressed',
      mechanism: '长期大剂量抗生素导致天然厌氧群落几乎全军覆没，生态位完全门户洞开',
      relevanceScore: 96
    },
    {
      id: 'pw-cd-4',
      name: '短链脂肪酸生成与结肠能量代谢',
      category: '代谢功能',
      changePercentage: -68,
      status: 'suppressed',
      mechanism: '产丁酸与丙酸菌株丰度不足0.2%，上皮线粒体严重缺乏ATP合成底物',
      relevanceScore: 88
    },
    {
      id: 'pw-cd-5',
      name: '肠黏膜急性坏死与促炎级联 (IL-1β/TNF-α)',
      category: '炎症通路',
      changePercentage: 85,
      status: 'activated',
      mechanism: '毒素刺激单核巨噬细胞与肥大细胞，急剧释放IL-8及趋化因子引起高热与中性粒细胞大量浸润',
      relevanceScore: 92
    },
    {
      id: 'pw-cd-6',
      name: '肠上皮氧化应激与自由基损伤通路',
      category: '屏障保护',
      changePercentage: 78,
      status: 'activated',
      mechanism: '大量肠球菌与兼性菌释放超氧阴离子，氧化修饰紧密连接蛋白',
      relevanceScore: 82
    }
  ],
  matchEvaluation: {
    donorCode: 'D-0102',
    overallScore: 95.8,
    dimensions: {
      microbiomeComplementarity: 0.96,
      functionalGain: 0.95,
      safetyProfile: 0.98,
      colonizationPotential: 0.94,
      historicalEfficacy: 0.96,
      diseaseSuitability: 0.98
    },
    advantages: [
      '超级供体 D-0102 富含超高活性胆盐水解酶 (BSH) 菌群，移植后可迅速恢复次级胆汁酸生成，直接阻断艰难梭菌芽孢萌发',
      '历史临床治愈CDI成功率高达94.2%，被最新 ACG 难治性 CDI 指南列为首选超级供体',
      '供体38项病原及超级耐药基因全套筛查全部阴性，零感染传递风险',
      '供体高丰度厌氧菌迅速消耗管腔氧气，阻断兼性厌氧肠球菌与克雷伯菌异常扩增'
    ],
    potentialRisks: [
      '患者年逾67岁合并营养不良，内镜给药期间需由麻醉医师全程监护生命体征',
      '严禁在口服万古霉素未停药状态下行FMT，需维持停药洗脱期≥48小时'
    ],
    aiRecommendation: '供体 D-0102 与患者李国强高度匹配。紧急推荐：经结肠镜直达回盲部单次大容量喷洒，术后配合口服微囊胶囊巩固。'
  },
  fmtProtocol: {
    protocolVersion: 'v2.0 (CDI急症阻断专项)',
    dateCreated: '2026-09-07',
    author: '林素云 主任医师 / 感染科 & 微生物组MDT组',
    administrationRoute: '结肠镜直达回盲部',
    recommendedDose: '80 g 临床级新鲜复苏菌液 (折合 3.2 × 10¹² CFU/单次深部喷洒)',
    frequency: '单次深部大容量喷洒，术后48小时口服微囊胶囊维持',
    treatmentDuration: '急症快速阻断疗程 (1周内清除假膜)',
    bowelPreparation: '口服轻泻剂低容量清洁洗肠，禁水禁食6小时，避免电解质过度紊乱',
    preTreatment: '停用万古霉素满48小时，术前半小时静注雷尼替丁与解痉药',
    combinedTherapy: '停用全部广谱抗菌药物，静脉滴注人血白蛋白纠正低蛋白血症',
    nutritionalIntervention: '低渣易消化流质饮食，逐步过渡至肠内营养配方，暂禁产气糖类',
    reviewMilestones: [
      '术后 24小时：监测体温及排便性状 (水样泻是否减缓至≤4次)',
      '术后 72小时：复核艰难梭菌毒素A/B核酸快速检测试验',
      '术后 4周：复查便钙卫蛋白及肠黏膜假膜脱落吸收情况',
      '术后 12周：确认达到临床治愈终点且无第4次复发'
    ],
    approvalStatus: '医生已签署'
  },
  safetyRules: [
    { id: 'gate-cd-1', name: '艰难梭菌原发病原毒素A/B核酸阳性核验', category: '感染排查', status: 'passed', detail: 'TcdA/B双毒素确诊，符合第3次复发难治性移植指征', mandatory: true },
    { id: 'gate-cd-2', name: '万古霉素/非达霉素停药洗脱期核实 (≥48h)', category: '宿主禁忌', status: 'passed', detail: '已于2026-09-05停服万古霉素，洗脱时间已满54小时', mandatory: true },
    { id: 'gate-cd-3', name: '中毒性巨结肠与消化道机械穿孔平扫排查', category: '宿主禁忌', status: 'passed', detail: '床旁平扫CT排除结肠扩张与膈下游离气体', mandatory: true },
    { id: 'gate-cd-4', name: '供体 D-0102 超级耐药菌 (CRE/VRE) 阴性验证', category: '供体有效性', status: 'passed', detail: '供体基因组质控无任何抗药性转座子检出', mandatory: true },
    { id: 'gate-cd-5', name: '菌液批次 FMT-2026-0819-B1 复苏活菌质控', category: '菌液质控', status: 'passed', detail: '活菌计数 2.4 × 10¹¹ CFU/g，内毒素去除率>99.8%', mandatory: true },
    { id: 'gate-cd-6', name: '老年患者心肺功能与镇静麻醉评估', category: '宿主禁忌', status: 'passed', detail: '麻醉科会诊ASA分级二级，备好抢救车与心电监护', mandatory: true },
    { id: 'gate-cd-7', name: '感染科、消化科与内镜中心MDT电子会签', category: '知情同意', status: 'passed', detail: '三方副高及以上医师签署特急实施审批', mandatory: true },
    { id: 'gate-cd-8', name: '家属知情同意书及紧急抢救告知书签署', category: '知情同意', status: 'passed', detail: '家属充分了解难治性CDI风险与预后方案', mandatory: true },
    { id: 'gate-cd-9', name: '血清电解质与血气分析纠正达标', category: '宿主禁忌', status: 'passed', detail: '血钾 3.9 mmol/L，酸中毒已通过静脉补液纠正', mandatory: true },
    { id: 'gate-cd-10', name: '超低温生物样本冷链闭环监控', category: '菌液质控', status: 'passed', detail: '液氮转运箱全程监测，解冻温度严格控制在37°C水浴', mandatory: true }
  ],
  longitudinalPoints: [
    {
      stage: 'baseline',
      label: '治疗前基线',
      date: '2026-09-01',
      shannonDiversity: 1.42,
      donorEngraftmentRate: 0,
      fecalCalprotectin: 890,
      mayoScore: 11, // Severe CDI scale
      scfaSynthesisScore: 12,
      dominantBeneficialRatio: 5.2,
      symptomReliefPercentage: 0
    },
    {
      stage: 'day_1',
      label: 'FMT 次日',
      date: '2026-09-08',
      shannonDiversity: 2.30,
      donorEngraftmentRate: 45,
      fecalCalprotectin: 780,
      mayoScore: 7,
      scfaSynthesisScore: 28,
      dominantBeneficialRatio: 22.0,
      symptomReliefPercentage: 35
    },
    {
      stage: 'day_3',
      label: 'FMT 第3天 (水样泻止)',
      date: '2026-09-10',
      shannonDiversity: 3.10,
      donorEngraftmentRate: 68,
      fecalCalprotectin: 520,
      mayoScore: 4,
      scfaSynthesisScore: 49,
      dominantBeneficialRatio: 41.5,
      symptomReliefPercentage: 65
    },
    {
      stage: 'week_1',
      label: '第 1 周 (毒素转阴)',
      date: '2026-09-15',
      shannonDiversity: 3.85,
      donorEngraftmentRate: 79,
      fecalCalprotectin: 280,
      mayoScore: 2,
      scfaSynthesisScore: 68,
      dominantBeneficialRatio: 58.0,
      symptomReliefPercentage: 85
    },
    {
      stage: 'week_4',
      label: '第 4 周 (稳态重构)',
      date: '2026-10-06',
      shannonDiversity: 4.45,
      donorEngraftmentRate: 84,
      fecalCalprotectin: 85,
      mayoScore: 1,
      scfaSynthesisScore: 82,
      dominantBeneficialRatio: 70.2,
      symptomReliefPercentage: 95
    },
    {
      stage: 'week_12',
      label: '第 12 周彻底治愈',
      date: '2026-12-06',
      shannonDiversity: 4.82,
      donorEngraftmentRate: 86,
      fecalCalprotectin: 38,
      mayoScore: 0,
      scfaSynthesisScore: 88,
      dominantBeneficialRatio: 76.5,
      symptomReliefPercentage: 100
    }
  ],
  aiAdvice: '患者为多次复发重症艰难梭菌感染(rCDI)，常规抗生素疗法进入死循环。紧急推荐首选【超级供体 D-0102】内镜直达回盲部喷洒，迅速建立次级胆汁酸定植抗力阻断芽孢萌发，术后配合口服胶囊巩固。'
};

// 3. 王雅婷 (P-2026-0925) - 腹泻型肠易激综合征 (IBS-D, 重度难治性)
const patientIBS: PatientDataPackage = {
  patientId: 'P-2026-0925',
  microbiomeStats: {
    shannonDiversity: 3.28,
    beneficialRatio: 34.0,
    pathogenLoad: 21.6,
    dominantFeature: '青春双歧杆菌严重缺失，脑-肠-菌群轴5-HT神经分泌亢进，低度肠黏膜炎症',
    lesionSegment: 'all',
    targetDiseaseId: 'dis-ibsd',
    clinicalAlert: {
      level: 'normal',
      title: '随访监测期：Bristol大便评分维持4型',
      time: '今日安排',
      desc: '王雅婷完成FMT口服疗程已满8周，排便恢复每日1次成形便，内脏高敏感及焦虑评分改善80%。推荐下发居家FC复查。',
      actionText: '查看随访重构曲线',
      targetTab: 'efficacy_tracker'
    }
  },
  taxa: [
    {
      id: 'tax-ibs-1',
      name: 'Bifidobacterium adolescentis',
      chineseName: '青春双歧杆菌',
      phylum: '放线菌门(Actinobacteria)',
      category: 'beneficial',
      abundance: 0.42,
      normalRange: [3.0, 8.0],
      relativeChange: -91,
      isDonorDerived: true,
      engraftmentStatus: '稳定定植',
      clinicalRelevance: '脑-肠轴调节核心菌，调控色氨酸代谢并合成GABA，其重度匮乏直接导致内脏感觉过敏与焦虑。',
      primaryMetabolites: ['GABA (γ-氨基丁酸)', '乙酸', '乳酸'],
      therapeuticTarget: '特异补充供体优势菌株，重塑神经-微生态屏障'
    },
    {
      id: 'tax-ibs-2',
      name: 'Lactobacillus rhamnosus',
      chineseName: '鼠李糖乳杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.15,
      normalRange: [1.0, 4.0],
      relativeChange: -85,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '刺激迷走神经中枢，减轻肠道痛觉过敏反应并抑制肥大细胞脱颗粒。',
      primaryMetabolites: ['乳酸', '细菌素', '胞外多糖'],
      therapeuticTarget: '下调内脏痛觉超敏阈值'
    },
    {
      id: 'tax-ibs-3',
      name: 'Faecalibacterium prausnitzii',
      chineseName: '普氏栖粪杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 3.2,
      normalRange: [5.0, 12.0],
      relativeChange: -48,
      isDonorDerived: true,
      engraftmentStatus: '稳定定植',
      clinicalRelevance: '轻中度缺失，导致低度抗炎丁酸生成不足，黏膜屏障微通透性增加。',
      primaryMetabolites: ['丁酸'],
      therapeuticTarget: '修复肠上皮轻度渗漏'
    },
    {
      id: 'tax-ibs-4',
      name: 'Ruminococcus gnavus',
      chineseName: '活泼瘤胃球菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'opportunistic',
      abundance: 9.8,
      normalRange: [1.0, 3.5],
      relativeChange: 320,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '异常降解肠壁黏液聚糖产生炎性多糖，刺激局部肥大细胞释放组胺，诱导痉挛性排便。',
      primaryMetabolites: ['炎性多糖', '硫化氢'],
      therapeuticTarget: '通过供体双歧杆菌生态挤压下调丰度'
    },
    {
      id: 'tax-ibs-5',
      name: 'Bacteroides vulgatus',
      chineseName: '普通拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 12.5,
      normalRange: [5.0, 10.0],
      relativeChange: 85,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '丰度异常升高，其降解产物刺激肠嗜铬细胞过度释放5-羟色胺(5-HT)。',
      primaryMetabolites: ['5-HT诱导剂', '琥珀酸'],
      therapeuticTarget: '平衡拟杆菌门菌种分布'
    },
    {
      id: 'tax-ibs-6',
      name: 'Akkermansia muciniphila',
      chineseName: '嗜黏蛋白阿克曼氏菌',
      phylum: '疣微菌门(Verrucomicrobia)',
      category: 'beneficial',
      abundance: 1.8,
      normalRange: [1.5, 4.0],
      relativeChange: -10,
      isDonorDerived: false,
      engraftmentStatus: '稳定定植',
      clinicalRelevance: '基本维持在低限正常水平，有助于阻止黏膜向器质性溃疡演变。',
      primaryMetabolites: ['乙酸', '丙酸'],
      therapeuticTarget: '保护固有物理屏障'
    },
    {
      id: 'tax-ibs-7',
      name: 'Escherichia coli',
      chineseName: '大肠埃希氏菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 4.2,
      normalRange: [0.5, 3.0],
      relativeChange: 40,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '轻度偏高，释放微量游离内毒素诱导低度黏膜免疫活化。',
      primaryMetabolites: ['微量LPS'],
      therapeuticTarget: '常态化菌群竞争控制'
    },
    {
      id: 'tax-ibs-8',
      name: 'Clostridioides difficile',
      chineseName: '艰难梭菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'pathogen',
      abundance: 0.0,
      normalRange: [0.0, 0.05],
      relativeChange: -100,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '完全阴性，无感染性肠炎证据。',
      primaryMetabolites: ['无'],
      therapeuticTarget: '安全基底'
    },
    {
      id: 'tax-ibs-9',
      name: 'Eubacterium rectale',
      chineseName: '直肠真杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 1.4,
      normalRange: [2.0, 5.5],
      relativeChange: -42,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '产丁酸梭菌群核心成员，经丁酰辅酶A途径生成丁酸，是结肠上皮细胞最主要的外源能量来源。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乙酸'],
      therapeuticTarget: '重建产丁酸菌群，修补上皮细胞的能量代谢缺口'
    },
    {
      id: 'tax-ibs-10',
      name: 'Anaerostipes hadrus',
      chineseName: '哈氏厌氧丁酸菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.6,
      normalRange: [1.2, 3.8],
      relativeChange: -48,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '交叉喂养型丁酸菌，自身不产乳酸，依赖双歧杆菌与罗斯氏菌提供的乳酸、乙酸完成丁酸合成。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乳酸转化产物'],
      therapeuticTarget: '打通乳酸—丁酸转化链，防止乳酸在肠腔堆积刺激内脏感觉神经'
    },
    {
      id: 'tax-ibs-11',
      name: 'Ruminococcus bromii',
      chineseName: '布氏瘤胃球菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.9,
      normalRange: [1.5, 4.5],
      relativeChange: -38,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '抗性淀粉降解的"关键菌"，其释放的葡萄糖是多种丁酸菌的公共底物，被称为淀粉降解的启动菌。',
      primaryMetabolites: ['葡萄糖', '乙酸', '乙醇'],
      therapeuticTarget: '恢复抗性淀粉发酵入口，为下游丁酸菌供给底物'
    },
    {
      id: 'tax-ibs-12',
      name: 'Blautia producta',
      chineseName: '产气布劳特氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'commensal',
      abundance: 3.4,
      normalRange: [3.0, 8.5],
      relativeChange: -12,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '常见共生菌，可将乳酸与乙酸转化为丁酸；其丰度下降与肠道炎症活动度升高显著相关。',
      primaryMetabolites: ['丁酸', '乙酸'],
      therapeuticTarget: '监测共生菌群的缓冲能力，作为炎症活动度的参考指标'
    },
    {
      id: 'tax-ibs-13',
      name: 'Parabacteroides distasonis',
      chineseName: '迪氏副拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 2.2,
      normalRange: [2.5, 7.0],
      relativeChange: -18,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '分泌琥珀酸并参与次级胆汁酸代谢，可诱导宿主糖原异生改善代谢，与低炎症表型正相关。',
      primaryMetabolites: ['琥珀酸', '次级胆汁酸'],
      therapeuticTarget: '恢复次级胆汁酸代谢通路，抑制致病芽孢萌发'
    },
    {
      id: 'tax-ibs-14',
      name: 'Bacteroides thetaiotaomicron',
      chineseName: '多形拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 5.6,
      normalRange: [4.0, 11.0],
      relativeChange: 8,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '多糖利用位点最丰富的拟杆菌，降解膳食纤维维持肠腔碳源供给，是菌群互养网络的代谢枢纽。',
      primaryMetabolites: ['丙酸', '乙酸', '多糖降解酶'],
      therapeuticTarget: '维持碳源供给枢纽，防止菌群营养链断裂'
    },
    {
      id: 'tax-ibs-15',
      name: 'Desulfovibrio desulfuricans',
      chineseName: '脱硫脱硫弧菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 1.1,
      normalRange: [0.02, 0.3],
      relativeChange: 285,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '硫酸盐还原菌，利用乳酸与硫酸盐生成硫化氢；H₂S 可直接刺激内脏感觉神经并损伤上皮。',
      primaryMetabolites: ['硫化氢 (H₂S)', '乙酸'],
      therapeuticTarget: '阻断硫化氢生成的上游底物供给，缓解内脏高敏感'
    },
    {
      id: 'tax-ibs-16',
      name: 'Klebsiella pneumoniae',
      chineseName: '肺炎克雷伯菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 2.6,
      normalRange: [0.1, 1.0],
      relativeChange: 96,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '炎症肠段硝酸盐富集使其异常扩增；荚膜与生物膜增强黏附力，部分菌株携带碳青霉烯酶。',
      primaryMetabolites: ['脂多糖 (LPS)', '荚膜多糖'],
      therapeuticTarget: '挤压变形菌门生态位，防范耐药株形成肠道储库'
    }

  ],
  ecologicalLinks: [
    { source: 'tax-ibs-1', target: 'tax-ibs-4', type: 'antagonism', weight: 0.88, description: '双歧杆菌通过抑制活泼瘤胃球菌过度分解黏蛋白，减少内脏刺激源' },
    { source: 'tax-ibs-2', target: 'tax-ibs-5', type: 'antagonism', weight: 0.82, description: '乳杆菌竞争性降低普通拟杆菌异常增殖，减少5-HT异常峰值释放' },
    { source: 'tax-ibs-1', target: 'tax-ibs-3', type: 'synergy', weight: 0.85, description: '双歧杆菌分泌乙酸滋养普氏栖粪杆菌合成丁酸，协同促进肠道抗炎' },
    { source: 'tax-ibs-3', target: 'tax-ibs-6', type: 'synergy', weight: 0.76, description: '丁酸与AKK协同维持肠道上皮致密性，防止食物抗原刺激肥大细胞' },
{ source: 'tax-ibs-1', target: 'tax-ibs-10', type: 'synergy', weight: 0.74, description: '青春双歧杆菌产生的乙酸与乳酸经交叉喂养供哈氏厌氧丁酸菌合成丁酸' },
{ source: 'tax-ibs-9', target: 'tax-ibs-3', type: 'synergy', weight: 0.72, description: '直肠真杆菌与普氏栖粪杆菌共享丁酸合成通路，协同维持肠腔丁酸浓度' },
{ source: 'tax-ibs-11', target: 'tax-ibs-3', type: 'synergy', weight: 0.68, description: '布氏瘤胃球菌降解抗性淀粉释放葡萄糖，为普氏栖粪杆菌提供发酵底物' },
{ source: 'tax-ibs-1', target: 'tax-ibs-9', type: 'synergy', weight: 0.66, description: '青春双歧杆菌与直肠真杆菌构成乙酸—丁酸互养链，共同维持上皮能量供给' },
{ source: 'tax-ibs-9', target: 'tax-ibs-15', type: 'antagonism', weight: 0.80, description: '丁酸降低肠腔乳酸浓度，切断脱硫弧菌进行硫酸盐还原生成硫化氢的底物供给' },
{ source: 'tax-ibs-3', target: 'tax-ibs-15', type: 'antagonism', weight: 0.78, description: '产丁酸菌群压低肠腔 pH 并竞争乳酸底物，抑制硫化氢的生成' },
{ source: 'tax-ibs-2', target: 'tax-ibs-16', type: 'antagonism', weight: 0.72, description: '鼠李糖乳杆菌分泌细菌素抑制克雷伯菌生物膜形成，降低黏膜低度炎症' },
{ source: 'tax-ibs-6', target: 'tax-ibs-16', type: 'antagonism', weight: 0.76, description: 'AKK 强化黏液层并竞争黏附位点，限制克雷伯菌接近肠上皮' },
{ source: 'tax-ibs-12', target: 'tax-ibs-4', type: 'antagonism', weight: 0.64, description: '产气布劳特氏菌竞争碳源并酸化肠腔，抑制活泼瘤胃球菌过度分解黏蛋白' },
{ source: 'tax-ibs-12', target: 'tax-ibs-5', type: 'antagonism', weight: 0.60, description: '产气布劳特氏菌与普通拟杆菌争夺多糖底物，抑制后者的异常增殖' },
{ source: 'tax-ibs-13', target: 'tax-ibs-8', type: 'antagonism', weight: 0.70, description: '迪氏副拟杆菌参与次级胆汁酸代谢，抑制艰难梭菌芽孢萌发' },
{ source: 'tax-ibs-4', target: 'tax-ibs-7', type: 'synergy', weight: 0.62, description: '活泼瘤胃球菌降解黏蛋白释放的糖类被大肠杆菌利用，两者在炎症肠段协同扩增' },
{ source: 'tax-ibs-5', target: 'tax-ibs-13', type: 'commensal', weight: 0.56, description: '拟杆菌属内共享多糖利用位点，普通拟杆菌与迪氏副拟杆菌协同降解纤维' },
{ source: 'tax-ibs-5', target: 'tax-ibs-14', type: 'commensal', weight: 0.58, description: '普通拟杆菌与多形拟杆菌共用荚膜多糖通路，维持拟杆菌门内部稳态' }

  ],
  pathways: [
    {
      id: 'pw-ibs-1',
      name: '脑-肠轴 5-HT (5-羟色胺) 神经分泌过度亢进',
      category: '代谢功能',
      changePercentage: 48,
      status: 'activated',
      mechanism: '异常菌群刺激肠嗜铬细胞大量合成释放游离5-HT，引发小肠与结肠高频蠕动痉挛',
      relevanceScore: 96
    },
    {
      id: 'pw-ibs-2',
      name: '色氨酸-吲哚-3-丙酸 (IPA) 神经保护通路',
      category: '免疫调节',
      changePercentage: -38,
      status: 'suppressed',
      mechanism: '双歧杆菌缺失导致IPA合成下调，迷走神经抗炎抗焦虑传入信号减弱',
      relevanceScore: 90
    },
    {
      id: 'pw-ibs-3',
      name: '肥大细胞脱颗粒与内脏痛觉超敏通路',
      category: '炎症通路',
      changePercentage: 52,
      status: 'activated',
      mechanism: '低度抗原渗透激活黏膜肥大细胞，组胺与类胰蛋白酶释放，导致内脏痛敏阈值大幅下降',
      relevanceScore: 94
    },
    {
      id: 'pw-ibs-4',
      name: '结肠水盐重吸收与渗透压稳态',
      category: '屏障保护',
      changePercentage: -30,
      status: 'suppressed',
      mechanism: '水通道蛋白AQP3/8表达紊乱，水分吸收不完全引致Bristol 6型烂便',
      relevanceScore: 85
    },
    {
      id: 'pw-ibs-5',
      name: '短链脂肪酸 (SCFA) 镇静与受体激动',
      category: '代谢功能',
      changePercentage: -24,
      status: 'suppressed',
      mechanism: '乙酸/丙酸比例轻度失衡，GPR43受体抗炎激动度不足',
      relevanceScore: 78
    },
    {
      id: 'pw-ibs-6',
      name: '黏膜微炎症反应与细胞间隙增宽',
      category: '屏障保护',
      changePercentage: 28,
      status: 'activated',
      mechanism: '轻度闭锁小带蛋白ZO-1表达下调，形成低度通透渗漏',
      relevanceScore: 82
    }
  ],
  matchEvaluation: {
    donorCode: 'D-0205',
    overallScore: 89.4,
    dimensions: {
      microbiomeComplementarity: 0.88,
      functionalGain: 0.91,
      safetyProfile: 0.94,
      colonizationPotential: 0.85,
      historicalEfficacy: 0.87,
      diseaseSuitability: 0.92
    },
    advantages: [
      '供体 D-0205 拥有极其丰富的青春双歧杆菌 (8.1%) 与乳杆菌属，与患者匮乏靶点高度吻合',
      '供体精神心理测评 (PHQ-9/GAD-7) 为满分健康，排除了神经内分泌微生态共病转移风险',
      '供体产短链脂肪酸谱系温和，不会在移植初期引起剧烈腹胀反应',
      '历史对功能性肠病与IBS临床缓解率达85.0%'
    ],
    potentialRisks: [
      '早期定植需配合低 FODMAP 饮食，防止短效益生元发酵产气诱发内脏高敏感痛感'
    ],
    aiRecommendation: '供体 D-0205 与王雅婷高度契合。推荐采用口服肠溶微囊化胶囊门诊方案，配合低FODMAP肠脑轴协同管理。'
  },
  fmtProtocol: {
    protocolVersion: 'v1.3 (IBS肠脑轴微生态调理方案)',
    dateCreated: '2026-08-08',
    author: '赵宏波 副主任医师 / 消化身心微生态组',
    administrationRoute: '肠溶胶囊(微囊化)',
    recommendedDose: '30 g 临床级冷干微囊活菌 (折合 9.0 × 10¹¹ CFU/疗程)',
    frequency: '每周1次，每次口服微囊胶囊10粒，连续3周',
    treatmentDuration: '3 周微生态温和重塑疗程',
    bowelPreparation: '移植前夜口服低容量聚乙二醇散 1000ml 温和清洁肠道',
    preTreatment: '口服前30分钟口服铝碳酸镁片中和胃酸，保护微囊肠溶包衣',
    combinedTherapy: '停用蒙脱石散与抗生素，保留匹维溴铵按需服用，联合脑肠互动调节',
    nutritionalIntervention: '阶段性低FODMAP抗敏饮食 (限制洋葱/大蒜/高乳糖食品) 2周，随后循序渐进补充菊粉',
    reviewMilestones: [
      '移植后 1周：记录每日Bristol大便性状与腹痛腹泻发作频次',
      '移植后 4周：复查IBS-SSS症状严重度评分与便钙卫蛋白',
      '移植后 8周：评估内脏痛觉高敏感缓解率与生活质量量表 (IBS-QoL)',
      '移植后 12周：随访长期排便习惯稳定度与肠脑轴功能恢复'
    ],
    approvalStatus: '医生已签署'
  },
  safetyRules: [
    { id: 'gate-ibs-1', name: '结肠镜器质性病变全面排除 (无溃疡/无息肉/无克罗恩)', category: '感染排查', status: 'passed', detail: '2026-07肠镜黏膜外观正常，活检仅见低度黏膜炎', mandatory: true },
    { id: 'gate-ibs-2', name: '乳糜泻特异性抗体 (tTG-IgA) 阴性确认', category: '宿主禁忌', status: 'passed', detail: '自身免疫性麸质不耐受阴性，排除乳糜泻', mandatory: true },
    { id: 'gate-ibs-3', name: '甲状腺功能与胃肠激素分泌筛查', category: '宿主禁忌', status: 'passed', detail: 'TSH/FT3/FT4均正常，排除甲亢性腹泻', mandatory: true },
    { id: 'gate-ibs-4', name: '供体 D-0205 传染病与代谢指标核验', category: '供体有效性', status: 'passed', detail: '供体在有效期内，全部检测阴性', mandatory: true },
    { id: 'gate-ibs-5', name: '供体心理健康量表 (PHQ-9/GAD-7) 满分合规', category: '供体有效性', status: 'passed', detail: '心理学专家面访合格，无焦虑抑郁病史', mandatory: true },
    { id: 'gate-ibs-6', name: '微囊活菌批次 FMT-2026-0815-C2 耐酸性检验', category: '菌液质控', status: 'passed', detail: 'pH 1.2人工胃液耐受2小时无破损，肠液崩解时间<15分钟', mandatory: true },
    { id: 'gate-ibs-7', name: '患者知情同意与身心医学联合沟通', category: '知情同意', status: 'passed', detail: '详细讲解低FODMAP配合与微生态定植预期', mandatory: true },
    { id: 'gate-ibs-8', name: '无妊娠及备孕状态确认', category: '宿主禁忌', status: 'passed', detail: '尿HCG阴性', mandatory: true }
  ],
  longitudinalPoints: [
    {
      stage: 'baseline',
      label: '治疗前基线',
      date: '2026-08-10',
      shannonDiversity: 3.28,
      donorEngraftmentRate: 0,
      fecalCalprotectin: 120,
      mayoScore: 6, // Refers to IBS-SSS normalized (340分)
      scfaSynthesisScore: 45,
      dominantBeneficialRatio: 34.0,
      symptomReliefPercentage: 0
    },
    {
      stage: 'week_1',
      label: '第 1 周 (Bristol 5型)',
      date: '2026-08-17',
      shannonDiversity: 3.65,
      donorEngraftmentRate: 32,
      fecalCalprotectin: 105,
      mayoScore: 5, // IBS-SSS 280分
      scfaSynthesisScore: 56,
      dominantBeneficialRatio: 45.0,
      symptomReliefPercentage: 25
    },
    {
      stage: 'week_2',
      label: '第 2 周 (腹痛减半)',
      date: '2026-08-24',
      shannonDiversity: 4.02,
      donorEngraftmentRate: 54,
      fecalCalprotectin: 82,
      mayoScore: 4, // IBS-SSS 210分
      scfaSynthesisScore: 68,
      dominantBeneficialRatio: 56.5,
      symptomReliefPercentage: 50
    },
    {
      stage: 'week_4',
      label: '第 4 周 (成形软便)',
      date: '2026-09-07',
      shannonDiversity: 4.38,
      donorEngraftmentRate: 71,
      fecalCalprotectin: 52,
      mayoScore: 2, // IBS-SSS 140分
      scfaSynthesisScore: 79,
      dominantBeneficialRatio: 68.0,
      symptomReliefPercentage: 75
    },
    {
      stage: 'week_8',
      label: '第 8 周 (痛敏下降80%)',
      date: '2026-10-07',
      shannonDiversity: 4.65,
      donorEngraftmentRate: 78,
      fecalCalprotectin: 36,
      mayoScore: 1, // IBS-SSS 85分
      scfaSynthesisScore: 86,
      dominantBeneficialRatio: 74.5,
      symptomReliefPercentage: 88
    },
    {
      stage: 'week_12',
      label: '第 12 周完全缓解',
      date: '2026-11-07',
      shannonDiversity: 4.78,
      donorEngraftmentRate: 82,
      fecalCalprotectin: 28,
      mayoScore: 0, // IBS-SSS 45分
      scfaSynthesisScore: 90,
      dominantBeneficialRatio: 78.0,
      symptomReliefPercentage: 95
    }
  ],
  aiAdvice: '针对王雅婷的肠脑轴难治性IBS-D，其微生态主要特征为青春双歧杆菌严重缺失合并5-HT神经分泌亢进。推荐采用供体 D-0205 微囊化无痛口服方案，并联合前两周低FODMAP饮食，迅速提升内脏痛阈值并平抑大便频次。'
};

// 4. 陈思远 (P-2026-0612) - 克罗恩病 (Crohn's Disease, CD 结肠回肠受累型, 活动期)
const patientCD: PatientDataPackage = {
  patientId: 'P-2026-0612',
  microbiomeStats: {
    shannonDiversity: 1.95,
    beneficialRatio: 14.2,
    pathogenLoad: 46.5,
    dominantFeature: '黏附侵袭性大肠杆菌 (AIEC) 异常定植，自噬通路受阻，回盲瓣节段鹅卵石样溃疡',
    lesionSegment: 'ascending',
    targetDiseaseId: 'dis-uc', // IBD node
    clinicalAlert: {
      level: 'warning',
      title: 'MDT会诊意见：推荐FMT联合抗TNF诱导缓解',
      time: '2小时前',
      desc: '陈思远 SES-CD 内镜评分 9分，结肠回肠节段性溃疡。宏基因组提示高丰度AIEC，建议供体D-0102深部置管冲洗定植。',
      actionText: '查看临床诊断画像',
      targetTab: 'patient_center'
    }
  },
  taxa: [
    {
      id: 'tax-cd-aiec',
      name: 'Adherent-Invasive E. coli (AIEC)',
      chineseName: '黏附侵袭性大肠埃希氏菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'pathogen',
      abundance: 16.2,
      normalRange: [0.1, 1.5],
      relativeChange: 980,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '克罗恩病特征性致病菌，穿透黏液层黏附于回肠上皮微褶皱(M细胞)，并在巨噬细胞内持续存活繁殖。',
      primaryMetabolites: ['侵袭素IbeA', '菌毛黏附素FimH'],
      therapeuticTarget: 'FMT供体群落定植竞争阻断FimH介导黏附'
    },
    {
      id: 'tax-cd-torq',
      name: 'Ruminococcus torques',
      chineseName: '扭曲瘤胃球菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'opportunistic',
      abundance: 8.4,
      normalRange: [0.5, 2.2],
      relativeChange: 280,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '过度降解回盲部黏膜外层硫酸盐化黏蛋白，破坏回肠物理屏障。',
      primaryMetabolites: ['粘蛋白水解酶', '溶血磷脂'],
      therapeuticTarget: '抑制黏膜降解，恢复屏障厚度'
    },
    {
      id: 'tax-cd-faec',
      name: 'Faecalibacterium prausnitzii',
      chineseName: '普氏栖粪杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.45,
      normalRange: [5.0, 12.0],
      relativeChange: -94,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '克罗恩活动期显著断崖式下跌，其MAM抗炎蛋白极度缺失。',
      primaryMetabolites: ['丁酸', '抗炎多肽MAM'],
      therapeuticTarget: '供体首要定植靶标'
    },
    {
      id: 'tax-cd-akk',
      name: 'Akkermansia muciniphila',
      chineseName: '嗜黏蛋白阿克曼氏菌',
      phylum: '疣微菌门(Verrucomicrobia)',
      category: 'beneficial',
      abundance: 0.35,
      normalRange: [1.5, 4.0],
      relativeChange: -88,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '回肠固有层紧密连接 Claudin-2/Occludin 重构所需关键菌。',
      primaryMetabolites: ['乙酸', '丙酸'],
      therapeuticTarget: '促进回肠节段溃疡愈合'
    },
    {
      id: 'tax-cd-rose',
      name: 'Roseburia hominis',
      chineseName: '人罗斯氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.5,
      normalRange: [2.0, 5.0],
      relativeChange: -83,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '产短链脂肪酸改善CD肠壁纤维化趋势。',
      primaryMetabolites: ['丁酸'],
      therapeuticTarget: '抗纤维化与促进黏膜修复'
    },
    {
      id: 'tax-cd-bif',
      name: 'Bifidobacterium infantis',
      chineseName: '婴儿双歧杆菌',
      phylum: '放线菌门(Actinobacteria)',
      category: 'beneficial',
      abundance: 1.8,
      normalRange: [3.0, 8.0],
      relativeChange: -64,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '调节肠黏膜树突状细胞耐受，抑制IL-12/23轴过度激活。',
      primaryMetabolites: ['乙酸', '乳酸'],
      therapeuticTarget: '纠正Th1/Th17免疫失衡'
    },
    {
      id: 'tax-cd-bac',
      name: 'Bacteroides dorei',
      chineseName: '多氏拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 8.5,
      normalRange: [4.0, 9.0],
      relativeChange: 25,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '共生拟杆菌，合成免疫修饰鞘脂。',
      primaryMetabolites: ['鞘脂', '丙酸'],
      therapeuticTarget: '维持基础代谢'
    },
    {
      id: 'tax-cd-diff',
      name: 'Clostridioides difficile',
      chineseName: '艰难梭菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'pathogen',
      abundance: 0.01,
      normalRange: [0.0, 0.05],
      relativeChange: 0,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '阴性基线，安全排查合格。',
      primaryMetabolites: ['无'],
      therapeuticTarget: '常规排查'
    },
    {
      id: 'tax-cd-eub',
      name: 'Eubacterium rectale',
      chineseName: '直肠真杆菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.28,
      normalRange: [2.0, 5.5],
      relativeChange: -86,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '产丁酸梭菌群核心成员，经丁酰辅酶A途径生成丁酸，是结肠上皮细胞最主要的外源能量来源。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乙酸'],
      therapeuticTarget: '重建产丁酸菌群，修补上皮细胞的能量代谢缺口'
    },
    {
      id: 'tax-cd-ana',
      name: 'Anaerostipes hadrus',
      chineseName: '哈氏厌氧丁酸菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'beneficial',
      abundance: 0.18,
      normalRange: [1.2, 3.8],
      relativeChange: -83,
      isDonorDerived: true,
      engraftmentStatus: '未定植',
      clinicalRelevance: '交叉喂养型丁酸菌，自身不产乳酸，依赖双歧杆菌与罗斯氏菌提供的乳酸、乙酸完成丁酸合成。',
      primaryMetabolites: ['丁酸 (Butyrate)', '乳酸转化产物'],
      therapeuticTarget: '打通乳酸—丁酸转化链，防止乳酸在肠腔堆积刺激内脏感觉神经'
    },
    {
      id: 'tax-cd-bbif',
      name: 'Bifidobacterium bifidum',
      chineseName: '双叉双歧杆菌',
      phylum: '放线菌门(Actinobacteria)',
      category: 'beneficial',
      abundance: 0.7,
      normalRange: [2.0, 6.0],
      relativeChange: -64,
      isDonorDerived: true,
      engraftmentStatus: '部分定植',
      clinicalRelevance: '表达黏蛋白降解酶与菌毛样黏附蛋白，可早期定植并稳定黏膜免疫耐受，是放线菌门的定植先导菌。',
      primaryMetabolites: ['乙酸', '叶酸', '胞外多糖'],
      therapeuticTarget: '恢复放线菌门丰度，重建黏膜免疫耐受'
    },
    {
      id: 'tax-cd-bla',
      name: 'Blautia producta',
      chineseName: '产气布劳特氏菌',
      phylum: '厚壁菌门(Firmicutes)',
      category: 'commensal',
      abundance: 1.5,
      normalRange: [3.0, 8.5],
      relativeChange: -62,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '常见共生菌，可将乳酸与乙酸转化为丁酸；其丰度下降与肠道炎症活动度升高显著相关。',
      primaryMetabolites: ['丁酸', '乙酸'],
      therapeuticTarget: '监测共生菌群的缓冲能力，作为炎症活动度的参考指标'
    },
    {
      id: 'tax-cd-par',
      name: 'Parabacteroides distasonis',
      chineseName: '迪氏副拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 2.1,
      normalRange: [2.5, 7.0],
      relativeChange: -55,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '分泌琥珀酸并参与次级胆汁酸代谢，可诱导宿主糖原异生改善代谢，与低炎症表型正相关。',
      primaryMetabolites: ['琥珀酸', '次级胆汁酸'],
      therapeuticTarget: '恢复次级胆汁酸代谢通路，抑制致病芽孢萌发'
    },
    {
      id: 'tax-cd-the',
      name: 'Bacteroides thetaiotaomicron',
      chineseName: '多形拟杆菌',
      phylum: '拟杆菌门(Bacteroidetes)',
      category: 'commensal',
      abundance: 3.2,
      normalRange: [4.0, 11.0],
      relativeChange: -48,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '多糖利用位点最丰富的拟杆菌，降解膳食纤维维持肠腔碳源供给，是菌群互养网络的代谢枢纽。',
      primaryMetabolites: ['丙酸', '乙酸', '多糖降解酶'],
      therapeuticTarget: '维持碳源供给枢纽，防止菌群营养链断裂'
    },
    {
      id: 'tax-cd-kleb',
      name: 'Klebsiella pneumoniae',
      chineseName: '肺炎克雷伯菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 3.6,
      normalRange: [0.1, 1.0],
      relativeChange: 158,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '炎症肠段硝酸盐富集使其异常扩增；荚膜与生物膜增强黏附力，部分菌株携带碳青霉烯酶。',
      primaryMetabolites: ['脂多糖 (LPS)', '荚膜多糖'],
      therapeuticTarget: '挤压变形菌门生态位，防范耐药株形成肠道储库'
    },
    {
      id: 'tax-cd-prot',
      name: 'Proteus mirabilis',
      chineseName: '奇异变形杆菌',
      phylum: '变形菌门(Proteobacteria)',
      category: 'opportunistic',
      abundance: 1.8,
      normalRange: [0.05, 0.8],
      relativeChange: 132,
      isDonorDerived: false,
      engraftmentStatus: '不适用',
      clinicalRelevance: '具脲酶活性的兼性厌氧菌，产氨抬高肠腔 pH 并削弱屏障，是黏膜破损时的易位风险源。',
      primaryMetabolites: ['尿素酶', '氨', '脂多糖 (LPS)'],
      therapeuticTarget: '抑制脲酶活性，阻断氨致黏膜碱化损伤'
    }

  ],
  ecologicalLinks: [
    { source: 'tax-cd-aiec', target: 'tax-cd-torq', type: 'synergy', weight: 0.86, description: '扭曲瘤胃球菌降解保护性黏蛋白，加速AIEC侵袭上皮细胞' },
    { source: 'tax-cd-faec', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.94, description: '普氏栖粪杆菌产生丁酸上调抗菌肽Reg3γ，强力抑制AIEC增殖' },
    { source: 'tax-cd-akk', target: 'tax-cd-torq', type: 'antagonism', weight: 0.82, description: 'AKK刺激杯状细胞分泌新生的致密黏蛋白，阻断病理降解' },
    { source: 'tax-cd-bif', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.88, description: '双歧杆菌素阻断AIEC在回肠末端集合淋巴结处的定植' },
{ source: 'tax-cd-eub', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.90, description: '直肠真杆菌产丁酸上调抗菌肽 Reg3γ 表达，抑制 AIEC 在回肠末端增殖' },
{ source: 'tax-cd-ana', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.82, description: '哈氏厌氧丁酸菌经交叉喂养产丁酸，降低上皮通透性以减少 AIEC 侵袭机会' },
{ source: 'tax-cd-bbif', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.86, description: '双叉双歧杆菌素阻断 AIEC 在派尔集合淋巴结处的黏附与转位' },
{ source: 'tax-cd-faec', target: 'tax-cd-eub', type: 'synergy', weight: 0.72, description: '普氏栖粪杆菌与直肠真杆菌共享丁酸合成通路，协同恢复肠腔丁酸浓度' },
{ source: 'tax-cd-akk', target: 'tax-cd-ana', type: 'synergy', weight: 0.66, description: 'AKK 降解释放的乙酸与单糖为哈氏厌氧丁酸菌补充交叉喂养底物' },
{ source: 'tax-cd-bla', target: 'tax-cd-torq', type: 'antagonism', weight: 0.68, description: '产气布劳特氏菌竞争碳源并酸化肠腔，抑制扭曲瘤胃球菌过度降解黏蛋白' },
{ source: 'tax-cd-par', target: 'tax-cd-torq', type: 'antagonism', weight: 0.64, description: '迪氏副拟杆菌分泌琥珀酸竞争底物，削弱瘤胃球菌对保护性黏蛋白的分解' },
{ source: 'tax-cd-the', target: 'tax-cd-aiec', type: 'antagonism', weight: 0.70, description: '多形拟杆菌占据多糖利用位点，压缩 AIEC 在黏液层的营养可得性' },
{ source: 'tax-cd-eub', target: 'tax-cd-kleb', type: 'antagonism', weight: 0.68, description: '丁酸激活上皮氧化磷酸化，剥夺克雷伯菌硝酸盐呼吸所需的电子受体' },
{ source: 'tax-cd-kleb', target: 'tax-cd-aiec', type: 'synergy', weight: 0.74, description: '克雷伯菌与 AIEC 协同进行硝酸盐呼吸，在炎症肠段共同扩增变形菌门占比' },
{ source: 'tax-cd-prot', target: 'tax-cd-torq', type: 'synergy', weight: 0.60, description: '奇异变形杆菌脲酶产氨抬高 pH，为瘤胃球菌提供更适宜的黏蛋白降解微环境' },
{ source: 'tax-cd-bla', target: 'tax-cd-diff', type: 'antagonism', weight: 0.72, description: '产气布劳特氏菌维持低 pH 并竞争碳源，抑制艰难梭菌芽孢萌发' },
{ source: 'tax-cd-par', target: 'tax-cd-diff', type: 'antagonism', weight: 0.76, description: '迪氏副拟杆菌参与次级胆汁酸代谢，直接抑制艰难梭菌营养体生长' },
{ source: 'tax-cd-the', target: 'tax-cd-bac', type: 'commensal', weight: 0.54, description: '多形拟杆菌与多氏拟杆菌共用多糖利用位点，维持拟杆菌门的碳源互养网络' }

  ],
  pathways: [
    {
      id: 'pw-cd-cd1',
      name: '黏膜溃疡修复与紧密连接 Claudin-2 通路',
      category: '屏障保护',
      changePercentage: -58,
      status: 'suppressed',
      mechanism: '回盲部透壁性炎性渗出，孔道成孔蛋白异常升高致水样腹泻，上皮愈合受抑',
      relevanceScore: 97
    },
    {
      id: 'pw-cd-cd2',
      name: '自噬机制 (Autophagy / ATG16L1 途径)',
      category: '免疫调节',
      changePercentage: -45,
      status: 'suppressed',
      mechanism: '巨噬细胞内清除胞内菌能力缺陷，导致AIEC在黏膜下持续隐匿生存',
      relevanceScore: 94
    },
    {
      id: 'pw-cd-cd3',
      name: '丁酸生成与结肠上皮营养再生',
      category: '代谢功能',
      changePercentage: -62,
      status: 'suppressed',
      mechanism: '普氏菌重度缺失，结肠与回肠末端上皮长期处于供能饥饿状态',
      relevanceScore: 91
    },
    {
      id: 'pw-cd-cd4',
      name: '自身免疫性 Th1/Th17 促炎细胞因子风暴',
      category: '炎症通路',
      changePercentage: 72,
      status: 'activated',
      mechanism: 'IL-12、IL-23及IFN-γ高表达，引起节段性全层肠壁炎症渗出',
      relevanceScore: 95
    },
    {
      id: 'pw-cd-cd5',
      name: '短链脂肪酸抗纤维化通路',
      category: '代谢功能',
      changePercentage: -40,
      status: 'suppressed',
      mechanism: '成纤维细胞缺乏丁酸抑制，局部胶原过度沉积',
      relevanceScore: 84
    },
    {
      id: 'pw-cd-cd6',
      name: 'LPS / 细菌抗原易位内毒素血症',
      category: '炎症通路',
      changePercentage: 59,
      status: 'activated',
      mechanism: '溃疡面通透性剧增，细菌抗原大量涌入肠系膜淋巴结',
      relevanceScore: 88
    }
  ],
  matchEvaluation: {
    donorCode: 'D-0102',
    overallScore: 90.2,
    dimensions: {
      microbiomeComplementarity: 0.93,
      functionalGain: 0.90,
      safetyProfile: 0.95,
      colonizationPotential: 0.84,
      historicalEfficacy: 0.85,
      diseaseSuitability: 0.91
    },
    advantages: [
      '供体 D-0102 富含高丰度普氏栖粪杆菌与AKK菌，特异性抑制克罗恩病AIEC黏附侵袭',
      '供体抗炎丁酸生成潜能极强，能迅速诱导肠黏膜Treg细胞增殖并阻断Th17炎性风暴',
      '供体无高危致病菌及耐药质粒，适合处于中度活动期CD患者'
    ],
    potentialRisks: [
      '克罗恩病具有节段性溃疡特征，内镜给药需轻柔进镜，避免诱发回盲部狭窄面损伤'
    ],
    aiRecommendation: '供体 D-0102 适配度极佳。推荐经结肠镜直达回肠末端靶向喷洒，随后配合微囊化口服维持疗程。'
  },
  fmtProtocol: {
    protocolVersion: 'v1.0 (克罗恩病MDT诱导缓解方案)',
    dateCreated: '2026-08-28',
    author: '陈建国 主任医师 / 消化内科',
    administrationRoute: '结肠镜直达回盲部',
    recommendedDose: '60 g 临床级新鲜冷冻菌液 (折合 2.0 × 10¹² CFU)',
    frequency: '内镜下靶向喷洒1次，随后隔周口服微囊胶囊巩固4周',
    treatmentDuration: '6 周诱导黏膜愈合疗程',
    bowelPreparation: '聚乙二醇散剂分次低容量准备，温和清洁回盲部',
    preTreatment: '术前半小时静注雷贝拉唑，监测回肠末端溃疡形态',
    combinedTherapy: '联合抗TNF单克隆抗体维持期协同治疗，停用广谱抗菌药物',
    nutritionalIntervention: '全肠内全营养配方 (EEN) 联合治疗2周，减少抗原负荷',
    reviewMilestones: [
      '术后 48小时：排查发热与腹痛情况',
      '术后 4周：复查便钙卫蛋白及CRP炎性指标',
      '术后 12周：小肠CTE/磁共振复查肠壁透壁浸润深度',
      '术后 24周：结肠镜复查SES-CD黏膜内镜愈合率'
    ],
    approvalStatus: '待MDT二次复核'
  },
  safetyRules: [
    { id: 'gate-cd-cd1', name: '肠管器质性重度狭窄与腹腔脓肿排查', category: '宿主禁忌', status: 'passed', detail: '小肠CTE排除纤维性狭窄梗阻与腹腔脓肿包块', mandatory: true },
    { id: 'gate-cd-cd2', name: '结核感染 (T-SPOT / PPD) 与巨细胞病毒(CMV)排查', category: '感染排查', status: 'passed', detail: 'T-SPOT阴性，肠黏膜CMV免疫组化阴性', mandatory: true },
    { id: 'gate-cd-cd3', name: '供体 D-0102 全套高危病原复核', category: '供体有效性', status: 'passed', detail: '质控检验报告在有效期内，全部合规通过', mandatory: true },
    { id: 'gate-cd-cd4', name: '菌液冷链质量与活菌活性达标', category: '菌液质控', status: 'passed', detail: '批次 FMT-2026-0828-B3 活菌率88.5%', mandatory: true },
    { id: 'gate-cd-cd5', name: 'MDT多学科临床决策会签', category: '知情同意', status: 'passed', detail: '消化科陈建国主任已初审签署', mandatory: true }
  ],
  longitudinalPoints: [
    {
      stage: 'baseline',
      label: '治疗前基线',
      date: '2026-08-15',
      shannonDiversity: 1.95,
      donorEngraftmentRate: 0,
      fecalCalprotectin: 710,
      mayoScore: 9, // SES-CD 9分
      scfaSynthesisScore: 22,
      dominantBeneficialRatio: 14.2,
      symptomReliefPercentage: 0
    },
    {
      stage: 'fmt_1',
      label: 'FMT 靶向喷洒后',
      date: '2026-08-30',
      shannonDiversity: 2.65,
      donorEngraftmentRate: 40,
      fecalCalprotectin: 640,
      mayoScore: 8,
      scfaSynthesisScore: 36,
      dominantBeneficialRatio: 28.0,
      symptomReliefPercentage: 20
    },
    {
      stage: 'week_2',
      label: '第 2 周口服巩固',
      date: '2026-09-14',
      shannonDiversity: 3.30,
      donorEngraftmentRate: 59,
      fecalCalprotectin: 460,
      mayoScore: 6,
      scfaSynthesisScore: 54,
      dominantBeneficialRatio: 44.5,
      symptomReliefPercentage: 45
    },
    {
      stage: 'week_6',
      label: '第 6 周疗程结束',
      date: '2026-10-12',
      shannonDiversity: 4.05,
      donorEngraftmentRate: 72,
      fecalCalprotectin: 195,
      mayoScore: 3,
      scfaSynthesisScore: 74,
      dominantBeneficialRatio: 63.0,
      symptomReliefPercentage: 78
    },
    {
      stage: 'week_12',
      label: '第 12 周深度缓解',
      date: '2026-11-25',
      shannonDiversity: 4.32,
      donorEngraftmentRate: 80,
      fecalCalprotectin: 88,
      mayoScore: 2,
      scfaSynthesisScore: 82,
      dominantBeneficialRatio: 71.5,
      symptomReliefPercentage: 90
    },
    {
      stage: 'week_24',
      label: '第 24 周黏膜愈合',
      date: '2027-02-20',
      shannonDiversity: 4.48,
      donorEngraftmentRate: 83,
      fecalCalprotectin: 55,
      mayoScore: 1, // SES-CD 1分
      scfaSynthesisScore: 86,
      dominantBeneficialRatio: 75.0,
      symptomReliefPercentage: 96
    }
  ],
  aiAdvice: '患者陈思远为克罗恩病(CD)活动期，关键发病驱动为AIEC黏附侵袭与产丁酸菌严重匮乏。推荐采用供体 D-0102 深部结肠镜靶向回盲部冲洗喷洒，配合全肠内营养(EEN)诱导期黏膜愈合。'
};

export const allPatientPackages: Record<string, PatientDataPackage> = {
  'P-2026-0841': patientUC,
  'P-2026-0719': patientCDI,
  'P-2026-0925': patientIBS,
  'P-2026-0612': patientCD,
};

// Fallback patient package getter
export function getPatientDataPackage(patientId: string): PatientDataPackage {
  if (allPatientPackages[patientId]) {
    return allPatientPackages[patientId];
  }
  return patientUC;
}

export function getPatientTaxa(patientId: string): MicrobialTaxon[] {
  return getPatientDataPackage(patientId).taxa;
}

export function getPatientEcologicalLinks(patientId: string): EcologicalLink[] {
  return getPatientDataPackage(patientId).ecologicalLinks;
}

export function getPatientPathways(patientId: string): FunctionalPathway[] {
  return getPatientDataPackage(patientId).pathways;
}

export function getPatientMatchEvaluation(patientId: string): MatchEvaluation {
  return getPatientDataPackage(patientId).matchEvaluation;
}

export function getPatientFMTProtocol(patientId: string): FMTTreatmentProtocol {
  return getPatientDataPackage(patientId).fmtProtocol;
}

export function getPatientSafetyRules(patientId: string): SafetyRuleGate[] {
  return getPatientDataPackage(patientId).safetyRules;
}

export function getPatientLongitudinalPoints(patientId: string): LongitudinalTrackPoint[] {
  return getPatientDataPackage(patientId).longitudinalPoints;
}

export function getPatientMicrobiomeStats(patientId: string) {
  return getPatientDataPackage(patientId).microbiomeStats;
}
