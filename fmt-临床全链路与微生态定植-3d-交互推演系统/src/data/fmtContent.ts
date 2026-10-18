/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * FMT 临床全链路与微生态定植 3D 推演系统 —— 锁定内容与循证医学数据模型
 * 严格遵循阶段 0 (CONTENT.md) 与阶段 1 (VISUAL_SPEC.md) 规范：
 * - 受众：A 医生（临床决策支持：证据等级、适应证边界、失败模式）
 * - 严禁「输入 → 确定输出」，所有读数均为「倾向 + 区间」
 * - 全部数值标注「演示数据 · 非诊疗用途」
 */

export type EvidenceGrade = '高' | '中' | '低' | '专家共识' | '机制推测';

export type StageEvidenceBadge = '证据充分' | '证据有限' | '机制推测';

export type SemanticState = 'homeostasis' | 'dysbiosis' | 'uncertain';

export type ScenarioId = 'high_diversity' | 'standard' | 'antibiotic_exposure';

export type DeliveryRoute = 'colonoscopy' | 'capsule';

export type MicroStepId = 'adhesion' | 'colonization' | 'metabolism' | 'immune';

export type FollowUpWeek = 1 | 4 | 12;

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  viewType: '剖面视角' | '外部+半剖视角' | '微观组织学剖面视角';
  scaleMode: 'macro_prep' | 'macro_colon' | 'micro_mucosa' | 'hybrid_eval';
}

export interface BuoyAnnotation {
  id: string;
  worldPos: [number, number, number];
  title: string;
  subtitle: string;
  evidenceGrade: EvidenceGrade;
  semanticState: SemanticState;
  mechanismDetail: string;
  canDrillMicro?: boolean;
  targetMicroStep?: MicroStepId;
}

export interface CausalRow {
  stageOrScenario: string;
  inputVariable: string;
  mechanism: string;
  observedTendencyAndInterval: string;
  evidenceGrade: EvidenceGrade;
  evidenceNote: string;
  uncertaintySource: string;
}

export interface MicroStepSpec {
  id: MicroStepId;
  indexLabel: string;
  verbPhrase: string;
  title: string;
  evidenceBadge: StageEvidenceBadge;
  evidenceGrade: EvidenceGrade;
  semanticState: SemanticState;
  camera: CameraPreset;
  summary: string;
  mechanismPoints: string[];
  failureModeNote: string;
  buoys: BuoyAnnotation[];
}

export interface StageSpec {
  id: number;
  groupId: 'phase1' | 'phase2' | 'phase3';
  groupTitle: string;
  verbPhrase: string;
  fullTitle: string;
  evidenceBadge: StageEvidenceBadge;
  primaryEvidenceGrade: EvidenceGrade;
  semanticState: SemanticState;
  camera: CameraPreset;
  summary: string;
  mechanismPoints: string[];
  clinicalBoundaryNote: string;
  controlType:
    | 'donor_profile_select'
    | 'anaerobic_prep_slider'
    | 'delivery_route_toggle'
    | 'scenario_branch_select'
    | 'followup_window_select';
  controlLabel: string;
  controlHint: string;
  buoys: BuoyAnnotation[];
}

export interface MetricIntervalReading {
  id: 'diversity' | 'inflammation' | 'remission';
  label: string;
  unitOrScale: string;
  tendencyText: string;
  /** 归一化区间 [min, max] 0-100，严禁单点确定值 */
  interval: [number, number];
  /** 临床文献参考注释 */
  clinicalReferenceText: string;
  semanticState: SemanticState;
}

export interface ScenarioSpec {
  id: ScenarioId;
  name: string;
  shortLabel: string;
  semanticState: SemanticState;
  evidenceGrade: EvidenceGrade;
  description: string;
  clinicalMechanism: string;
  rcdiIntervalText: string;
  ibdIntervalText: string;
}

export const SEMANTIC_PALETTE: Record<
  SemanticState,
  {
    name: string;
    symbol: string;
    primaryHex: string;
    bgHex: string;
    borderHex: string;
    dashed: boolean;
  }
> = {
  homeostasis: {
    name: '稳态 / 健康',
    symbol: '●',
    primaryHex: '#2B9EB3',
    bgHex: '#132E38',
    borderHex: '#2B9EB3',
    dashed: false,
  },
  dysbiosis: {
    name: '失衡 / 风险',
    symbol: '▲',
    primaryHex: '#E06D3B',
    bgHex: '#361E15',
    borderHex: '#E06D3B',
    dashed: false,
  },
  uncertain: {
    name: '未知 / 证据不足',
    symbol: '◆',
    primaryHex: '#9488B0',
    bgHex: '#23202E',
    borderHex: '#9488B0',
    dashed: true,
  },
};

export const SCENARIOS: Record<ScenarioId, ScenarioSpec> = {
  high_diversity: {
    id: 'high_diversity',
    name: '高多样性供体（受体已完成标准抗生素洗脱）',
    shortLabel: '高多样性供体',
    semanticState: 'homeostasis',
    evidenceGrade: '中',
    description:
      '供体物种丰富度与核心产丁酸菌（Faecalibacterium prausnitzii、Roseburia）处于健康人群高分位，且受体移植前完成 ≥24–48h 抗生素洗脱。',
    clinicalMechanism:
      '提供高功能冗余度（Functional Redundancy）代谢网络，多菌属协同占据外黏液层与隐窝口生态位，快速恢复次级胆汁酸（DCA/LCA）与丁酸盐梯度。',
    rcdiIntervalText: 'rCDI 缓解参考区间：约 80%–92%（高证据基线叠加供体优选倾向）',
    ibdIntervalText: 'UC 短期无激素缓解参考区间：约 30%–45%（Kump et al., Gut 2018，中证据）',
  },
  standard: {
    id: 'standard',
    name: '常规合格供体（标准筛查合格 + 标准洗脱准备）',
    shortLabel: '常规供体',
    semanticState: 'homeostasis',
    evidenceGrade: '高',
    description:
      '供体通过严格传染病与耐药基因筛查，α-多样性处于健康人群中位区间，受体完成标准肠道准备。',
    clinicalMechanism:
      '补充核心缺失专性厌氧共生菌并重建 7α-脱羟基酶胆汁酸转化通路；功能冗余度中等，慢性炎症适应证中单次移植后 4–8 周可能出现部分菌株丰度衰减。',
    rcdiIntervalText: 'rCDI 单次缓解参考区间：约 75%–88%（IDSA/SHEA 2021 指南，高证据）',
    ibdIntervalText: 'UC 短期无激素缓解参考区间：约 24%–36%（Cochrane 2023，常需序贯强化）',
  },
  antibiotic_exposure: {
    id: 'antibiotic_exposure',
    name: '受体近期抗生素暴露（洗脱不足或围移植期 <7d 广谱抗生素）',
    shortLabel: '受体近期抗生素暴露',
    semanticState: 'dysbiosis',
    evidenceGrade: '高',
    description:
      '受体在移植前未完成充分洗脱，或移植后早期（<7 天）因合并感染暴露于广谱抗菌药物（如万古霉素残留、碳青霉烯类或氟喹诺酮类）。',
    clinicalMechanism:
      '肠腔与黏液层内高浓度残留抗菌药物对刚递送的供体厌氧共生菌实施「无差别清除」，导致定植率断崖式坍塌；生态位真空诱发耐药肠杆菌科或真菌扩增，黏液屏障修复中断。',
    rcdiIntervalText: 'rCDI 早期失败/复发风险陡增，单次缓解倾向降至 <50%（Ianiro et al., CGH 2018，高证据）',
    ibdIntervalText: '慢性肠炎定植极易失败，甚至诱发菌群失衡加重（高风险警示）',
  },
};

export const MICRO_STEPS: Record<MicroStepId, MicroStepSpec> = {
  adhesion: {
    id: 'adhesion',
    indexLabel: '4.1',
    verbPhrase: '黏附',
    title: '4.1 黏附：外黏液层 MUC2 糖链物理锚定',
    evidenceBadge: '机制推测',
    evidenceGrade: '机制推测',
    semanticState: 'uncertain',
    camera: {
      position: [0.85, 0.65, 2.25],
      target: [0.0, 0.22, 0.0],
      fov: 31,
      viewType: '微观组织学剖面视角',
      scaleMode: 'micro_mucosa',
    },
    summary:
      '供体共生菌通过菌毛、表面黏附蛋白（如 MucBP 结构域）识别宿主杯状细胞分泌的 MUC2 黏蛋白 O-聚糖链，抵抗肠腔蠕动剪切力完成初始锚定。',
    mechanismPoints: [
      '外松散黏液层（Outer Loose Mucus Layer）为共生菌提供三维糖蛋白支架与初始营养源。',
      '内致密黏液层（Inner Dense Mucus Layer）保持无菌物理隔离，防止细菌直接触碰柱状上皮顶膜引发 TLR 过度激活。',
      '循证边界：人体原位实时连续观测受限，该步骤动力学主要基于无菌小鼠与人源肠类器官（Organoids）模型（证据等级：机制推测）。',
    ],
    failureModeNote:
      '失败模式：重度黏膜溃疡或近期抗生素暴露患者杯状细胞耗竭、外黏液层剥脱，供体菌失去锚定基质随粪流快速冲刷流失。',
    buoys: [
      {
        id: 'm41_muc2',
        worldPos: [-0.85, 0.48, 0.2],
        title: '◆ 外松散黏液层 MUC2 O-聚糖锚定',
        subtitle: '共生菌黏附素识别宿主黏蛋白 · 证据：机制推测',
        evidenceGrade: '机制推测',
        semanticState: 'uncertain',
        mechanismDetail:
          '人体体内实时黏附速率难以通过常规活检连续量化，类器官实验显示 MUC2 糖基化完整性决定初始驻留率。',
      },
      {
        id: 'm41_inner',
        worldPos: [0.75, 0.12, 0.15],
        title: '● 内致密黏液层物理隔离带',
        subtitle: '阻隔菌体直接接触上皮 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          '健康状态下内黏液层厚约 50–200 μm，孔径极小，仅允许短链脂肪酸等小分子代谢物跨层扩散。',
      },
    ],
  },
  colonization: {
    id: 'colonization',
    indexLabel: '4.2',
    verbPhrase: '定植',
    title: '4.2 定植：生态位竞争与次级胆汁酸转化',
    evidenceBadge: '证据充分',
    evidenceGrade: '高',
    semanticState: 'homeostasis',
    camera: {
      position: [0.25, 0.45, 2.35],
      target: [0.0, 0.05, 0.0],
      fov: 32,
      viewType: '微观组织学剖面视角',
      scaleMode: 'micro_mucosa',
    },
    summary:
      '供体梭菌簇（如 Clostridium scindens 等）占据隐窝口外周生态位，抢占单糖与唾液酸碳源，并通过 7α-脱羟基酶将初级胆汁酸转化为次级胆汁酸。',
    mechanismPoints: [
      '初级胆汁酸（如牛磺胆酸 TCA）会强烈诱导艰难梭菌孢子萌发；供体菌将其转化为脱氧胆酸（DCA）与石胆酸（LCA），直接抑制艰难梭菌营养体增殖与毒素分泌。',
      '共生菌分泌窄谱细菌素（Bacteriocins）并消耗游离唾液酸，剥夺机会致病菌（如肠杆菌科）的扩增底物。',
      '循证边界：次级胆汁酸代谢恢复是 rCDI 临床治愈中证据最确凿的核心机制（证据等级：高）。',
    ],
    failureModeNote:
      '失败模式：若肠腔残留万古霉素或广谱抗生素，表达 7α-脱羟基酶的专性厌氧梭菌被优先杀灭，初级胆汁酸再次堆积导致早期复发。',
    buoys: [
      {
        id: 'm42_bile',
        worldPos: [-0.7, 0.38, 0.25],
        title: '● 7α-脱羟基酶转化次级胆汁酸 (DCA/LCA)',
        subtitle: '抑制艰难梭菌孢子萌发与营养体 · 证据：高',
        evidenceGrade: '高',
        semanticState: 'homeostasis',
        mechanismDetail:
          '临床代谢组学证实成功 FMT 后患者粪便次级胆汁酸在 48–72 小时内显著回升，与 rCDI 无复发缓解强相关。',
      },
      {
        id: 'm42_pathogen',
        worldPos: [0.85, 0.42, -0.1],
        title: '▲ 机会致病菌被排斥脱离生态位',
        subtitle: '碳源剥夺与细菌素竞争抑制 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'dysbiosis',
        mechanismDetail:
          '当受体存在顽固变形菌门生物膜或抗生素残留时，可能出现反向“定植抵抗”导致供体菌定植受阻。',
      },
    ],
  },
  metabolism: {
    id: 'metabolism',
    indexLabel: '4.3',
    verbPhrase: '代谢',
    title: '4.3 代谢：SCFAs 丁酸盐生成与紧密连接修复',
    evidenceBadge: '证据有限',
    evidenceGrade: '中',
    semanticState: 'homeostasis',
    camera: {
      position: [-0.45, 0.15, 2.2],
      target: [0.0, -0.22, 0.0],
      fov: 31,
      viewType: '微观组织学剖面视角',
      scaleMode: 'micro_mucosa',
    },
    summary:
      '定植的产丁酸菌（F. prausnitzii、Roseburia）发酵膳食纤维产生短链脂肪酸（乙酸、丙酸、丁酸），为结肠上皮供能并促进紧密连接蛋白闭合。',
    mechanismPoints: [
      '丁酸盐（Butyrate）提供结肠柱状上皮细胞约 70% 的能量来源，驱动线粒体 β-氧化大量耗氧，从而维持肠腔表面生理性低氧（Hypoxia < 1% O₂）。',
      '生理性低氧稳定上皮缺氧诱导因子 HIF-1α，上调紧密连接蛋白（ZO-1、Occludin、Claudin-1）与 MUC2 表达，收窄细胞旁路肠漏。',
      '循证边界：代谢物恢复与屏障指标改善在临床队列及动物模型中证据明确，但个体饮食纤维摄入差异造成产量波动大（证据等级：中）。',
    ],
    failureModeNote:
      '失败模式：若受体长期禁食或处于极低渣饮食状态，缺乏可发酵多糖底物，即便产丁酸菌成功定植也无法输出足量丁酸盐。',
    buoys: [
      {
        id: 'm43_butyrate',
        worldPos: [-0.65, -0.05, 0.25],
        title: '● 丁酸盐驱动上皮 β-氧化维持腔内低氧',
        subtitle: '抑制兼性厌氧肠杆菌科扩增 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          '上皮耗氧维持肠腔厌氧微环境，防止氧气向肠腔渗漏引发变形菌门（Proteobacteria）有氧呼吸爆发。',
      },
      {
        id: 'm43_zo1',
        worldPos: [0.65, -0.22, 0.3],
        title: '● 紧密连接蛋白 (ZO-1 / Occludin) 闭合',
        subtitle: '降低肠黏膜通透性，阻断内毒素移位 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          'HIF-1α 稳定与 HDAC 抑制协同促进紧密连接复合物组装，修复受损上皮屏障。',
      },
    ],
  },
  immune: {
    id: 'immune',
    indexLabel: '4.4',
    verbPhrase: '免疫互作',
    title: '4.4 免疫互作：固有层 Treg 诱导与促炎信号下调',
    evidenceBadge: '机制推测',
    evidenceGrade: '机制推测',
    semanticState: 'uncertain',
    camera: {
      position: [0.4, -0.15, 2.3],
      target: [0.0, -0.5, 0.0],
      fov: 32,
      viewType: '微观组织学剖面视角',
      scaleMode: 'micro_mucosa',
    },
    summary:
      '跨上皮扩散的丁酸盐与色氨酸吲哚衍生物作用于固有层树突状细胞（DC）与 T 细胞，调节 Treg/Th17 平衡并下调促炎细胞因子。',
    mechanismPoints: [
      '丁酸盐激活 GPR43 / GPR109A 受体并抑制组蛋白去乙酰化酶（HDAC），促进 Foxp3 启动子乙酰化，诱导调节性 T 细胞（Foxp3+ Treg）分化并分泌 IL-10。',
      '色氨酸代谢产生的吲哚-3-乙酸（IAA）/ 吲哚甲醛激活芳烃受体（AhR），促进产生 IL-22 的 3 型固有淋巴细胞（ILC3）修复黏膜，下调 Th17、TNF-α 与 IL-6。',
      '循证边界：人体固有层免疫重编程受宿主既有自身免疫克隆与合并用药影响极大，跨研究异质性高（证据等级：机制推测 / 低）。',
    ],
    failureModeNote:
      '失败模式：慢性难治性 IBD 患者固有层可能存在不可逆纤维化或顽固自身免疫记忆克隆，单纯微生态信号不足以逆转免疫风暴。',
    buoys: [
      {
        id: 'm44_treg',
        worldPos: [-0.6, -0.62, 0.2],
        title: '◆ GPR43/109A 与 HDAC 抑制诱导 Foxp3+ Treg',
        subtitle: '分泌 IL-10 建立黏膜免疫耐受 · 证据：机制推测',
        evidenceGrade: '机制推测',
        semanticState: 'uncertain',
        mechanismDetail:
          '小鼠模型中梭菌簇 IV/XIVa 强效诱导结肠 Treg，但在人类 IBD 活检队列中应答幅度存在显著个体分化。',
      },
      {
        id: 'm44_th17',
        worldPos: [0.68, -0.58, 0.15],
        title: '▲ 促炎轴 (Th17 / TNF-α / IL-6) 倾向回落',
        subtitle: '粪钙卫蛋白 (FCP) 随屏障修复缓步下降 · 证据：低',
        evidenceGrade: '低',
        semanticState: 'dysbiosis',
        mechanismDetail:
          '黏膜炎症信号回落通常滞后于菌群定植 2–6 周，合并使用生物制剂或激素会混淆归因。',
      },
    ],
  },
};

export const STAGES: StageSpec[] = [
  {
    id: 1,
    groupId: 'phase1',
    groupTitle: '阶段 I · 筛查与制备',
    verbPhrase: '供体筛查',
    fullTitle: '1. 供体筛查：多维风险排除与基线菌群谱评估',
    evidenceBadge: '证据充分',
    primaryEvidenceGrade: '专家共识',
    semanticState: 'homeostasis',
    camera: {
      position: [-4.2, 2.6, 6.8],
      target: [-0.5, 0.2, 0.0],
      fov: 38,
      viewType: '外部+半剖视角',
      scaleMode: 'macro_prep',
    },
    summary:
      '通过血液学、粪便病原学、多重耐药基因（如 ESBL、CRE、VRE）筛查排除安全性风险，并评估供体基线 α-多样性与核心产丁酸菌丰度。',
    mechanismPoints: [
      '安全性底线（高证据）：严格拦截潜伏肠道致病菌、病毒及耐药质粒，防止医源性感染传递。',
      '功能基因库储备（专家共识/中证据）：富集厚壁菌门梭菌簇 IV/XIVa 与拟杆菌门，为下游胆汁酸转化与 SCFAs 合成提供酶系基础。',
      '反直觉钩子：供体 α-多样性更高 ≠ 对特定受体疗效更好；供-受生态位互补与围移植期微环境窗口比单一供体打分更关键。',
    ],
    clinicalBoundaryNote:
      '粪便宏基因组相对丰度仅代表基因拷贝比例，不等同于活菌绝对数量或进入受体肠道后的实际定植活性。',
    controlType: 'donor_profile_select',
    controlLabel: '供体基线与受体微环境情景设定',
    controlHint: '切换不同供体基线与受体暴露情景，观察常驻三读数区间与 3D 菌群载荷变化',
    buoys: [
      {
        id: 's1_pathogen',
        worldPos: [-2.1, 1.35, 0.3],
        title: '▲ 多重耐药基因与病原学一级拦截',
        subtitle: '排除产 ESBL 肠杆菌 / 艰难梭菌 / 潜伏病毒 · 证据：高',
        evidenceGrade: '高',
        semanticState: 'dysbiosis',
        mechanismDetail:
          '2019 年 FDA 安全性警示后，产 ESBL 大肠埃希菌、志贺毒素基因及多重耐药菌（MDRO）筛查已成为强制安全性标准。',
      },
      {
        id: 's1_functional',
        worldPos: [-2.1, -0.35, 0.45],
        title: '● 核心产丁酸菌与胆汁酸转化菌丰度评估',
        subtitle: 'F. prausnitzii / Roseburia 基线储备 · 证据：专家共识',
        evidenceGrade: '专家共识',
        semanticState: 'homeostasis',
        mechanismDetail:
          '高丰度产丁酸菌与次级胆汁酸合成基因簇有助于提升代谢功能冗余度，但单一指标不能独立预测非 rCDI 适应证结局。',
      },
      {
        id: 's1_colon_ref',
        worldPos: [1.85, 0.55, -0.4],
        title: '◆ 受体远景结肠基线微环境待匹配',
        subtitle: '单维高多样性≠必然定植成功 · 点击可预览定植微区',
        evidenceGrade: '中',
        semanticState: 'uncertain',
        mechanismDetail:
          '受体原籍残存菌群的定植抵抗及是否残留广谱抗生素，对最终菌株定植率（Engraftment Rate）具有一票否决权。',
        canDrillMicro: true,
        targetMicroStep: 'colonization',
      },
    ],
  },
  {
    id: 2,
    groupId: 'phase1',
    groupTitle: '阶段 I · 筛查与制备',
    verbPhrase: '菌群制备',
    fullTitle: '2. 菌群制备：厌氧分离纯化与冻存活性质控',
    evidenceBadge: '证据充分',
    primaryEvidenceGrade: '高',
    semanticState: 'homeostasis',
    camera: {
      position: [-3.1, 1.85, 5.2],
      target: [-1.3, 0.05, 0.0],
      fov: 36,
      viewType: '外部+半剖视角',
      scaleMode: 'macro_prep',
    },
    summary:
      '在厌氧工作站或密闭自动化系统中完成多级微孔过滤、去残渣、离心富集，并加入甘油冻存保护剂于 -80°C 标准化保存。',
    mechanismPoints: [
      '厌氧时间窗保护（中证据）：专性厌氧菌（如 F. prausnitzii）对氧气高度敏感，缩短暴露时间（≤2h）与充氮保护可显著降低氧化应激死亡。',
      '冻存 vs 新鲜菌液（高证据）：多项双盲 RCT（如 Lee et al., JAMA 2016）证实，在 rCDI 治疗中标准化 -80°C 冻存菌液与新鲜菌液的临床缓解率区间相当（约 75%–90%）。',
      '降低内毒素负荷：多级微孔滤膜去除未消化粗纤维残渣与游离裂解碎片，减少灌注后短暂发热等不良反应倾向。',
    ],
    clinicalBoundaryNote:
      '体外流式细胞术（PMA-qPCR / 活死菌染色）测得的膜完整活菌比例，不完全等同于进入结肠低氧环境后的复苏增殖效率。',
    controlType: 'anaerobic_prep_slider',
    controlLabel: '厌氧工艺控制与活菌保护水平',
    controlHint: '拖动滑块调节厌氧保护水平（50% 常规暴露 ↔ 95% 严格厌氧 ≤1h），观察专性厌氧菌保留倾向',
    buoys: [
      {
        id: 's2_filter',
        worldPos: [-2.1, 0.72, 0.4],
        title: '● 多级孔径滤膜分离膳食残渣与大颗粒',
        subtitle: '保留微米级菌体并降低游离内毒素负荷 · 证据：高',
        evidenceGrade: '高',
        semanticState: 'homeostasis',
        mechanismDetail:
          '逐级过滤（如 2.0mm → 0.5mm → 0.25mm）确保菌液可通过内镜工作通道或灌装肠溶胶囊而不发生堵塞。',
      },
      {
        id: 's2_anaerobic',
        worldPos: [-2.1, -0.15, 0.5],
        title: '● 厌氧微环境保护专性厌氧共生菌活性',
        subtitle: '防止梭菌簇 IV/XIVa 氧化失活 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          '对于 IBD 等依赖产丁酸专性厌氧菌的慢性适应证，严格厌氧制备比有氧制备能保留更高比例的氧气敏感菌株。',
      },
      {
        id: 's2_cryo',
        worldPos: [-2.1, -1.05, 0.4],
        title: '● 10% 甘油冻存保护与标准复温非劣效',
        subtitle: 'rCDI 冻存 vs 新鲜缓解区间相当 (75%–90%) · 证据：高',
        evidenceGrade: '高',
        semanticState: 'homeostasis',
        mechanismDetail:
          '标准化冻存菌液使“筛查窗口期检疫复核”成为可能，大幅提升了临床可及性与生物安全闭环。',
      },
    ],
  },
  {
    id: 3,
    groupId: 'phase2',
    groupTitle: '阶段 II · 递送与定植',
    verbPhrase: '移植递送',
    fullTitle: '3. 移植递送：跨消化道靶向输注与管腔流体分布',
    evidenceBadge: '证据充分',
    primaryEvidenceGrade: '高',
    semanticState: 'homeostasis',
    camera: {
      position: [0.0, 1.8, 5.2],
      target: [0.0, 0.0, 0.0],
      fov: 40,
      viewType: '剖面视角',
      scaleMode: 'macro_colon',
    },
    summary:
      '通过下消化道（结肠镜/保留灌肠）或上消化道（耐酸肠溶胶囊/鼻空肠管）将活性菌群递送至肠道靶区，跨越消化液屏障与流体剪切力。',
    mechanismPoints: [
      '下消化道结肠镜灌注（高证据）：直观评估结肠黏膜病变程度，将菌液直接输注至盲肠/升结肠，规避胃酸、胃蛋白酶与小肠高浓度胆汁盐损耗。',
      '上消化道口服肠溶胶囊（高证据）：依靠 pH 敏感包衣在回肠末端/近端结肠崩解；RCT（Kao et al., JAMA 2017）证实在 rCDI 中与结肠镜缓解率总体相当（约 78%–88%），但菌群定植达峰存在约 1–2 周延迟倾向。',
      '管腔停留动力学（专家共识）：结肠半月襞（Haustra）形成的袋状微涡流有助于菌群颗粒向黏液层表面沉降。',
    ],
    clinicalBoundaryNote:
      '对于重度结肠扩张、中毒性巨结肠高风险或严重吞咽障碍患者，递送途径存在严格禁忌证边界；非 rCDI 适应证最佳递送频次尚无统一结论。',
    controlType: 'delivery_route_toggle',
    controlLabel: '临床递送途径切换',
    controlHint: '切换「下消化道结肠镜灌注」与「上消化道肠溶胶囊递送」，观察 3D 剖面递送器械、流线起点与初始载荷变化',
    buoys: [
      {
        id: 's3_route',
        worldPos: [-1.45, 0.35, 0.45],
        title: '● 靶向递送入口：结肠镜导管 / 肠溶胶囊崩解',
        subtitle: 'rCDI 两种途径总体缓解区间相当 (78%–88%) · 证据：高',
        evidenceGrade: '高',
        semanticState: 'homeostasis',
        mechanismDetail:
          '结肠镜灌注初始局部生物量高；肠溶胶囊无创、依从性好，适合序贯巩固，但需防范胃排空障碍导致的近端崩解。',
      },
      {
        id: 's3_haustra',
        worldPos: [0.35, -0.45, 0.5],
        title: '● 结肠袋 (Haustra) 低剪切沉降微区 [点击下钻微观]',
        subtitle: '管腔菌流向黏膜表面沉降 · 点击下钻至阶段 4 黏液层',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          '半月襞凹槽减缓肠腔轴向流速，为供体共生菌接触外黏液层 MUC2 糖链提供物理时间窗。点击此浮标可直接下钻至微观 4 步过程。',
        canDrillMicro: true,
        targetMicroStep: 'adhesion',
      },
      {
        id: 's3_retention',
        worldPos: [1.65, 0.42, 0.3],
        title: '◆ 肠腔停留时间 (Retention Time) 个体波动',
        subtitle: '受腹泻高动力排空显著影响 · 证据：专家共识',
        evidenceGrade: '专家共识',
        semanticState: 'uncertain',
        mechanismDetail:
          '活动期重度腹泻患者肠腔排空过快，单次灌注菌液可能在完成黏附前被大量排出，造成实际有效接触剂量高度不确定。',
      },
    ],
  },
  {
    id: 4,
    groupId: 'phase2',
    groupTitle: '阶段 II · 递送与定植',
    verbPhrase: '定植与屏障修复',
    fullTitle: '4. 定植与屏障修复：双层黏液重建与微观四步级联',
    evidenceBadge: '证据有限',
    primaryEvidenceGrade: '中',
    semanticState: 'homeostasis',
    camera: {
      position: [0.6, 0.4, 2.35],
      target: [0.0, -0.15, 0.0],
      fov: 32,
      viewType: '微观组织学剖面视角',
      scaleMode: 'micro_mucosa',
    },
    summary:
      '相机推进至结肠隐窝与双层黏液屏障微观尺度，完整拆解「4.1 黏附 → 4.2 定植 → 4.3 代谢 → 4.4 免疫互作」四步级联过程及抗生素暴露下的崩溃机制。',
    mechanismPoints: [
      '尺度跨越：管腔游离菌必须转化为黏膜相关菌群（Mucosa-associated Microbiota），才能实现长期稳态定植。',
      '四步级联耦合：MUC2 外层锚定（推测）→ 次级胆汁酸与营养竞争（高证据）→ 丁酸盐供能闭合 ZO-1 紧密连接（中证据）→ 固有层 Treg 免疫调节（机制推测）。',
      '微环境一票否决：切换至「受体近期抗生素暴露」可直观观察供体厌氧菌被残留药物无差别清除、黏液层剥脱与肠漏反弹的失败模式。',
    ],
    clinicalBoundaryNote:
      '请在 3D 视口顶部切换「4.1 黏附 / 4.2 定植 / 4.3 代谢 / 4.4 免疫互作」微观子步骤，并在下方切换三类临床情景分支进行对照推演。',
    controlType: 'scenario_branch_select',
    controlLabel: '临床情景分支推演（供-受微环境耦合）',
    controlHint: '切换三类临床情景，实时对比微观黏液层厚度、ZO-1 紧密连接闭合度、共生菌/致病菌比例及常驻三读数区间',
    buoys: MICRO_STEPS.colonization.buoys,
  },
  {
    id: 5,
    groupId: 'phase3',
    groupTitle: '阶段 III · 结局评估',
    verbPhrase: '疗效评估',
    fullTitle: '5. 疗效评估：多维微生态定植谱与临床缓解区间复盘',
    evidenceBadge: '证据充分',
    primaryEvidenceGrade: '高',
    semanticState: 'homeostasis',
    camera: {
      position: [-1.8, 1.35, 3.8],
      target: [0.0, -0.1, 0.0],
      fov: 36,
      viewType: '剖面视角',
      scaleMode: 'hybrid_eval',
    },
    summary:
      '结合随访时间窗（第 1 周冲刷期、第 4 周驻留期、第 8–12 周主要终点），综合菌株定植率、粪钙卫蛋白（FCP）及内镜/症状指标评估缓解区间。',
    mechanismPoints: [
      '短期冲刷 vs 长期定植：移植后第 1 周粪便检出高丰度供体菌可能仅反映管腔过路菌（Transient Passage）；第 8–12 周持续稳定才代表真实生态位定植（高证据）。',
      '临床症状与黏膜愈合解耦（中证据）：排便频率下降常早于内镜下溃疡愈合与组织学紧密连接完全修复，过早中断随访易高估远期稳态率。',
      '核心复盘结论（反直觉钩子）：FMT 疗效并非由供体单一多样性指标决定，而是「供体功能冗余 + 受体生态位相容 + 围移植期零抗生素干扰」共同作用的结果。',
    ],
    clinicalBoundaryNote:
      '所有评估读数均展示为倾向与参考区间（演示数据 · 非诊疗用途），临床真实随访需警惕采样偏差与失访带来的乐观偏倚。',
    controlType: 'followup_window_select',
    controlLabel: '随访评估时间窗（移植后第 1 / 4 / 8–12 周）',
    controlHint: '切换移植后不同随访时间点，观察菌群定植稳态形成或衰减（Engraftment Decay）的动态区间变化',
    buoys: [
      {
        id: 's5_engraft',
        worldPos: [-0.95, 0.45, 0.35],
        title: '● 菌株级定植率 (Strain Engraftment) 评估',
        subtitle: '第 8–12 周持续驻留区分真实定植与过路冲刷 · 证据：高',
        evidenceGrade: '高',
        semanticState: 'homeostasis',
        mechanismDetail:
          '基于单核苷酸变异（SNV）的宏基因组追踪（Schmidt et al., Nat Med 2022）表明，受体基线状态对定植率的解释度高于供体单方指标。',
      },
      {
        id: 's5_mucosal',
        worldPos: [0.85, -0.15, 0.3],
        title: '● 黏膜屏障愈合与粪钙卫蛋白 (FCP) 回落区间',
        subtitle: '组织学修复常滞后于排便症状缓解 · 证据：中',
        evidenceGrade: '中',
        semanticState: 'homeostasis',
        mechanismDetail:
          '内镜下黏膜血管纹理恢复与杯状细胞黏液层重建需数周时间，临床评估需结合生物标志物与内镜终点。',
        canDrillMicro: true,
        targetMicroStep: 'metabolism',
      },
      {
        id: 's5_sampling',
        worldPos: [0.1, -0.72, 0.25],
        title: '◆ 粪便管腔采样 vs 黏膜活检定植偏差',
        subtitle: '粪便测序无法完全代表隐窝黏膜定植谱 · 证据：专家共识',
        evidenceGrade: '专家共识',
        semanticState: 'uncertain',
        mechanismDetail:
          '详见右侧「局限性」面板第 3 条：管腔游离菌群受当日饮食与排空速度影响大，与黏膜相关菌群存在显著组成差异。',
      },
    ],
  },
];

export const CAUSAL_TABLE_ROWS: CausalRow[] = [
  {
    stageOrScenario: '1. 供体筛查',
    inputVariable: '严格多维筛查（病原学/耐药基因阴性 + 高丰度产丁酸核心菌属）',
    mechanism: '阻断外源耐药菌（如 ESBL）输入，提供充足的 SCFAs 与次级胆汁酸转化酶系基因库',
    observedTendencyAndInterval:
      '· 多样性指数：倾向处于健康高分位区间\n· 炎症信号：无外源促炎触发倾向\n· 缓解概率区间：提供正向基线支撑（规避安全性失败）',
    evidenceGrade: '专家共识',
    evidenceNote: '筛查安全性为【高】；单一供体指标预测疗效为【中/低】',
    uncertaintySource: '粪便宏基因组丰度 ≠ 体内活菌代谢活性；同一供体不同批次间存在饮食/作息漂移',
  },
  {
    stageOrScenario: '2. 菌群制备',
    inputVariable: '厌氧工艺控制（暴露 ≤2h vs 常规；10% 甘油 -80°C 冻存 vs 新鲜）',
    mechanism: '减少专性厌氧共生菌（梭菌簇 IV/XIVa）氧化应激死亡，去除粗残渣降低游离 LPS 负荷',
    observedTendencyAndInterval:
      '· 多样性指数：专性厌氧活菌多样性保留率倾向提升\n· 炎症信号：死菌裂解产物（LPS）比例倾向降低\n· 缓解概率区间：rCDI 中标准冻存与新鲜菌液相当（约 75%–90%）',
    evidenceGrade: '高',
    evidenceNote: 'Lee et al., JAMA 2016 证实冻存 vs 新鲜非劣效【高】；严格厌氧保护【中】',
    uncertaintySource: '体外流式活菌染色（PMA-qPCR）与肠道内真实复苏增殖能力存在偏差；各中心 SOP 异质性',
  },
  {
    stageOrScenario: '3. 移植递送',
    inputVariable: '递送途径选择（结肠镜下消化道直接灌注 vs 肠溶胶囊经上消化道递送）',
    mechanism: '下消化道直达结肠靶区规避胃酸/胆盐损耗；胶囊依从性高但受崩解位置与胃肠动力影响',
    observedTendencyAndInterval:
      '· 多样性指数：结肠灌注局部初始载荷更快达稳态；胶囊存在 1–2 周定植延迟倾向\n· 缓解概率区间：rCDI 中胶囊与结肠镜总体相当（约 78%–88%）',
    evidenceGrade: '高',
    evidenceNote: 'Kao et al., JAMA 2017 证实 rCDI 胶囊 vs 结肠镜非劣效【高】',
    uncertaintySource: '受体胃排空延缓或腹泻高动力排空导致菌液肠腔停留时间（Retention Time）高度波动',
  },
  {
    stageOrScenario: '4.1 微观：黏附',
    inputVariable: '宿主外黏液层完整性 + 供体共生菌表面黏附素表达',
    mechanism: '识别杯状细胞分泌的 MUC2 黏蛋白 O-聚糖链，完成初始物理锚定并隔离上皮 TLR',
    observedTendencyAndInterval:
      '· 多样性指数：管腔游离菌向黏膜相关菌群转化，驻留倾向提升\n· 炎症信号：减少菌体直接触碰上皮顶膜，过度免疫激活倾向减弱',
    evidenceGrade: '机制推测',
    evidenceNote: '人体原位实时连续观测受限，基于动物与类器官模型【机制推测】',
    uncertaintySource: '重度溃疡患者外黏液层剥脱，共生菌失去锚定基质并直接暴露于固有层免疫细胞',
  },
  {
    stageOrScenario: '4.2 微观：定植',
    inputVariable: '供-受生态位竞争 + 次级胆汁酸转化（7α-脱羟基酶活性）',
    mechanism: '将促孢子萌发的初级胆汁酸转化为脱氧胆酸（DCA）/石胆酸（LCA），抑制艰难梭菌并抢占碳源',
    observedTendencyAndInterval:
      '· 多样性指数：Shannon 指数倾向从失衡低谷向供体基线靠拢\n· 炎症信号：毒素（TcdA/TcdB）与 PAMPs 产生倾向显著下降\n· 缓解概率区间：rCDI 缓解倾向 75%–90%',
    evidenceGrade: '高',
    evidenceNote: 'rCDI 胆汁酸代谢恢复机制【高】；非感染性肠炎生态位竞争【中】',
    uncertaintySource: '宿主原籍耐药变形菌门（Proteobacteria）生物膜可能产生反向“定植抵抗”',
  },
  {
    stageOrScenario: '4.3 微观：代谢',
    inputVariable: '可溶性膳食纤维底物供给 + 产丁酸菌定植丰度',
    mechanism: '发酵产生丁酸盐供能结肠上皮 β-氧化耗氧，维持腔内生理性低氧，稳定 HIF-1α 并闭合 ZO-1',
    observedTendencyAndInterval:
      '· 多样性指数：厌氧生理环境巩固，兼性厌氧致病菌扩增受抑\n· 炎症信号：紧密连接蛋白（ZO-1/Occludin）恢复，肠漏通透性区间收窄',
    evidenceGrade: '中',
    evidenceNote: '临床代谢组学队列相关性与体内外模型证实【中】',
    uncertaintySource: '受体术后或急性期禁食/极低渣饮食导致发酵底物匮乏，定植菌无法输出足量 SCFAs',
  },
  {
    stageOrScenario: '4.4 微观：免疫互作',
    inputVariable: 'SCFAs 与色氨酸吲哚衍生物跨上皮浓度梯度',
    mechanism: '激活固有层 DC 与 T 细胞表面 GPR43/109A 及 AhR 通路，诱导 Foxp3+ Treg 扩增并下调 Th17',
    observedTendencyAndInterval:
      '· 炎症信号：TNF-α、IL-6、IL-17A 及粪钙卫蛋白（FCP）呈阶梯式回落倾向\n· 缓解概率区间：UC 短期无激素缓解区间约 25%–45%（Cochrane 2023）',
    evidenceGrade: '机制推测',
    evidenceNote: '人体局部黏膜免疫重编程个体异质性极高【机制推测 / 低】',
    uncertaintySource: '宿主既有自身免疫记忆克隆、合并使用全身激素或生物制剂会掩盖或干扰微生态免疫信号',
  },
  {
    stageOrScenario: '情景 A：高多样性供体',
    inputVariable: '高丰富度/高产丁酸菌供体 + 受体完成抗生素洗脱（≥24–48h）',
    mechanism: '功能代谢通路高度冗余，多菌属协同占据不同黏膜与管腔生态位',
    observedTendencyAndInterval:
      '· 多样性指数：快速上升并稳定于高稳态区间带\n· 炎症信号：持续下调并收敛至低风险稳态带\n· 缓解概率区间：rCDI 约 80%–92%；UC 探索队列倾向优于常规供体',
    evidenceGrade: '中',
    evidenceNote: 'Kump et al., Gut 2018; Vermeire et al., JCC 2016【中】',
    uncertaintySource: '若与受体残存菌群发生生态位排斥或噬菌体激活，单方高多样性仍可能定植受阻',
  },
  {
    stageOrScenario: '情景 B：常规供体',
    inputVariable: '筛查合格中位多样性供体 + 受体标准洗脱准备',
    mechanism: '补充核心缺失菌群并完成基础胆汁酸转化，但功能冗余度中等',
    observedTendencyAndInterval:
      '· 多样性指数：中度上升，随时间呈中等宽度波动区间\n· 炎症信号：缓步下降，处于轻-中度缓冲带\n· 缓解概率区间：rCDI 单次约 75%–88%；UC 约 24%–36%',
    evidenceGrade: '高',
    evidenceNote: 'IDSA/SHEA 2021 指南 rCDI 标准疗效基线【高】',
    uncertaintySource: '单次移植后部分供体菌株在 4–8 周出现丰度衰减（Engraftment Decay）',
  },
  {
    stageOrScenario: '情景 C：受体近期抗生素暴露',
    inputVariable: '移植前洗脱不足或移植后早期（<7d）暴露于广谱抗生素',
    mechanism: '残存高浓度抗菌药物无差别杀伤供体厌氧共生菌，定植坍塌并诱发耐药肠杆菌/真菌扩增',
    observedTendencyAndInterval:
      '· 多样性指数：短暂脉冲微升后迅速坍塌至极低失衡区间\n· 炎症信号：屏障修复中断，促炎信号反弹至高风险区间\n· 缓解概率区间：显著下移（rCDI 缓解倾向降至 <50%）',
    evidenceGrade: '高',
    evidenceNote: 'Ianiro et al., CGH 2018 围移植期抗生素暴露显著增加失败风险【高】',
    uncertaintySource: '不同抗生素类别的肠道半衰期、胆汁排泄率及菌群杀伤谱差异显著',
  },
];

export interface LimitationItem {
  id: string;
  title: string;
  englishTag: string;
  detail: string;
  clinicalImpact: string;
}

export const UNCERTAINTY_LIMITATIONS: LimitationItem[] = [
  {
    id: 'host_baseline',
    title: '1. 个体基线差异与定植抵抗',
    englishTag: 'Host Baseline & Colonization Resistance',
    detail:
      '受体既有的原籍残存菌群结构、宿主遗传多态性（如 NOD2、ATG16L1）、基础黏液层厚度及隐窝干细胞损伤程度未在通用模型中穷尽。',
    clinicalImpact: '相同供体菌液在不同受体体内的实际菌株级定植率（Strain Engraftment Rate）可相差数倍。',
  },
  {
    id: 'concomitant_meds',
    title: '2. 合并用药非线性干扰',
    englishTag: 'Concomitant Medications Confounding',
    detail:
      '除显性广谱抗生素外，受体合并使用的质子泵抑制剂（PPI）、全身糖皮质激素、生物制剂（如抗 TNF-α 单抗）、免疫抑制剂及 NSAIDs 均会改变肠道微环境。',
    clinicalImpact: '可能非线性削弱供体菌存活率，或掩盖/混淆黏膜免疫细胞因子（如 IL-6、FCP）的真实归因。',
  },
  {
    id: 'sampling_bias',
    title: '3. 管腔 vs 黏膜采样偏差',
    englishTag: 'Luminal vs. Mucosal Sampling Bias',
    detail:
      '临床随访普遍依赖粪便样本测序，其本质反映的是管腔游离菌群（Luminal Microbiota）与脱落残骸，而非真正定植在黏液层与隐窝口的黏膜相关菌群。',
    clinicalImpact: '早期粪便检出供体 DNA 不代表已完成黏膜屏障定植；反之部分黏膜驻留菌在粪便中丰度可能被低估。',
  },
  {
    id: 'loss_to_followup',
    title: '4. 随访失访与时间窗截断偏倚',
    englishTag: 'Loss to Follow-up & Survivorship Bias',
    detail:
      '主流临床试验以 8–12 周为主要终点；随访过程中失访、转为外科手术或更换二线治疗的患者往往富集了无应答或早期复发人群。',
    clinicalImpact: '短期（8 周）症状缓解不等同于远期（>12 个月）微生态稳态维持，远期缓解区间可能存在乐观偏倚。',
  },
  {
    id: 'assay_heterogeneity',
    title: '5. 测序方法与生物信息学管线差异',
    englishTag: 'Assay & Bioinformatics Heterogeneity',
    detail:
      '16S rRNA 扩增子测序（受限于属级分辨率与引物偏倚）与宏基因组鸟枪法测序（受宿主 DNA 污染比例与参考库版本影响）存在系统差异。',
    clinicalImpact: '不同实验室对同一份样本计算的 Shannon 多样性指数与定植率数值不可直接机械横向比对。',
  },
  {
    id: 'non_bacterial_virome',
    title: '6. 非细菌组分（噬菌体与真菌）盲区',
    englishTag: 'Virome & Mycobiome Blind Spot',
    detail:
      '当前三维粒子模型主要表征细菌群落（Bacteriome），尚未显式量化伴随移植的有尾噬菌体目（Caudovirales）、真菌（如念珠菌属 Candida）及游离外泌体。',
    clinicalImpact: '多项研究提示供体噬菌体群落转移与白色念珠菌丰度对 FMT 成败亦有独立调节作用。',
  },
];

export const COUNTER_INTUITIVE_HOOK = {
  headline:
    '反直觉钩子：供体菌群多样性更高 ≠ 对该受体更有效；FMT 的本质是「供-受生态位互补 + 围移植期微环境窗口」的多维耦合。',
  body: '临床上常误以为只需挑选单一 Shannon 指数最高的“超级供体”即可保证成功。然而菌株级宏基因组追踪（Schmidt et al., Nature Medicine 2022）证实，受体基线生态位相容性与围移植期抗生素洗脱窗口对定植成功率的决定权重往往超过供体单方指标——若受体肠腔仍残留广谱抗生素（情景 C），再高多样性的供体菌群也会遭遇无差别药物清除，甚至因生态位真空诱发耐药菌爆发。',
};

export const COMPLIANCE_DECLARATIONS = [
  '演示数据 · 非诊疗用途：本系统内所有多样性读数、炎症信号区间及缓解概率区间均为基于公开文献的医学教学推演演示数据。',
  '零真实患者信息（Zero PHI）：全模块采用程序化三维解剖与微生态动力学模型，不包含任何真实患者姓名、病历号或临床影像。',
  '非临床处方与剂量指导：本模块不输出任何针对个体的治疗建议，不提供菌液输注毫升数/胶囊粒数等剂量指导，不做任何预后承诺。',
  '医疗器械软件（SaMD）路径边界：本模块仅用于临床机制可视化与科研教学沟通；若未来拟用于临床诊疗决策支持，必须按医疗器械软件（SaMD）法规路径另行开展临床验证与注册审批。',
];

/**
 * 根据当前阶段、临床情景分支与阶段专属控件状态，计算右侧顶部三个常驻读数的「倾向 + 区间」
 * 严禁返回确定性单点数值，全部返回 [min, max] 置信区间带与定性倾向描述
 */
export function computePersistentReadings(params: {
  stageId: number;
  scenarioId: ScenarioId;
  prepProtectionLevel: number; // 50 - 95
  deliveryRoute: DeliveryRoute;
  followUpWeek: FollowUpWeek;
}): MetricIntervalReading[] {
  const { stageId, scenarioId, prepProtectionLevel, deliveryRoute, followUpWeek } = params;

  // 厌氧制备修正量 (-8 到 +6)
  const prepDelta = Math.round(((prepProtectionLevel - 75) / 25) * 6);
  // 胶囊在早期阶段存在轻微定植延迟 (-4)，但在终末期收敛
  const routeDelayDelta = deliveryRoute === 'capsule' && stageId <= 4 ? -4 : 0;
  // 随访周数修正
  const weekDelta =
    followUpWeek === 1 ? -8 : followUpWeek === 4 ? 0 : scenarioId === 'standard' ? -3 : 2;

  if (scenarioId === 'antibiotic_exposure') {
    // 情景 C：受体近期抗生素暴露（高风险失败模式）
    const isEarlyStage = stageId <= 2;
    const divInterval: [number, number] = isEarlyStage
      ? [Math.max(45, 62 + prepDelta), Math.min(92, 80 + prepDelta)]
      : stageId === 3
        ? [32, 52]
        : [14, 30];

    const infInterval: [number, number] = isEarlyStage
      ? [58, 76]
      : stageId === 3
        ? [62, 82]
        : [72, 92];

    const remInterval: [number, number] = [22, 48];

    return [
      {
        id: 'diversity',
        label: '菌群多样性指数',
        unitOrScale: 'Shannon 倾向区间 (演示标尺)',
        tendencyText: isEarlyStage
          ? '● 供体载荷正常（尚未进入抗生素残留肠腔）'
          : '▲ 脉冲微升后断崖式坍塌（残留药物无差别清除）',
        interval: divInterval,
        clinicalReferenceText:
          '抗生素暴露下专性厌氧共生菌定植率锐减，变形菌门相对丰度反常占优',
        semanticState: isEarlyStage ? 'homeostasis' : 'dysbiosis',
      },
      {
        id: 'inflammation',
        label: '炎症信号水平',
        unitOrScale: '黏膜促炎/FCP 倾向区间',
        tendencyText: '▲ 屏障修复中断 · 促炎信号持续高位反弹',
        interval: infInterval,
        clinicalReferenceText:
          '丁酸盐匮乏致 ZO-1 紧密连接裂隙扩大，内毒素移位持续激活固有层 Th17/TNF-α',
        semanticState: 'dysbiosis',
      },
      {
        id: 'remission',
        label: '缓解概率区间',
        unitOrScale: '临床无复发缓解倾向区间',
        tendencyText: '▲ 显著向低值偏移（原发无应答/早期复发风险高）',
        interval: remInterval,
        clinicalReferenceText:
          '文献参考：围移植期广谱抗生素暴露使 rCDI 单次缓解率降至 <50% (Ianiro et al., CGH 2018)',
        semanticState: 'dysbiosis',
      },
    ];
  }

  if (scenarioId === 'high_diversity') {
    // 情景 A：高多样性供体 + 标准洗脱
    const stageBoost = stageId === 1 ? 0 : stageId === 2 ? 3 : stageId === 3 ? -5 : stageId === 4 ? 6 : 8;
    const dMin = Math.min(82, Math.max(55, 68 + prepDelta + routeDelayDelta + stageBoost));
    const dMax = Math.min(96, dMin + 16);

    const infBase = stageId <= 2 ? 52 : stageId === 3 ? 46 : stageId === 4 ? 24 : 16;
    const iMin = Math.max(10, infBase - prepDelta);
    const iMax = Math.min(85, iMin + 18);

    const rMin = Math.max(72, Math.min(82, 80 + Math.round(prepDelta * 0.5) + (followUpWeek === 12 ? 2 : 0)));
    const rMax = Math.min(94, rMin + 12);

    return [
      {
        id: 'diversity',
        label: '菌群多样性指数',
        unitOrScale: 'Shannon 倾向区间 (演示标尺)',
        tendencyText: '● 倾向快速跃升并稳定于高分位稳态带',
        interval: [dMin, dMax],
        clinicalReferenceText:
          '高功能冗余度供体菌群协同占据外黏液层生态位，物种丰富度与均匀度双升',
        semanticState: 'homeostasis',
      },
      {
        id: 'inflammation',
        label: '炎症信号水平',
        unitOrScale: '黏膜促炎/FCP 倾向区间',
        tendencyText:
          stageId <= 3
            ? '◆ 递送前/初期基线炎症待下调'
            : '● 随丁酸盐恢复呈阶梯式回落至低风险区间',
        interval: [iMin, iMax],
        clinicalReferenceText:
          '丁酸盐维持上皮低氧并闭合 ZO-1，促炎因子 (TNF-α/IL-6) 与粪钙卫蛋白倾向回落',
        semanticState: stageId <= 3 ? 'uncertain' : 'homeostasis',
      },
      {
        id: 'remission',
        label: '缓解概率区间',
        unitOrScale: '跨适应证文献参考区间',
        tendencyText: '● 处于同类适应证较高分位区间',
        interval: [rMin, rMax],
        clinicalReferenceText:
          '文献参考：rCDI 约 80%–92% (高证据)；UC 短期无激素缓解约 30%–45% (Kump et al., Gut 2018)',
        semanticState: 'homeostasis',
      },
    ];
  }

  // 情景 B：常规合格供体
  const stageMod = stageId === 1 ? -4 : stageId === 2 ? 0 : stageId === 3 ? -6 : stageId === 4 ? 2 : weekDelta;
  const dMin = Math.min(72, Math.max(42, 54 + prepDelta + routeDelayDelta + stageMod));
  const dMax = Math.min(88, dMin + 18);

  const infBase = stageId <= 2 ? 56 : stageId === 3 ? 50 : stageId === 4 ? 34 : 28 - weekDelta;
  const iMin = Math.max(18, infBase - Math.round(prepDelta * 0.5));
  const iMax = Math.min(88, iMin + 20);

  const rMin = Math.max(65, Math.min(76, 72 + Math.round(prepDelta * 0.5)));
  const rMax = Math.min(88, rMin + 14);

  return [
    {
      id: 'diversity',
      label: '菌群多样性指数',
      unitOrScale: 'Shannon 倾向区间 (演示标尺)',
      tendencyText: '● 中度上升 · 呈中等宽度稳态波动区间',
      interval: [dMin, dMax],
      clinicalReferenceText:
        '核心产丁酸菌与胆汁酸转化菌完成定植，但单次移植后 4–8 周可能出现轻度丰度衰减',
      semanticState: 'homeostasis',
    },
    {
      id: 'inflammation',
      label: '炎症信号水平',
      unitOrScale: '黏膜促炎/FCP 倾向区间',
      tendencyText:
        stageId <= 3 ? '◆ 受体基线炎症待干预' : '● 倾向缓步下降至轻-中度缓冲区间',
      interval: [iMin, iMax],
      clinicalReferenceText:
        '黏膜屏障逐步修复，部分慢性炎症个体需多次序贯灌注以巩固免疫耐受',
      semanticState: stageId <= 3 ? 'uncertain' : 'homeostasis',
    },
    {
      id: 'remission',
      label: '缓解概率区间',
      unitOrScale: '跨适应证文献参考区间',
      tendencyText: '● 处于临床标准参考区间',
      interval: [rMin, rMax],
      clinicalReferenceText:
        '文献参考：rCDI 单次缓解约 75%–88% (IDSA 2021)；UC 短期缓解约 24%–36% (Cochrane 2023)',
      semanticState: 'homeostasis',
    },
  ];
}
