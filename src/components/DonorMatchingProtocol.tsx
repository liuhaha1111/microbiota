import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Database,
  Thermometer,
  Calendar,
  UserCheck,
  Layers,
  Check,
  X,
  History,
  ArrowRight,
  Info,
  Pill,
  TrendingUp,
  Microscope,
  Target,
  Dna
} from 'lucide-react';
import {
  ClinicalPatient,
  DonorProfile,
  MicrobiotaBatch,
  FMTTreatmentProtocol,
  SafetyRuleGate
} from '../types';
import {
  mockDonors,
  mockBatches,
  getPatientDataPackage
} from '../data/mockMicroFmtData';
import { ContextBar, SecondaryNav, SecondaryNavItem, ScreenSlotBadge } from './ui';

interface DonorMatchingProtocolProps {
  patient: ClinicalPatient;
}

type DonorTab = 'matching' | 'batches' | 'protocol';

/**
 * 二级导航按「任务」切分：配型决策 → 菌源溯源 → 处方与门控。
 * 三者对应临床开方的三个连续动作，互相不需要对照，适合互斥切面。
 */
const DONOR_TABS: ReadonlyArray<SecondaryNavItem<DonorTab>> = [
  { id: 'matching', label: 'AI智能配型与解释', icon: Sparkles, hint: '六维生物组学配型与候选供体对比' },
  { id: 'batches', label: '供体库与活菌批次', icon: Database, hint: '供体筛查状态与菌液批次溯源' },
  { id: 'protocol', label: '精准移植处方与安全门控', icon: ShieldCheck, hint: '处方参数、安全门控与签署下发' }
];

// 六维配型维度（雷达图与维度条共用同一套定义）
const RADAR_DIMENSIONS = [
  { key: 'microbiomeComplementarity', label: '菌群互补度' },
  { key: 'functionalGain', label: '功能互补度' },
  { key: 'safetyProfile', label: '安全性评级' },
  { key: 'colonizationPotential', label: '定植潜力' },
  { key: 'historicalEfficacy', label: '历史疗效' },
  { key: 'diseaseSuitability', label: '疾病适配性' }
] as const;

type RadarKey = typeof RADAR_DIMENSIONS[number]['key'];
type DimensionScores = Record<RadarKey, number>;

const clamp01 = (v: number) => Math.max(0.05, Math.min(1, v));

/**
 * 六维配型打分。
 * 系统推荐供体直接采用临床配型评估结果；其余候选供体由真实供体字段
 * （多样性、历史治愈率、耐药基因风险、捐献量、筛查状态、适应症覆盖）确定性推导，
 * 保证同一供体每次渲染得分一致，不引入随机数。
 */
function deriveDonorDimensions(donor: DonorProfile, patient: ClinicalPatient): { dims: DimensionScores; overall: number } {
  const diversityScore = clamp01((donor.shannonDiversity - 3.6) / 1.8);
  const efficacyScore = clamp01((donor.clinicalSuccessRate - 65) / 32);
  const experienceScore = clamp01(donor.totalDonations / 30);
  const safetyPenalty = donor.screeningStatus === '临近过期' ? 0.16 : donor.screeningStatus === '复筛中' ? 0.07 : 0;
  const diseaseFit = donor.idealIndications.some(ind => patient.primaryDiagnosis.includes(ind.slice(0, 4)))
    ? 0.95
    : 0.78;

  const dims: DimensionScores = {
    microbiomeComplementarity: diversityScore,
    functionalGain: clamp01(diversityScore * 0.6 + efficacyScore * 0.4),
    safetyProfile: clamp01((donor.amrGeneRisk.startsWith('极低') ? 0.97 : 0.89) - safetyPenalty),
    colonizationPotential: clamp01(0.58 + (donor.shannonDiversity - 4.2) * 0.16 + experienceScore * 0.08),
    historicalEfficacy: efficacyScore,
    diseaseSuitability: diseaseFit
  };

  const overall =
    (dims.microbiomeComplementarity * 0.24 +
      dims.functionalGain * 0.18 +
      dims.safetyProfile * 0.18 +
      dims.colonizationPotential * 0.14 +
      dims.historicalEfficacy * 0.12 +
      dims.diseaseSuitability * 0.14) * 100;

  return { dims, overall };
}

export const DonorMatchingProtocol: React.FC<DonorMatchingProtocolProps> = ({ patient }) => {
  const patientPackage = getPatientDataPackage(patient.id);

  // 推荐供体置顶，其余按供体编号排列
  const matchedDonors = useMemo(() => {
    return [...mockDonors].sort((a, b) => {
      if (a.code === patient.recommendedDonorCode) return -1;
      if (b.code === patient.recommendedDonorCode) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [patient.recommendedDonorCode]);

  const matchedBatches = useMemo(() => {
    return [...mockBatches].sort((a, b) => {
      if (a.donorCode === patient.recommendedDonorCode && b.donorCode !== patient.recommendedDonorCode) return -1;
      if (b.donorCode === patient.recommendedDonorCode && a.donorCode !== patient.recommendedDonorCode) return 1;
      return a.batchNumber.localeCompare(b.batchNumber);
    });
  }, [patient.recommendedDonorCode]);

  const evaluation = patientPackage.matchEvaluation;
  const patientProtocol = patientPackage.fmtProtocol;
  const patientRules = patientPackage.safetyRules;

  const [selectedDonor, setSelectedDonor] = useState<DonorProfile>(matchedDonors[0]);
  const [selectedBatch, setSelectedBatch] = useState<MicrobiotaBatch>(matchedBatches[0]);
  const [protocol, setProtocol] = useState<FMTTreatmentProtocol>(patientProtocol);
  const [ruleGates, setRuleGates] = useState<SafetyRuleGate[]>(patientRules);
  const [activeTab, setActiveTab] = useState<'matching' | 'batches' | 'protocol'>('matching');
  const [batchScope, setBatchScope] = useState<'donor' | 'all'>('donor');

  React.useEffect(() => {
    setSelectedDonor(matchedDonors[0]);
    setSelectedBatch(matchedBatches[0]);
    setProtocol(patientProtocol);
    setRuleGates(patientRules);
    setBatchScope('donor');
  }, [patient.id]);

  // 每个候选供体的六维得分与综合匹配度
  const donorScores = useMemo(() => {
    return matchedDonors.map(donor => {
      const isRecommended = donor.code === evaluation.donorCode;
      const derived = deriveDonorDimensions(donor, patient);
      return {
        donor,
        isRecommended,
        dims: isRecommended ? (evaluation.dimensions as DimensionScores) : derived.dims,
        overall: isRecommended ? evaluation.overallScore : Number(derived.overall.toFixed(1))
      };
    });
  }, [matchedDonors, evaluation, patient]);

  const activeScore = donorScores.find(s => s.donor.code === selectedDonor.code) || donorScores[0];

  // 选中供体的批次（优先展示）
  const batchesOfSelectedDonor = matchedBatches.filter(b => b.donorCode === selectedDonor.code);
  const visibleBatches = batchScope === 'donor' ? batchesOfSelectedDonor : matchedBatches;

  // 供体库总览统计
  // 注意口径：原先「在库合格供体」直接取 matchedDonors.length（含复筛中/临期），
  // 与紧邻的「待复筛/临期供体」并列时自相矛盾。这里按筛查状态拆分统计。
  const libraryStats = useMemo(() => {
    const availableBatches = matchedBatches.filter(b => b.status === '已释放(可使用)');
    const qualifiedDonors = matchedDonors.filter(d => d.screeningStatus === '合格(有效期待定)');
    const pendingDonors = matchedDonors.filter(d => d.screeningStatus !== '合格(有效期待定)');
    return {
      totalDonors: matchedDonors.length,
      donors: qualifiedDonors.length,
      superDonors: qualifiedDonors.filter(d => d.rating === 'A+').length,
      availableBatches: availableBatches.length,
      pendingScreen: pendingDonors.length
    };
  }, [matchedDonors, matchedBatches]);

  const passedGates = ruleGates.filter(r => r.status === 'passed').length;
  // 按门控类别分组，便于逐类核对（返回显式元组数组，避免 Object.entries 推断成 unknown）
  const gatesByCategory = useMemo<Array<[string, SafetyRuleGate[]]>>(() => {
    const groups: Record<string, SafetyRuleGate[]> = {};
    for (const gate of ruleGates) {
      if (!groups[gate.category]) {
        groups[gate.category] = [];
      }
      groups[gate.category].push(gate);
    }
    return Object.entries(groups);
  }, [ruleGates]);

  // SVG 雷达图坐标
  const radarPoints = RADAR_DIMENSIONS.map((d, i) => {
    const angle = (i / RADAR_DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
    const r = (activeScore?.dims[d.key] ?? 0) * 80;
    return `${110 + Math.cos(angle) * r},${110 + Math.sin(angle) * r}`;
  }).join(' ');

  return (
    <div id="donor-matching-protocol-container" className="space-y-4">
      {/* 常驻上下文栏：受体身份 + 安全门控状态。
          门控是开方的前置条件，任何切面下都必须可见；分屏后本屏不向外跳转，
          因此受体基线、门控进度、菌源批次信息全部就地承载。 */}
      <ContextBar
        icon={GitMerge}
        title="供受体智能匹配与精准移植处方系统"
        subtitle={`当前匹配受体 ${patient.name}（${patient.primaryDiagnosis.split(' ')[0]}） · 六维生物组学 AI 配型 · 当前阶段 ${patient.currentPhase}`}
        badges={
          <>
            <ScreenSlotBadge slot={3} />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40 font-mono">
              推荐供体 {evaluation.donorCode}
            </span>
          </>
        }
        metrics={[
          { label: '六维综合匹配度', value: `${evaluation.overallScore}%`, tone: 'info' },
          {
            label: '安全门控通过',
            value: `${passedGates} / ${ruleGates.length}`,
            tone: passedGates === ruleGates.length ? 'ok' : 'warn'
          },
          {
            label: '在库合格供体',
            value: `${libraryStats.donors} / ${libraryStats.totalDonors}`,
            tone: 'default'
          },
          { label: '可用活菌批次', value: libraryStats.availableBatches, tone: 'ok' }
        ]}
        status={
          <>
            处方版本 {protocol.protocolVersion}
            <br />
            审批 {protocol.approvalStatus}
          </>
        }
      />

      <SecondaryNav
        items={DONOR_TABS}
        active={activeTab}
        onChange={setActiveTab}
        trailing={`菌源批次 ${selectedBatch.batchNumber} · 效期 ${selectedBatch.expiryDate}`}
      />

      {/* ============ 视图一：AI 智能配型与解释 ============ */}
      {activeTab === 'matching' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左列：六维雷达 */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#20cfff]/20 text-[#20cfff]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#eef4ff] text-sm">六维生物组学智能配型</h3>
                    <span className="text-[10px] text-[#8996b8]">
                      受体菌群组学 vs 供体 {selectedDonor.code} 微生态表型
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8996b8] block">综合匹配度</span>
                  <span className="text-xl font-bold font-mono text-[#20cfff]">
                    {activeScore?.overall.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-2">
                {/* 雷达图 */}
                <div className="flex justify-center items-center py-1">
                  <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
                    {[0.25, 0.5, 0.75, 1.0].map((scale, i) => {
                      const bgPoints = RADAR_DIMENSIONS.map((_, idx) => {
                        const angle = (idx / RADAR_DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
                        const r = 80 * scale;
                        return `${110 + Math.cos(angle) * r},${110 + Math.sin(angle) * r}`;
                      }).join(' ');
                      return (
                        <polygon
                          key={i}
                          points={bgPoints}
                          fill="none"
                          stroke="#2b4170"
                          strokeWidth="0.8"
                          strokeDasharray={scale === 1 ? 'none' : '2,2'}
                          opacity="0.6"
                        />
                      );
                    })}

                    {RADAR_DIMENSIONS.map((_, idx) => {
                      const angle = (idx / RADAR_DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
                      return (
                        <line
                          key={idx}
                          x1="110"
                          y1="110"
                          x2={110 + Math.cos(angle) * 80}
                          y2={110 + Math.sin(angle) * 80}
                          stroke="#2b4170"
                          strokeWidth="0.8"
                          opacity="0.6"
                        />
                      );
                    })}

                    <polygon
                      points={radarPoints}
                      fill="url(#radarGradient)"
                      stroke="#20cfff"
                      strokeWidth="2"
                      className="drop-shadow-[0_0_8px_rgba(32,207,255,0.5)]"
                    />

                    {RADAR_DIMENSIONS.map((d, idx) => {
                      const angle = (idx / RADAR_DIMENSIONS.length) * Math.PI * 2 - Math.PI / 2;
                      const r = (activeScore?.dims[d.key] ?? 0) * 80;
                      return (
                        <circle
                          key={idx}
                          cx={110 + Math.cos(angle) * r}
                          cy={110 + Math.sin(angle) * r}
                          r="3.5"
                          fill="#20cfff"
                          stroke="#090d18"
                          strokeWidth="1.5"
                        />
                      );
                    })}

                    <defs>
                      <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#20cfff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#397cff" stopOpacity="0.1" />
                      </radialGradient>
                    </defs>
                  </svg>
                </div>

                {/* 维度得分 */}
                <div className="space-y-1.5 text-[11px]">
                  {RADAR_DIMENSIONS.map((d) => {
                    const score = activeScore?.dims[d.key] ?? 0;
                    return (
                      <div key={d.key}>
                        <div className="flex justify-between items-center text-[#8996b8]">
                          <span>{d.label}</span>
                          <span className="font-mono font-bold text-[#eef4ff]">{(score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-0.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#397cff] to-[#20cfff]"
                            style={{ width: `${score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!activeScore?.isRecommended && (
                <div className="mt-2 p-2 rounded bg-[#1a1c29] border border-[#ffb84d]/40 text-[10px] text-[#ffb84d] flex items-start gap-1.5">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>
                    当前查看的是候选供体 {selectedDonor.code} 的推导得分（由多样性、历史治愈率、耐药风险与筛查状态计算）。
                    系统最终推荐的是 <strong>{evaluation.donorCode}</strong>，其可解释理由见右侧。
                  </span>
                </div>
              )}
            </div>

            {/* 候选供体速览 */}
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
              <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#20cfff]" />
                候选供体池（点击切换雷达对比）
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {donorScores.map(({ donor, overall, isRecommended }) => (
                  <div
                    key={donor.id}
                    onClick={() => setSelectedDonor(donor)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                      selectedDonor.id === donor.id
                        ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.25)]'
                        : 'bg-[#0c1429] border-[#2b4170]/40 hover:border-[#2b4170]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#eef4ff] font-mono">{donor.code}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        donor.rating === 'A+' ? 'bg-[#23e6b1]/20 text-[#23e6b1]' : 'bg-[#20cfff]/20 text-[#20cfff]'
                      }`}>
                        {donor.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8996b8]">匹配度</span>
                      <span className="font-mono font-bold text-[#20cfff]">{overall.toFixed(1)}%</span>
                    </div>
                    {isRecommended && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-[#23e6b1] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> 系统推荐
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右列：候选对比 + 可解释理由 */}
          <div className="lg:col-span-7 space-y-4">
            {/* 候选供体六维得分横向对比 */}
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                <h3 className="text-xs font-semibold text-[#eef4ff] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#20cfff]" />
                  候选供体配型对比矩阵
                </h3>
                <span className="text-[10px] text-[#8996b8]">共 {donorScores.length} 位在库供体</span>
              </div>

              <div className="space-y-2.5">
                {donorScores.map(({ donor, overall, dims, isRecommended }) => (
                  <div
                    key={donor.id}
                    onClick={() => setSelectedDonor(donor)}
                    className={`p-2.5 rounded-lg cursor-pointer border transition-all ${
                      selectedDonor.id === donor.id ? 'bg-[#152347] border-[#20cfff]' : 'bg-[#0c1429] border-[#2b4170]/40 hover:border-[#2b4170]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#eef4ff]">{donor.code}</span>
                        <span className="text-[10px] text-[#8996b8]">{donor.donorType}</span>
                        {isRecommended && (
                          <span className="px-1.5 py-0.5 rounded bg-[#23e6b1]/20 text-[#23e6b1] text-[10px] font-bold">
                            推荐
                          </span>
                        )}
                      </span>
                      <span className="font-mono font-bold text-[#20cfff]">{overall.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#091127] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#397cff] via-[#20cfff] to-[#23e6b1]"
                        style={{ width: `${overall}%` }}
                      ></div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] text-[#8996b8]">
                      {RADAR_DIMENSIONS.map(d => (
                        <span key={d.key} className="flex justify-between gap-1">
                          <span className="truncate">{d.label.replace('度', '').replace('评级', '')}</span>
                          <span className="font-mono text-[#cad5e8]">{(dims[d.key] * 100).toFixed(0)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 可解释 AI 配型理由 */}
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
              <h3 className="text-xs font-semibold text-[#20cfff] pb-2 border-b border-[#1e2f57] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 可解释配型理由 · 系统推荐 {evaluation.donorCode} (Explainable Rationales)
              </h3>

              <div>
                <span className="text-[11px] font-semibold text-[#23e6b1] flex items-center gap-1 mb-1.5">
                  <Check className="w-3 h-3" /> 关键互补优势:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#eef4ff]">
                  {evaluation.advantages.map((adv, i) => (
                    <li key={i} className="flex items-start gap-1.5 bg-[#0c1429] p-2 rounded border border-[#2b4170]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#23e6b1] mt-1.5 shrink-0"></span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#ffb84d] flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3 h-3" /> 潜在微生态风险提示:
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#8996b8]">
                  {evaluation.potentialRisks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-1.5 bg-[#0c1429] p-2 rounded border border-[#ffb84d]/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ffb84d] mt-1.5 shrink-0"></span>
                      <span className="text-[#eef4ff]">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1e38] border border-[#20cfff]/40 text-[11px]">
                <span className="font-semibold text-[#20cfff] block mb-0.5">AI综合决策建议:</span>
                <p className="text-[#eef4ff] leading-relaxed">{evaluation.aiRecommendation}</p>
              </div>

              <button
                onClick={() => setActiveTab('protocol')}
                className="w-full py-1.5 rounded-lg bg-[#20cfff]/20 text-[#20cfff] hover:bg-[#20cfff]/30 border border-[#20cfff]/50 font-medium transition-all text-xs flex items-center justify-center gap-1.5"
              >
                采纳该配型，进入精准移植处方
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 视图二：供体库与活菌批次 ============ */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {/* 库总览 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '在库合格供体', value: libraryStats.donors, unit: '位', sub: `库内共 ${libraryStats.totalDonors} 位`, color: 'text-[#20cfff]', icon: <UserCheck className="w-4 h-4 text-[#20cfff]" /> },
              { label: '超级供体 (A+)', value: libraryStats.superDonors, unit: '位', sub: '均为合格供体', color: 'text-[#23e6b1]', icon: <Sparkles className="w-4 h-4 text-[#23e6b1]" /> },
              { label: '已释放可用批次', value: libraryStats.availableBatches, unit: '批', sub: `批次总数 ${matchedBatches.length} 批`, color: 'text-[#397cff]', icon: <Database className="w-4 h-4 text-[#397cff]" /> },
              { label: '待复筛 / 临期供体', value: libraryStats.pendingScreen, unit: '位', sub: '暂停用于新配型', color: 'text-[#ffb84d]', icon: <AlertTriangle className="w-4 h-4 text-[#ffb84d]" /> }
            ].map((stat, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
                <div className="flex items-center justify-between text-[#8996b8] text-xs">
                  <span>{stat.label}</span>
                  {stat.icon}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                  <span className="text-[11px] text-[#8996b8]">{stat.unit}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#8996b8]">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 左列：供体库 */}
            <div className="lg:col-span-5">
              <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs h-full">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                  <h3 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-[#20cfff]" />
                    供体库档案
                  </h3>
                  <span className="text-[11px] text-[#8996b8]">点击查看详情</span>
                </div>

                <div className="space-y-2.5">
                  {matchedDonors.map(donor => {
                    const score = donorScores.find(s => s.donor.code === donor.code);
                    const isRecommended = donor.code === patient.recommendedDonorCode;
                    return (
                      <div
                        key={donor.id}
                        onClick={() => {
                          setSelectedDonor(donor);
                          const own = matchedBatches.filter(b => b.donorCode === donor.code);
                          if (own.length > 0) {
                            setSelectedBatch(own[0]);
                            setBatchScope('donor');
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                          selectedDonor.id === donor.id
                            ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.25)]'
                            : 'bg-[#0c1429] border-[#2b4170]/40 hover:border-[#2b4170]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#eef4ff] font-mono">{donor.code}</span>
                            {isRecommended && (
                              <span className="px-1.5 py-0.5 rounded bg-[#23e6b1]/20 text-[#23e6b1] text-[10px] font-bold">
                                系统推荐
                              </span>
                            )}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            donor.rating === 'A+' ? 'bg-[#23e6b1]/20 text-[#23e6b1]' : donor.rating === 'A' ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'bg-[#ffb84d]/20 text-[#ffb84d]'
                          }`}>
                            {donor.rating} 级
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8996b8] block">
                          {donor.donorType} · {donor.gender} {donor.age}岁 · BMI {donor.bmi}
                        </span>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[#8996b8]">
                          <div>多样性<div className="text-[#eef4ff] font-mono text-[11px]">{donor.shannonDiversity}</div></div>
                          <div>治愈率<div className="text-[#23e6b1] font-mono text-[11px] font-bold">{donor.clinicalSuccessRate}%</div></div>
                          <div>捐献次数<div className="text-[#eef4ff] font-mono text-[11px]">{donor.totalDonations}</div></div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${
                            donor.screeningStatus === '合格(有效期待定)'
                              ? 'bg-[#23e6b1]/15 text-[#23e6b1]'
                              : 'bg-[#ffb84d]/15 text-[#ffb84d]'
                          }`}>
                            筛查: {donor.screeningStatus}
                          </span>
                          <span className="text-[#8996b8] font-mono">匹配 {score?.overall.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右列：选中供体档案 + 批次表 */}
            <div className="lg:col-span-7 space-y-4">
              {/* 供体档案详情 */}
              <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                  <h3 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                    <Microscope className="w-4 h-4 text-[#20cfff]" />
                    供体 {selectedDonor.code} 完整筛查档案
                  </h3>
                  <span className="text-[11px] text-[#8996b8]">{selectedDonor.lastScreenedDate}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
                    <span className="text-[#8996b8] text-[11px]">供体病原筛查全套 (38项):</span>
                    <span className="text-[#23e6b1] font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {selectedDonor.pathogenTest}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
                    <span className="text-[#8996b8] text-[11px]">高危耐药基因 (AMR):</span>
                    <span className="text-[#23e6b1] font-semibold text-[11px]">{selectedDonor.amrGeneRisk}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-semibold text-[#20cfff] flex items-center gap-1 mb-1">
                      <Dna className="w-3 h-3" /> 优势菌群构成 (相对丰度):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDonor.dominantTaxa.map((taxa, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#20cfff]/12 text-[#a2e8ff] border border-[#20cfff]/25 text-[10px] font-mono">
                          {taxa}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#23e6b1] flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3" /> 理想适应症:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDonor.idealIndications.map((ind, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#23e6b1]/12 text-[#8ff0d0] border border-[#23e6b1]/25 text-[10px]">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 冷链批次表 */}
              <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-[#1e2f57]">
                  <h3 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-[#20cfff]" />
                    活菌批次与超低温冷链追踪
                  </h3>
                  <div className="flex items-center p-0.5 rounded-lg bg-[#091127] border border-[#2b4170]/60 text-[11px]">
                    <button
                      onClick={() => setBatchScope('donor')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        batchScope === 'donor' ? 'bg-[#20cfff]/20 text-[#20cfff] font-semibold' : 'text-[#8996b8] hover:text-[#eef4ff]'
                      }`}
                    >
                      仅看 {selectedDonor.code} ({batchesOfSelectedDonor.length})
                    </button>
                    <button
                      onClick={() => setBatchScope('all')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        batchScope === 'all' ? 'bg-[#20cfff]/20 text-[#20cfff] font-semibold' : 'text-[#8996b8] hover:text-[#eef4ff]'
                      }`}
                    >
                      全部批次 ({matchedBatches.length})
                    </button>
                  </div>
                </div>

                {visibleBatches.length === 0 ? (
                  <div className="p-6 text-center text-[#8996b8] text-[11px]">
                    该供体当前没有在库批次，可切换到「全部批次」查看其他供体库存。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleBatches.map(batch => {
                      const isSelected = selectedBatch.batchNumber === batch.batchNumber;
                      const statusColor =
                        batch.status === '已释放(可使用)'
                          ? 'bg-[#23e6b1]/15 text-[#23e6b1]'
                          : batch.status === '检测中'
                          ? 'bg-[#20cfff]/15 text-[#20cfff]'
                          : batch.status === '已临期'
                          ? 'bg-[#ff536c]/15 text-[#ff536c]'
                          : 'bg-[#8996b8]/15 text-[#8996b8]';
                      return (
                        <div
                          key={batch.batchNumber}
                          onClick={() => setSelectedBatch(batch)}
                          className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                            isSelected ? 'bg-[#152347] border-[#20cfff]' : 'bg-[#0c1429] border-[#2b4170]/40 hover:bg-[#101c3d]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#eef4ff]">{batch.batchNumber}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#815cff]/15 text-[#b592ff] text-[10px] font-mono">
                                {batch.donorCode}
                              </span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                              {batch.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 text-[10px] text-[#8996b8]">
                            <div>采样 <span className="text-[#cad5e8] font-mono">{batch.sampleDate}</span></div>
                            <div>制备 <span className="text-[#cad5e8] font-mono">{batch.prepDate}</span></div>
                            <div>有效期 <span className="text-[#cad5e8] font-mono">{batch.expiryDate}</span></div>
                            <div>等级 <span className="text-[#23e6b1]">{batch.qualityGrade}</span></div>
                            <div className="col-span-2">存储 <span className="text-[#cad5e8]">{batch.storageTemp}</span></div>
                            <div className="col-span-2">库位 <span className="text-[#cad5e8]">{batch.location}</span></div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px]">
                            <span className="text-[#23e6b1] font-mono font-bold">{batch.viableCellCount}</span>
                            {batch.usedInPatient && (
                              <span className="text-[#8996b8]">已用于 {batch.usedInPatient}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ 视图三：精准移植处方与安全门控 ============ */}
      {activeTab === 'protocol' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左列：处方正文 */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1e2f57]">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#20cfff]" />
                  <h3 className="font-semibold text-[#eef4ff]">精准菌群移植方案 (FMT Treatment Prescription)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#20cfff]/20 text-[#20cfff] font-mono text-[10px] font-bold">
                    {protocol.protocolVersion}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    protocol.approvalStatus === '医生已签署'
                      ? 'bg-[#23e6b1]/20 text-[#23e6b1]'
                      : 'bg-[#ffb84d]/20 text-[#ffb84d]'
                  }`}>
                    {protocol.approvalStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                  <span className="text-[#8996b8] text-[10px] block">移植给药路径:</span>
                  <span className="font-bold text-[#eef4ff] text-xs mt-0.5 flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-[#20cfff]" /> {protocol.administrationRoute}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                  <span className="text-[#8996b8] text-[10px] block">推荐活菌剂量:</span>
                  <span className="font-mono font-bold text-[#eef4ff] text-xs mt-0.5 block">
                    {protocol.recommendedDose}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                  <span className="text-[#8996b8] text-[10px] block">给药频次与疗程:</span>
                  <span className="font-medium text-[#eef4ff] text-xs mt-0.5 block">
                    {protocol.frequency} · {protocol.treatmentDuration}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                  <span className="text-[#8996b8] text-[10px] block">肠道准备:</span>
                  <span className="font-medium text-[#eef4ff] text-xs mt-0.5 block">
                    {protocol.bowelPreparation}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-[11px] space-y-1">
                <div>
                  <span className="text-[#8996b8]">移植前处理: </span>
                  <span className="text-[#eef4ff]">{protocol.preTreatment}</span>
                </div>
                <div>
                  <span className="text-[#8996b8]">协同营养定植方案: </span>
                  <span className="text-[#eef4ff]">{protocol.nutritionalIntervention}</span>
                </div>
                <div>
                  <span className="text-[#8996b8]">联合药物方案: </span>
                  <span className="text-[#eef4ff]">{protocol.combinedTherapy}</span>
                </div>
              </div>

              {/* 本次执行的菌源批次 */}
              <div className="p-2.5 rounded-lg bg-[#0c1e38] border border-[#20cfff]/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-[#8996b8]">
                  本次处方菌源批次:
                  <strong className="text-[#eef4ff] font-mono ml-1">{selectedBatch.batchNumber}</strong>
                  <span className="ml-2 text-[#815cff] font-mono">{selectedBatch.donorCode}</span>
                </span>
                <span className="text-[#23e6b1] font-mono">{selectedBatch.viableCellCount}</span>
              </div>

              {/* 随访里程碑 */}
              <div>
                <span className="text-[11px] font-semibold text-[#20cfff] flex items-center gap-1.5 mb-2">
                  <Calendar className="w-3.5 h-3.5" /> 疗效随访里程碑 (Review Milestones)
                </span>
                <div className="space-y-1.5">
                  {protocol.reviewMilestones.map((milestone, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-[11px]">
                      <span className="w-5 h-5 rounded-full bg-[#20cfff]/15 text-[#20cfff] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[#eef4ff] leading-relaxed">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右列：安全门控 + 签署 */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#23e6b1]" />
                  严格临床安全门控审查
                </span>
                <span className={`text-[10px] font-bold ${
                  passedGates === ruleGates.length ? 'text-[#23e6b1]' : 'text-[#ffb84d]'
                }`}>
                  {passedGates}/{ruleGates.length} 项通过
                </span>
              </div>

              {/* 通过率进度条 */}
              <div className="w-full h-1.5 rounded-full bg-[#091127] overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#23e6b1] to-[#20cfff]"
                  style={{ width: `${(passedGates / Math.max(1, ruleGates.length)) * 100}%` }}
                ></div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {gatesByCategory.map(([category, gates]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-[#20cfff] tracking-wide">
                        {category}
                      </span>
                      <span className="text-[10px] text-[#8996b8]">
                        {gates.filter(g => g.status === 'passed').length}/{gates.length}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {gates.map(gate => (
                        <div key={gate.id} className="p-2 rounded-lg bg-[#0c1429] border border-[#1e2f57]">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] text-[#eef4ff] leading-snug">{gate.name}</span>
                            <span className={`shrink-0 text-[10px] font-bold flex items-center gap-0.5 ${
                              gate.status === 'passed'
                                ? 'text-[#23e6b1]'
                                : gate.status === 'pending'
                                ? 'text-[#ffb84d]'
                                : 'text-[#ff536c]'
                            }`}>
                              {gate.status === 'passed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              {gate.status === 'passed' ? '合规' : gate.status === 'pending' ? '待审' : '阻断'}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#8996b8] mt-1 leading-relaxed">{gate.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 签署与下发 */}
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2f57]">
                <h3 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#20cfff]" />
                  处方签署与执行
                </h3>
                <span className="text-[10px] text-[#8996b8] font-mono">{protocol.dateCreated}</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#8996b8]">主治医生签名</span>
                  <span className="text-[#20cfff] font-semibold">{protocol.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8996b8]">处方版本</span>
                  <span className="text-[#eef4ff] font-mono">{protocol.protocolVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8996b8]">审批状态</span>
                  <span className="text-[#23e6b1] font-semibold">{protocol.approvalStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8996b8]">菌源批次</span>
                  <span className="text-[#eef4ff] font-mono">{selectedBatch.batchNumber}</span>
                </div>
              </div>

              <div className="flex items-start gap-1.5 p-2 rounded bg-[#1a1c29] border border-[#ffb84d]/30 text-[10px] text-[#ffb84d]">
                <History className="w-3 h-3 mt-0.5 shrink-0" />
                <span>下发后系统将自动开启定植率与炎症指标的纵向随访轨道，并按里程碑推送复查提醒。</span>
              </div>

              {/* 分屏约束：本屏不向其他模块跳转。签署后的流转说明就地呈现，
                  执行状态由本屏门控进度与医师签署动作驱动。 */}
              <div className="p-3 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8996b8]">门控进度</span>
                  <span
                    className={`font-mono font-bold ${
                      passedGates === ruleGates.length ? 'text-[#23e6b1]' : 'text-[#ffb84d]'
                    }`}
                  >
                    {passedGates} / {ruleGates.length} 项通过
                    {passedGates === ruleGates.length ? '，可提交审核' : '，未通过项须先处置'}
                  </span>
                </div>
                <p className="text-[10px] text-[#8996b8] leading-relaxed pt-1.5 border-t border-[#1e2f57]/60">
                  签署后系统自动开启定植率与炎症指标的纵向随访轨道，并按里程碑推送复查提醒；
                  随访数据在「疗效与重构监测」屏独立呈现，本屏不承担跨屏跳转。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
