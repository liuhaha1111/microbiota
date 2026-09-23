import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  ClipboardList,
  Dna,
  FileText,
  GitMerge,
  Info,
  Layers,
  Lock,
  Network,
  Pill,
  ShieldAlert,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react';
import {
  ClinicalPatient,
  FMTTreatmentProtocol,
  HistoricalSample,
  SimilarityFeatureVector,
  SimilarityResult,
  SimilarityWeights
} from '../../types';
import { MicrobiomeKnowledgeGraph } from '../MicrobiomeKnowledgeGraph';
import { describeOutcome } from '../../data/historicalSamples';
import {
  MiniRadar3,
  OutcomeBadge,
  PairBar,
  RatioBar,
  RiskFlag,
  ScoreGauge,
  SectionCard,
  Sparkline,
  Tag,
  toneColor,
  TwinSnapshotStrip,
  UI
} from './historyUi';
import { SimilarityScoreCard } from './SimilarityScoreCard';

type DetailTab = 'baseline' | 'microbiome' | 'matching' | 'protocol' | 'outcome' | 'mdt';

const TABS: Array<{ id: DetailTab; label: string; icon: React.ReactNode; core?: boolean }> = [
  { id: 'baseline', label: '基线与病情档案', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'microbiome', label: '菌群画像与通路', icon: <Dna className="w-3.5 h-3.5" /> },
  { id: 'matching', label: '供受体匹配记录', icon: <GitMerge className="w-3.5 h-3.5" /> },
  { id: 'protocol', label: '历史 FMT 方案样本', icon: <ClipboardList className="w-3.5 h-3.5" />, core: true },
  { id: 'outcome', label: '执行与疗效全链路', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'mdt', label: 'MDT 纪要 & 医生备注', icon: <Users className="w-3.5 h-3.5" /> }
];

const GATE_TONE: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  passed: { color: UI.green, icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: '通过' },
  pending: { color: UI.amber, icon: <AlertTriangle className="w-3.5 h-3.5" />, label: '待确认' },
  blocked: { color: UI.red, icon: <XCircle className="w-3.5 h-3.5" />, label: '禁止' }
};

const MATCH_DIMENSIONS: Array<{ key: keyof HistoricalSample['donorMatch']['dimensions']; label: string }> = [
  { key: 'microbiomeComplementarity', label: '菌群互补' },
  { key: 'functionalGain', label: '功能互补' },
  { key: 'safetyProfile', label: '安全性' },
  { key: 'colonizationPotential', label: '定植潜力' },
  { key: 'historicalEfficacy', label: '历史疗效' },
  { key: 'diseaseSuitability', label: '疾病适配' }
];

/* ------------------------------ 六维雷达 ------------------------------ */

const Radar6: React.FC<{ values: number[]; labels: string[]; size?: number; color?: string }> = ({
  values,
  labels,
  size = 200,
  color = UI.cyan
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 34;
  const angles = values.map((_, i) => ((-90 + (360 / values.length) * i) * Math.PI) / 180);
  const pt = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angles[i]),
    y: cy + r * ratio * Math.sin(angles[i])
  });
  const ring = (ratio: number) =>
    angles.map((_, i) => { const p = pt(i, ratio); return `${p.x},${p.y}`; }).join(' ');
  const valuePoly = values
    .map((v, i) => { const p = pt(i, Math.max(0.05, Math.min(1, v / 100))); return `${p.x},${p.y}`; })
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(lv => (
        <polygon key={lv} points={ring(lv)} fill="none" stroke="#1e2f57" strokeWidth="1" />
      ))}
      {angles.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e2f57" strokeWidth="1" />;
      })}
      <polygon points={valuePoly} fill={`${color}2e`} stroke={color} strokeWidth="1.6" />
      {values.map((v, i) => {
        const p = pt(i, Math.max(0.05, Math.min(1, v / 100)));
        return <circle key={i} cx={p.x} cy={p.y} r="2.4" fill={color} />;
      })}
      {labels.map((lb, i) => {
        const p = pt(i, 1.24);
        return (
          <text key={lb} x={p.x} y={p.y} fill="#8996b8" fontSize="9" textAnchor="middle" dominantBaseline="middle">
            {lb}
          </text>
        );
      })}
    </svg>
  );
};

/* ------------------------------ 主组件 ------------------------------ */

interface HistorySampleDetailProps {
  sample: HistoricalSample;
  similarity: SimilarityResult;
  weights: SimilarityWeights;
  patient: ClinicalPatient;
  patientVector: SimilarityFeatureVector;
  compareMode: boolean;
  favorited: boolean;
  onToggleFavorite: () => void;
  onRequestCopy: () => void;
}

export const HistorySampleDetail: React.FC<HistorySampleDetailProps> = ({
  sample,
  similarity,
  weights,
  patient,
  patientVector,
  compareMode,
  favorited,
  onToggleFavorite,
  onRequestCopy
}) => {
  const [tab, setTab] = useState<DetailTab>('baseline');
  const [versionIndex, setVersionIndex] = useState(sample.protocolVersions.length - 1);
  const [networkView, setNetworkView] = useState<'ecological' | 'multidomain'>('ecological');

  React.useEffect(() => {
    setTab('baseline');
    setVersionIndex(sample.protocolVersions.length - 1);
    setNetworkView('ecological');
  }, [sample.id]);

  const activeVersion = sample.protocolVersions[versionIndex] ?? sample.protocolVersions[0];
  const protocol: FMTTreatmentProtocol = activeVersion.protocol;
  const points = sample.longitudinalPoints;
  const color = toneColor(similarity.overall);
  const badOutcome = sample.outcome === 'no_response' || sample.outcome === 'relapse';

  const stageLabels = useMemo(() => points.map(p => p.label.replace(/第\s*/, '').replace(/\s*周.*$/, 'w')), [points]);

  /** 给药次数从方案疗程文本解析（「共 12 次」），解析不到时退回按执行记录条数 */
  const doseCount = useMemo(() => {
    const parsed = /共\s*(\d+)\s*次/.exec(protocol.treatmentDuration);
    if (parsed) return Math.min(24, Math.max(1, Number(parsed[1])));
    return Math.max(1, sample.executionRecords.length);
  }, [protocol.treatmentDuration, sample.executionRecords.length]);

  const routeIcon = (route: string) => {
    if (route.includes('胶囊')) return <Pill className="w-4 h-4" />;
    if (route.includes('结肠镜')) return <Network className="w-4 h-4" />;
    return <Syringe className="w-4 h-4" />;
  };

  return (
    <div className="rounded-xl bg-[#0b1226] border border-[#2b4170]/60 shadow-xl overflow-hidden flex flex-col">
      {/* 详情头部 */}
      <div className="px-3.5 py-3 bg-[#101a33] border-b border-[#1e2f57]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0"
              style={{ background: `${color}1f`, border: `1px solid ${color}66`, color }}
            >
              {sample.id.replace('H-', '')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-[#eef4ff] font-mono">{sample.id}</h2>
                <span className="text-[10px] text-[#8996b8] font-mono">{sample.anonymizedMrn}</span>
                <span className="text-[10px] text-[#8996b8]">脱敏展示 · 仅保留病历编号</span>
                <Lock className="w-3 h-3 text-[#8996b8]" />
              </div>
              <p className="text-[11px] text-[#eef4ff] mt-1 truncate">{sample.diagnosisLabel}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8996b8] flex-wrap">
                <span>{sample.gender} · {sample.age} 岁 · BMI {sample.bmi}</span>
                <span>·</span>
                <span>{sample.diseaseActivityLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <OutcomeBadge outcome={sample.outcome} size="md" />
              <div className="text-[10px] text-[#8996b8] mt-1 max-w-[220px]">{sample.outcomeLabel}</div>
            </div>
            <button
              onClick={onToggleFavorite}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                favorited
                  ? 'bg-[#ffb84d]/20 text-[#ffb84d] border-[#ffb84d]/50'
                  : 'bg-[#0c1429] text-[#8996b8] border-[#2b4170]/60 hover:text-[#eef4ff]'
              }`}
            >
              <Star className="w-3.5 h-3.5" fill={favorited ? '#ffb84d' : 'none'} />
              {favorited ? '已收藏' : '收藏案例'}
            </button>
          </div>
        </div>

        {/* 结局不佳 / 不允许参考的强制提示 */}
        {badOutcome && (
          <div
            className="mt-2.5 px-3 py-2 rounded-lg border text-[11px] font-semibold flex items-center gap-2"
            style={{ background: 'rgba(255,83,108,0.14)', borderColor: 'rgba(255,83,108,0.6)', color: UI.red }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            【该相似历史样本最终{sample.outcome === 'relapse' ? '复发' : '临床无应答'}，请重点分析失败因素，作为风险借鉴】
          </div>
        )}
        {!sample.allowClinicalReference && (
          <div
            className="mt-2 px-3 py-2 rounded-lg border text-[11px] font-semibold flex items-center gap-2"
            style={{ background: 'rgba(255,184,77,0.12)', borderColor: 'rgba(255,184,77,0.55)', color: UI.amber }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            该样本已被标记为「仅作风险借鉴」：不允许将其方案参数标记为当前患者参考。
          </div>
        )}
      </div>

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#0c1429] border-b border-[#1e2f57] overflow-x-auto">
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-[#20cfff] text-[#090d18] font-bold shadow'
                  : t.core
                  ? 'text-[#20cfff] bg-[#20cfff]/10 border border-[#20cfff]/30 hover:bg-[#20cfff]/20'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        {/* ============ Tab1 基线与病情档案 ============ */}
        {tab === 'baseline' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SectionCard title="基础信息" icon={<FileText className="w-3.5 h-3.5 text-[#20cfff]" />}>
                <div className="space-y-1.5 text-[11px]">
                  {[
                    ['脱敏病历编号', sample.anonymizedMrn],
                    ['性别 / 年龄', `${sample.gender} · ${sample.age} 岁`],
                    ['BMI', `${sample.bmi} kg/m²`],
                    ['主要诊断', sample.diagnosisLabel],
                    ['疾病分期', sample.diseaseStage],
                    ['疾病活动度', sample.diseaseActivityLabel],
                    ['感染筛查', sample.infectionScreening],
                    ['数据完整度', `${sample.dataCompleteness}%`]
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-2 border-b border-[#1e2f57]/60 pb-1">
                      <span className="text-[#8996b8] shrink-0">{k}</span>
                      <span className="text-[#eef4ff] text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="关键检验指标" icon={<Activity className="w-3.5 h-3.5 text-[#20cfff]" />}
                right={<span className="text-[10px] text-[#8996b8]">{compareMode ? '当前 vs 历史' : '历史样本实测'}</span>}
              >
                <div className="space-y-2">
                  <PairBar label="CRP (mg/L)" currentValue={patientVector.crp} sampleValue={sample.clinicalMarkers.crp}
                    lowerIsBetter highlightDelta={compareMode} />
                  <PairBar label="粪便钙卫蛋白 (μg/g)" currentValue={patientVector.fecalCalprotectin}
                    sampleValue={sample.clinicalMarkers.fecalCalprotectin} lowerIsBetter highlightDelta={compareMode} />
                  <PairBar label="血清白蛋白 (g/L)" currentValue={patientVector.albumin}
                    sampleValue={sample.clinicalMarkers.albumin} highlightDelta={compareMode} />
                  <PairBar label="BMI" currentValue={patientVector.bmi} sampleValue={sample.bmi}
                    highlightDelta={compareMode} format={v => v.toFixed(1)} />
                  <div className="flex items-center justify-between text-[10px] text-[#8996b8] pt-1 border-t border-[#1e2f57]/60">
                    <span>ESR（历史）</span>
                    <span className="font-mono text-[#eef4ff]">{sample.clinicalMarkers.esr} mm/h</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8996b8]">
                    <span>前白蛋白（历史）</span>
                    <span className="font-mono text-[#eef4ff]">{sample.clinicalMarkers.prealbumin} mg/L</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="风险分层与身体状态" icon={<ShieldAlert className="w-3.5 h-3.5 text-[#ffb84d]" />}>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <RiskFlag
                    dense
                    text={`营养风险：${sample.nutritionRisk}`}
                    tone={sample.nutritionRisk === '高' ? UI.red : sample.nutritionRisk === '中等' ? UI.amber : UI.green}
                  />
                  <RiskFlag dense text={sample.immunosuppressed ? '存在免疫抑制' : '免疫正常'}
                    tone={sample.immunosuppressed ? UI.red : UI.green} />
                  <RiskFlag dense text={sample.contraindicationNote}
                    tone={sample.contraindicationNote.includes('无') ? UI.green : UI.amber} />
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <span className="text-[#8996b8] block">免疫状态：</span>
                    <span className="text-[#eef4ff]">{sample.immuneStatus}</span>
                  </div>
                  <div>
                    <span className="text-[#8996b8] block">过敏史：</span>
                    <span className="text-[#eef4ff]">{sample.allergyNote}</span>
                  </div>
                  <div>
                    <span className="text-[#8996b8] block">合并症：</span>
                    <span className="text-[#eef4ff]">{sample.comorbidities.join('、')}</span>
                  </div>
                  <div>
                    <span className="text-[#8996b8] block">手术史：</span>
                    <span className="text-[#eef4ff]">{sample.surgicalHistory.join('、')}</span>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SectionCard title="既往用药史（相似度临床维度输入）" icon={<Pill className="w-3.5 h-3.5 text-[#20cfff]" />}>
                <div className="space-y-1.5">
                  {sample.priorMedications.map(med => (
                    <div key={med} className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-[11px] text-[#eef4ff]">
                      {med}
                    </div>
                  ))}
                  <div className="text-[10px] text-[#8996b8] pt-1">
                    免疫/生物制剂暴露项数：<span className="text-[#eef4ff] font-mono">{sample.priorMedications.filter(m => /英夫利西|阿达木|维得利珠|乌司奴|硫唑嘌呤|甲氨蝶呤|环孢素|泼尼松|激素|免疫抑制剂/.test(m)).length}</span> 项
                    （当前患者 <span className="text-[#20cfff] font-mono">{patientVector.biologicExposure}</span> 项）
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="肠道微生态数字孪生快照" icon={<Sparkles className="w-3.5 h-3.5 text-[#815cff]" />}
                right={<span className="text-[10px] text-[#8996b8]">治疗前 / 治疗后</span>}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-[#0c1429] border border-[#ff536c]/30">
                    <TwinSnapshotStrip snapshot={sample.microbiome.twin.pre} caption="治疗前快照" />
                  </div>
                  <div className="p-2 rounded-lg bg-[#0c1429] border border-[#23e6b1]/30">
                    <TwinSnapshotStrip snapshot={sample.microbiome.twin.post} caption="治疗后快照" />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SimilarityScoreCard sample={sample} similarity={similarity} weights={weights} compact />
          </>
        )}

        {/* ============ Tab2 菌群画像与功能通路 ============ */}
        {tab === 'microbiome' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Shannon 多样性', value: sample.microbiome.shannonDiversity.toFixed(2), hint: '正常 4.5-5.5', tone: sample.microbiome.shannonDiversity < 3 ? UI.red : UI.green },
                { label: '菌群失衡评分', value: `${sample.microbiome.dysbiosisScore}`, hint: '越高越失衡', tone: sample.microbiome.dysbiosisScore > 70 ? UI.red : UI.amber },
                { label: '有益菌占比', value: `${sample.microbiome.beneficialRatio}%`, hint: '健康参考 >40%', tone: sample.microbiome.beneficialRatio < 20 ? UI.red : UI.green },
                { label: '条件致病菌负荷', value: `${sample.microbiome.pathogenLoad}%`, hint: '越低越好', tone: sample.microbiome.pathogenLoad > 45 ? UI.red : UI.amber },
                { label: 'FMT 适应性评分', value: `${sample.microbiome.fmtAdaptabilityScore}`, hint: '当初入库得分', tone: sample.microbiome.fmtAdaptabilityScore >= 80 ? UI.cyan : UI.amber }
              ].map(item => (
                <div key={item.label} className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-center">
                  <span className="text-[10px] text-[#8996b8] block">{item.label}</span>
                  <span className="font-mono font-bold text-base block my-0.5" style={{ color: item.tone }}>{item.value}</span>
                  <span className="text-[9px] text-[#8996b8]">{item.hint}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-[11px] text-[#8996b8]">
              <span className="text-[#20cfff] font-semibold">主导失衡特征：</span>
              {sample.microbiome.dominantFeature}
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setNetworkView('ecological')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                    networkView === 'ecological' ? 'bg-[#20cfff] text-[#090d18] font-bold' : 'text-[#8996b8] hover:text-[#eef4ff]'
                  }`}
                >
                  <Dna className="w-3.5 h-3.5" /> 菌群生态网络
                </button>
                <button
                  onClick={() => setNetworkView('multidomain')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                    networkView === 'multidomain' ? 'bg-[#815cff] text-white font-bold' : 'text-[#8996b8] hover:text-[#eef4ff]'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" /> 全景知识图谱拓扑
                </button>
              </div>
              <span className="text-[10px] text-[#8996b8] pr-1">
                {networkView === 'ecological' ? '历史患者治疗前菌群网络' : '菌种-代谢-免疫-干预靶点拓扑'}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden">
              <MicrobiomeKnowledgeGraph
                mode={networkView}
                compact
                className="h-[460px] min-h-[420px]"
                patient={patient}
                taxa={sample.microbiome.taxa}
                ecologicalLinks={sample.microbiome.ecologicalLinks}
              />
            </div>

            <SectionCard title="菌群功能通路对比（历史实测变化率）" icon={<Layers className="w-3.5 h-3.5 text-[#20cfff]" />}>
              <div className="space-y-2.5">
                {sample.microbiome.pathways.map(pw => {
                  const positive = pw.changePercentage > 0;
                  const isInflammation = /炎症|LPS|TLR4/i.test(pw.name);
                  const good = isInflammation ? !positive : positive;
                  const tone = Math.abs(pw.changePercentage) < 5 ? UI.muted : good ? UI.green : UI.red;
                  return (
                    <div key={pw.id}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#eef4ff]">{pw.name}</span>
                        <span className="font-mono font-bold flex items-center gap-0.5" style={{ color: tone }}>
                          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {positive ? '+' : ''}{pw.changePercentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#091127] overflow-hidden flex">
                        {positive ? (
                          <>
                            <div className="w-1/2" />
                            <div className="h-full rounded-r-full" style={{ width: `${Math.min(50, pw.changePercentage / 2)}%`, background: tone }} />
                          </>
                        ) : (
                          <>
                            <div className="h-full rounded-l-full ml-auto" style={{ width: `${Math.min(50, -pw.changePercentage / 2)}%`, background: tone }} />
                            <div className="w-1/2" />
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8996b8] mt-0.5 leading-relaxed">{pw.mechanism}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#1e2f57] text-[10px] text-[#8996b8] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" /> 正值为通路活性升高，负值为受抑；炎症 LPS 通路升高代表内毒素负荷加重
                </span>
                <span>KEGG / MetaCyc 注释</span>
              </div>
            </SectionCard>

            <SectionCard title="优势与失衡菌群丰度表" icon={<Dna className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<span className="text-[10px] text-[#8996b8]">mNGS 深度测序</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-[#8996b8] border-b border-[#1e2f57]">
                      <th className="pb-1.5 font-medium">菌种</th>
                      <th className="pb-1.5 font-medium">生态分类</th>
                      <th className="pb-1.5 font-medium text-right">丰度</th>
                      <th className="pb-1.5 font-medium text-right">正常参考</th>
                      <th className="pb-1.5 font-medium text-right">偏差</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2f57]/50">
                    {sample.microbiome.taxa.map(t => (
                      <tr key={t.id} className="text-[10px]">
                        <td className="py-1.5">
                          <span className="text-[#eef4ff] block">{t.chineseName}</span>
                          <span className="font-mono text-[9px] text-[#8996b8]">{t.name}</span>
                        </td>
                        <td className="py-1.5">
                          <Tag
                            text={t.category === 'beneficial' ? '有益菌' : t.category === 'pathogen' ? '致病菌' : t.category === 'opportunistic' ? '条件致病' : '中性共生'}
                            color={t.category === 'beneficial' ? UI.green : t.category === 'pathogen' ? UI.red : t.category === 'opportunistic' ? UI.amber : UI.purple}
                          />
                        </td>
                        <td className="py-1.5 text-right font-mono text-[#eef4ff]">{t.abundance}%</td>
                        <td className="py-1.5 text-right font-mono text-[#8996b8]">{t.normalRange[0]}% - {t.normalRange[1]}%</td>
                        <td className={`py-1.5 text-right font-mono font-bold ${t.relativeChange < 0 ? 'text-[#ff536c]' : 'text-[#ffb84d]'}`}>
                          {t.relativeChange > 0 ? `+${t.relativeChange}%` : `${t.relativeChange}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </>
        )}

        {/* ============ Tab3 供受体匹配记录 ============ */}
        {tab === 'matching' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SectionCard title="历史配型综合得分" icon={<GitMerge className="w-3.5 h-3.5 text-[#20cfff]" />}>
                <div className="flex items-center gap-4">
                  <ScoreGauge value={sample.donorMatch.overallScore} size={92} color={UI.cyan} label="综合匹配" />
                  <div className="text-[11px] space-y-1">
                    <div className="text-[#8996b8]">
                      供体编号：<span className="text-[#20cfff] font-mono font-bold">{sample.donorMatch.donorCode}</span>
                    </div>
                    <div className="text-[#8996b8]">
                      评级：<span className="text-[#23e6b1] font-bold">{sample.donorMatch.donorRating}</span>
                    </div>
                    <div className="text-[#8996b8]">{sample.donorMatch.donorType}</div>
                    <div className="text-[#8996b8] font-mono text-[10px]">配型日期 {sample.donorMatch.matchDate}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="六维匹配雷达" icon={<GitMerge className="w-3.5 h-3.5 text-[#20cfff]" />} className="md:col-span-2">
                <div className="flex items-center gap-4">
                  <Radar6
                    values={MATCH_DIMENSIONS.map(d => sample.donorMatch.dimensions[d.key])}
                    labels={MATCH_DIMENSIONS.map(d => d.label)}
                    size={196}
                  />
                  <div className="flex-1 space-y-1.5">
                    {MATCH_DIMENSIONS.map(d => (
                      <RatioBar
                        key={d.key}
                        label={d.label}
                        value={sample.donorMatch.dimensions[d.key]}
                        suffix=" 分"
                        tone={sample.donorMatch.dimensions[d.key] >= 85 ? UI.cyan : sample.donorMatch.dimensions[d.key] >= 70 ? UI.blue : UI.amber}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SectionCard title="匹配优势" icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#23e6b1]" />}>
                <div className="space-y-2">
                  {sample.donorMatch.advantages.map((a, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[#0c1429] border border-[#23e6b1]/30 text-[11px] text-[#eef4ff] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#23e6b1] shrink-0 mt-0.5" />
                      {a}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="潜在风险" icon={<AlertTriangle className="w-3.5 h-3.5 text-[#ffb84d]" />}>
                <div className="space-y-2">
                  {sample.donorMatch.potentialRisks.map((r, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[#0c1429] border border-[#ffb84d]/35 text-[11px] text-[#eef4ff] flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ffb84d] shrink-0 mt-0.5" />
                      {r}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-[10px] text-[#8996b8] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#20cfff]" />
              供受体匹配记录为历史样本当时的真实评估结果。当前患者的供体选择必须基于当前供体库存、菌液批次效期重新计算，不可沿用历史供体。
            </div>
          </>
        )}

        {/* ============ Tab4 历史 FMT 方案样本（核心） ============ */}
        {tab === 'protocol' && (
          <>
            {/* 版本选择 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#8996b8]">方案版本：</span>
              {sample.protocolVersions.map((v, i) => (
                <button
                  key={v.version}
                  onClick={() => setVersionIndex(i)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                    versionIndex === i
                      ? 'bg-[#20cfff] text-[#090d18] border-[#20cfff]'
                      : 'bg-[#0c1429] text-[#8996b8] border-[#2b4170]/60 hover:text-[#eef4ff]'
                  }`}
                >
                  {v.version}
                </button>
              ))}
              <span className="text-[10px] text-[#8996b8] ml-1">
                {activeVersion.author} · {activeVersion.date}
              </span>
            </div>

            {/* PlanCard */}
            <SectionCard
              title={`历史精准移植方案样本 ${activeVersion.version}`}
              icon={<ClipboardList className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold border"
                  style={
                    protocol.approvalStatus === '医生已签署'
                      ? { color: UI.green, background: 'rgba(35,230,177,0.14)', borderColor: 'rgba(35,230,177,0.45)' }
                      : { color: UI.amber, background: 'rgba(255,184,77,0.14)', borderColor: 'rgba(255,184,77,0.45)' }
                  }
                >
                  {protocol.approvalStatus}
                </span>
              }
            >
              <p className="text-[11px] text-[#8996b8] mb-3 p-2 rounded bg-[#0c1429] border border-[#2b4170]/40">
                <span className="text-[#20cfff] font-semibold">版本说明：</span>{activeVersion.summary}
              </p>

              {/* 移植路径 + 剂量频次疗程 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                  <span className="text-[10px] text-[#8996b8] block mb-1.5">移植路径</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${routeToneOf(protocol.administrationRoute)}1f`, color: routeToneOf(protocol.administrationRoute), border: `1px solid ${routeToneOf(protocol.administrationRoute)}66` }}
                    >
                      {routeIcon(protocol.administrationRoute)}
                    </div>
                    <span className="text-xs font-bold text-[#eef4ff]">{protocol.administrationRoute}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                  <span className="text-[10px] text-[#8996b8] block mb-1.5">剂量 · 频次 · 疗程</span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#8996b8]">单次剂量</span>
                      <span className="text-[#eef4ff] text-right">{protocol.recommendedDose}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#8996b8]">给药频次</span>
                      <span className="text-[#eef4ff] text-right">{protocol.frequency}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-[#8996b8]">疗程</span>
                      <span className="text-[#20cfff] font-semibold text-right">{protocol.treatmentDuration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 给药节奏 + 随访节点：给药次数直接取自方案文本，不按下标编造 */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-[#8996b8]">给药节奏可视化</span>
                  <span className="text-[#20cfff] font-mono">{doseCount} 个给药节点 · 该样本已全部完成</span>
                </div>
                <div className="flex items-center gap-[3px] flex-wrap">
                  {Array.from({ length: doseCount }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-2.5 rounded-sm"
                      style={{ background: UI.cyan }}
                      title={`第 ${i + 1} 次给药`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#8996b8] flex-wrap">
                  <span>疗程：<span className="text-[#eef4ff]">{protocol.treatmentDuration}</span></span>
                  <span className="text-[#2b4170]">|</span>
                  <span>随访覆盖 0 → {sample.followUpWeeks} 周</span>
                  <span className="text-[#2b4170]">|</span>
                  <span>{protocol.reviewMilestones.length} 个复评节点</span>
                </div>
              </div>

              {/* 肠道准备 / 联合用药 / 营养干预 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3">
                {[
                  { label: '肠道准备', value: protocol.bowelPreparation, icon: <Layers className="w-3.5 h-3.5 text-[#20cfff]" /> },
                  { label: '预处理', value: protocol.preTreatment, icon: <Syringe className="w-3.5 h-3.5 text-[#815cff]" /> },
                  { label: '联合用药', value: protocol.combinedTherapy, icon: <Pill className="w-3.5 h-3.5 text-[#ffb84d]" /> },
                  { label: '营养干预', value: protocol.nutritionalIntervention, icon: <Activity className="w-3.5 h-3.5 text-[#23e6b1]" /> }
                ].map(item => (
                  <div key={item.label} className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                    <span className="text-[10px] text-[#8996b8] flex items-center gap-1.5 mb-1">
                      {item.icon}
                      {item.label}
                    </span>
                    <p className="text-[11px] text-[#eef4ff] leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* 随访里程碑 */}
              <div className="mt-3 p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                <span className="text-[10px] text-[#8996b8] block mb-1.5">预设复评节点</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {protocol.reviewMilestones.map(m => <Tag key={m} text={m} color={UI.blue} />)}
                </div>
              </div>
            </SectionCard>

            {/* 版本演化时间线 */}
            <SectionCard title="方案版本演化时间线" icon={<GitMerge className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<span className="text-[10px] text-[#8996b8]">AI 初始 → 医生调整 → MDT 修订</span>}>
              <div className="relative pl-5">
                <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-[#2b4170]" />
                {sample.protocolVersions.map((v, i) => (
                  <div key={v.version} className="relative pb-3 last:pb-0">
                    <div
                      className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2"
                      style={{
                        background: i === versionIndex ? UI.cyan : '#0b1226',
                        borderColor: i === versionIndex ? UI.cyan : '#2b4170'
                      }}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-[#20cfff]">{v.version}</span>
                      <span className="text-[10px] text-[#8996b8] font-mono">{v.date}</span>
                      <span className="text-[10px] text-[#eef4ff]">{v.author}</span>
                    </div>
                    <p className="text-[11px] text-[#8996b8] mt-0.5">{v.summary}</p>
                    {v.changes.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {v.changes.map((c, ci) => (
                          <div
                            key={ci}
                            className="text-[10px] px-2 py-1 rounded border-l-2 text-[#eef4ff]"
                            style={{ background: 'rgba(32,207,255,0.07)', borderColor: UI.cyan }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 风险门控状态 */}
            <SectionCard
              title="当初方案的风险门控执行状态"
              icon={<ShieldAlert className="w-3.5 h-3.5 text-[#ffb84d]" />}
              right={<span className="text-[10px] text-[#8996b8]">历史状态，不可继承至当前患者</span>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sample.safetyGates.map(gate => {
                  const tone = GATE_TONE[gate.status];
                  return (
                    <div
                      key={gate.id}
                      className="p-2 rounded-lg bg-[#0c1429] border flex items-start gap-2"
                      style={{ borderColor: `${tone.color}55` }}
                    >
                      <span className="shrink-0 mt-0.5" style={{ color: tone.color }}>{tone.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-[#eef4ff]">{gate.name}</span>
                          <span className="text-[9px] font-bold" style={{ color: tone.color }}>{tone.label}</span>
                          {gate.mandatory && <Tag text="强制项" color={UI.muted} />}
                        </div>
                        <p className="text-[10px] text-[#8996b8] mt-0.5 leading-relaxed">{gate.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className="mt-3 p-2.5 rounded-lg border text-[10px] leading-relaxed"
                style={{ background: 'rgba(255,184,77,0.09)', borderColor: 'rgba(255,184,77,0.35)', color: '#ffd9a3' }}
              >
                参照该样本参数时，以上全部门控（感染排查、禁忌症、菌液有效期、知情同意、医师／MDT 审核）
                <strong className="font-bold">必须针对当前患者重新逐项执行</strong>，不得沿用历史样本的通过状态。
              </div>
            </SectionCard>

            <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 text-[10px] text-[#8996b8] flex items-center gap-1.5">
              <BookMarked className="w-3.5 h-3.5 text-[#20cfff]" />
              历史医生当时选择该方案的推荐理由，请见「MDT 纪要 & 医生备注」Tab —— 该部分对研判价值最高。
            </div>
          </>
        )}

        {/* ============ Tab5 执行与疗效全链路 ============ */}
        {tab === 'outcome' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: '最终临床结局', value: describeOutcome(sample), tone: sample.outcome === 'remission' ? UI.green : sample.outcome === 'partial' ? UI.amber : UI.red },
                { label: '随访周期', value: `${sample.followUpWeeks} 周`, tone: UI.cyan },
                { label: '终末供体定植率', value: `${sample.finalEngraftmentRate}%`, tone: sample.finalEngraftmentRate >= 60 ? UI.green : UI.amber },
                { label: '不良事件', value: `${sample.adverseEvents.length} 例${sample.adverseEvents.some(a => a.isSAE) ? '（含 SAE）' : ''}`, tone: sample.adverseEvents.some(a => a.isSAE) ? UI.red : UI.muted }
              ].map(item => (
                <div key={item.label} className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                  <span className="text-[10px] text-[#8996b8] block">{item.label}</span>
                  <span className="text-[11px] font-bold block mt-1 leading-tight" style={{ color: item.tone }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 多轨道时间轴 */}
            <SectionCard title="四轨并行疗效时间轴" icon={<Activity className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<span className="text-[10px] text-[#8996b8]">菌群 / 炎症 / 症状 / 不良事件</span>}>
              <div className="space-y-3">
                {[
                  { label: '轨道一 · 菌群多样性 (Shannon)', values: points.map(p => p.shannonDiversity), color: UI.cyan, invert: false },
                  { label: '轨道二 · 供体菌定植率 (%)', values: points.map(p => p.donorEngraftmentRate), color: UI.blue, invert: false },
                  { label: '轨道三 · 粪便钙卫蛋白 (μg/g)', values: points.map(p => p.fecalCalprotectin), color: UI.amber, invert: true },
                  { label: '轨道四 · 临床症状评分 (Mayo)', values: points.map(p => p.mayoScore), color: UI.green, invert: true }
                ].map(track => (
                  <div key={track.label}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[#8996b8]">{track.label}</span>
                      <span className="font-mono text-[#eef4ff]">
                        {track.values[0]} → {track.values[track.values.length - 1]}
                      </span>
                    </div>
                    <Sparkline values={track.values} color={track.color} invert={track.invert} height={44} labels={stageLabels} />
                  </div>
                ))}
              </div>

              {/* 各节点明细 */}
              <div className="mt-3 pt-3 border-t border-[#1e2f57] overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-[#8996b8] border-b border-[#1e2f57]">
                      <th className="pb-1.5 font-medium">随访节点</th>
                      <th className="pb-1.5 font-medium text-right">Shannon</th>
                      <th className="pb-1.5 font-medium text-right">定植率</th>
                      <th className="pb-1.5 font-medium text-right">FC</th>
                      <th className="pb-1.5 font-medium text-right">Mayo</th>
                      <th className="pb-1.5 font-medium text-right">有益菌占比</th>
                      <th className="pb-1.5 font-medium text-right">缓解率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2f57]/50">
                    {points.map(p => (
                      <tr key={p.stage} className="text-[10px]">
                        <td className="py-1.5">
                          <span className="text-[#eef4ff]">{p.label}</span>
                          <span className="text-[#8996b8] font-mono ml-1.5">{p.date}</span>
                        </td>
                        <td className="py-1.5 text-right font-mono text-[#20cfff]">{p.shannonDiversity.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-mono text-[#397cff]">{p.donorEngraftmentRate}%</td>
                        <td className="py-1.5 text-right font-mono text-[#ffb84d]">{p.fecalCalprotectin}</td>
                        <td className="py-1.5 text-right font-mono text-[#23e6b1]">{p.mayoScore}</td>
                        <td className="py-1.5 text-right font-mono text-[#eef4ff]">{p.dominantBeneficialRatio}%</td>
                        <td className="py-1.5 text-right font-mono text-[#eef4ff]">{p.symptomReliefPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* 执行记录 */}
            <SectionCard title="FMT 治疗执行记录" icon={<Syringe className="w-3.5 h-3.5 text-[#20cfff]" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-[#8996b8] border-b border-[#1e2f57]">
                      <th className="pb-1.5 font-medium">序次</th>
                      <th className="pb-1.5 font-medium">日期</th>
                      <th className="pb-1.5 font-medium">路径</th>
                      <th className="pb-1.5 font-medium">实际剂量</th>
                      <th className="pb-1.5 font-medium">耐受</th>
                      <th className="pb-1.5 font-medium">即时不良事件</th>
                      <th className="pb-1.5 font-medium">执行者</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2f57]/50">
                    {sample.executionRecords.map(r => (
                      <tr key={r.seq} className="text-[10px]">
                        <td className="py-1.5 font-mono text-[#eef4ff]">{r.seq}</td>
                        <td className="py-1.5 font-mono text-[#8996b8]">{r.date}</td>
                        <td className="py-1.5 text-[#eef4ff]">{r.route}</td>
                        <td className="py-1.5 text-[#eef4ff]">{r.actualDose}</td>
                        <td className="py-1.5 text-[#23e6b1]">{r.tolerance}</td>
                        <td className="py-1.5 text-[#8996b8]">{r.immediateAE}</td>
                        <td className="py-1.5 text-[#8996b8]">{r.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* 不良事件 */}
            <SectionCard
              title="不良事件记录"
              icon={<AlertTriangle className="w-3.5 h-3.5 text-[#ffb84d]" />}
              right={
                <span className="text-[10px] font-bold" style={{ color: sample.adverseEvents.some(a => a.isSAE) ? UI.red : UI.green }}>
                  SAE：{sample.adverseEvents.filter(a => a.isSAE).length} 例
                </span>
              }
            >
              {sample.adverseEvents.length === 0 ? (
                <p className="text-[11px] text-[#8996b8]">该样本全程未记录不良事件。</p>
              ) : (
                <div className="space-y-2">
                  {sample.adverseEvents.map(ae => {
                    const tone = ae.severity === '严重(SAE)' ? UI.red : ae.severity === '中度' ? UI.amber : UI.muted;
                    return (
                      <div key={ae.id} className="p-2.5 rounded-lg bg-[#0c1429] border flex items-start gap-2" style={{ borderColor: `${tone}55` }}>
                        <span className="shrink-0 mt-0.5" style={{ color: tone }}><AlertTriangle className="w-3.5 h-3.5" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#eef4ff]">{ae.type}</span>
                            <Tag text={ae.severity} color={tone} />
                            {ae.isSAE && <Tag text="SAE" color={UI.red} />}
                            <span className="text-[10px] text-[#8996b8] font-mono">{ae.timing}</span>
                          </div>
                          <p className="text-[10px] text-[#8996b8] mt-1 leading-relaxed">
                            <span className="text-[#eef4ff]">处理：</span>{ae.handling}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ============ Tab6 MDT 纪要 & 医生备注 ============ */}
        {tab === 'mdt' && (
          <>
            <SectionCard
              title="MDT 讨论纪要（关键决策理由）"
              icon={<Users className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<Tag text={sample.mdtDiscussed ? 'MDT 病例' : '非 MDT 病例'} color={sample.mdtDiscussed ? UI.cyan : UI.muted} />}
            >
              <div className="space-y-2">
                {sample.mdtNotes.map((note, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#0c1429] border-l-2 border border-[#2b4170]/40 text-[11px] text-[#eef4ff] leading-relaxed"
                    style={{ borderLeftColor: UI.cyan }}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="历史接诊医生备注" icon={<Stethoscope className="w-3.5 h-3.5 text-[#23e6b1]" />}>
              <div className="space-y-2">
                {sample.physicianNotes.map((note, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-[#0c1429] border-l-2 border border-[#2b4170]/40 text-[11px] text-[#eef4ff] leading-relaxed"
                    style={{ borderLeftColor: UI.green }}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="最终临床结局与案例标签" icon={<BookMarked className="w-3.5 h-3.5 text-[#20cfff]" />}>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <OutcomeBadge outcome={sample.outcome} size="md" />
                <span className="text-[11px] text-[#8996b8]">{sample.outcomeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {sample.caseTags.map(t => <Tag key={t} text={t} color={UI.purple} />)}
                {sample.typicalCase && <Tag text="典型案例（已标记）" color={UI.cyan} />}
                <Tag text={sample.libraryStatus === 'in_library' ? '已入库' : '已屏蔽'} color={sample.libraryStatus === 'in_library' ? UI.green : UI.red} />
                <Tag text={sample.allowClinicalReference ? '允许临床参考' : '仅作风险借鉴'} color={sample.allowClinicalReference ? UI.green : UI.red} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <MiniRadar3
                  values={[similarity.dimensions.clinical, similarity.dimensions.physical, similarity.dimensions.microbiome]}
                  size={96}
                  color={color}
                />
                <div className="text-[10px] text-[#8996b8] leading-relaxed">
                  该样本与当前患者综合相似度 <span className="font-mono font-bold" style={{ color }}>{similarity.overall.toFixed(1)}%</span>。
                  请结合本页 MDT 与医生备注中的决策理由，判断其经验是否可迁移至当前患者。
                </div>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {/* D 区：参考复用操作 */}
      <div className="px-3.5 py-3 bg-[#101a33] border-t border-[#1e2f57] flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10px] text-[#8996b8] flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          历史样本只读 · 仅可标记为参考，不可直接应用
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
              favorited
                ? 'bg-[#ffb84d]/20 text-[#ffb84d] border-[#ffb84d]/50'
                : 'bg-[#0c1429] text-[#8996b8] border-[#2b4170]/60 hover:text-[#eef4ff]'
            }`}
          >
            <Star className="w-3.5 h-3.5" fill={favorited ? '#ffb84d' : 'none'} />
            {favorited ? '已收藏为本案例参考' : '收藏为本案例参考'}
          </button>
          <button
            onClick={onRequestCopy}
            className="px-3.5 py-1.5 rounded-lg bg-[#20cfff] text-[#090d18] text-[11px] font-bold hover:brightness-110 shadow-[0_0_12px_rgba(32,207,255,0.3)] transition-all flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            标记为当前患者参考对象
          </button>
        </div>
      </div>
    </div>
  );
};

/* 路径配色（与 RouteTag 保持一致） */
function routeToneOf(route: string): string {
  if (route.includes('胶囊')) return UI.cyan;
  if (route.includes('结肠镜')) return UI.purple;
  if (route.includes('鼻肠管')) return UI.blue;
  if (route.includes('灌肠')) return UI.amber;
  return UI.muted;
}
