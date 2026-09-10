// MicroFMT Platform Types & Interfaces

export type ModuleTab = 
  | 'workbench'          // 工作台 (3D微生态孪生驾驶舱)
  | 'patient_center'      // 患者精准诊疗中心 (菌群画像与生态网络)
  | 'donor_matching'      // 供受体智能匹配与精准方案
  | 'efficacy_tracker'    // 疗效与菌群重构监测
  | 'knowledge_graph';    // 菌群生态与疾病知识图谱

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
  type: 'disease' | 'microbe' | 'metabolite' | 'immune' | 'therapy';
  categoryLabel: string;
  description: string;
  val: number; // size
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
