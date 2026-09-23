import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Dna, GitMerge, Info, Layers, Sparkles } from 'lucide-react';
import { ClinicalPatient, HistoricalSample, SimilarityFeatureVector, SimilarityResult } from '../../types';
import { getPatientDataPackage } from '../../data/mockMicroFmtData';
import { MicrobiomeKnowledgeGraph } from '../MicrobiomeKnowledgeGraph';
import {
  OutcomeBadge,
  ScoreGauge,
  SectionCard,
  Sparkline,
  Tag,
  toneColor,
  UI
} from './historyUi';

interface HistoryCompareViewProps {
  patient: ClinicalPatient;
  patientVector: SimilarityFeatureVector;
  sample: HistoricalSample;
  /** 由相似度引擎派生的样本特征向量：与打分口径完全一致，避免此处重复推导 */
  sampleVector: SimilarityFeatureVector;
  similarity: SimilarityResult;
}

/** 差异高亮阈值：相对差 ≥ 25% 即标记为需注意 */
const DIFF_THRESHOLD = 0.25;

/** 按通路名称把特征向量里的对应得分取出来（两侧共用同一套匹配规则） */
function pathwayField(v: SimilarityFeatureVector, name: string): number {
  if (/SCFA|短链脂肪酸/.test(name)) return v.scfaScore;
  if (/丁酸|Butyrate/i.test(name)) return v.butyrateScore;
  if (/胆汁酸/.test(name)) return v.bileAcidScore;
  if (/屏障|紧密连接|Claudin/i.test(name)) return v.barrierScore;
  if (/炎症|LPS|TLR4/i.test(name)) return v.inflammationPathwayScore;
  return 50;
}

interface MetricRow {
  label: string;
  unit: string;
  current: number;
  sample: number;
  lowerIsBetter: boolean;
  digits?: number;
}

interface CompareRowProps {
  row: MetricRow;
  highlight: boolean;
}

const CompareRow: React.FC<CompareRowProps> = ({ row, highlight }) => {
  const digits = row.digits ?? 1;
  const fmt = (v: number) => v.toFixed(digits);
  const max = Math.max(row.current, row.sample, 0.001);
  const delta = row.current - row.sample;
  const worse = row.lowerIsBetter ? delta > 0 : delta < 0;
  const diffRatio = Math.abs(delta) / Math.max(Math.abs(row.sample), 0.001);
  const flagged = highlight && diffRatio >= DIFF_THRESHOLD;

  return (
    <div
      className={`grid grid-cols-12 items-center gap-2 py-1.5 px-2 rounded ${flagged ? 'compare-flag' : ''}`}
      style={flagged ? { border: '1px solid rgba(255,184,77,0.6)', background: 'rgba(255,184,77,0.06)' } : undefined}
    >
      <div className="col-span-3 text-[10px] text-[#8996b8] truncate">{row.label}</div>

      <div className="col-span-4 flex items-center justify-end gap-2">
        <span className={`font-mono text-[11px] ${flagged && worse ? 'text-[#ff536c] font-bold' : 'text-[#20cfff] font-bold'}`}>
          {fmt(row.current)}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
          <div className="h-full rounded-full bg-[#20cfff] ml-auto" style={{ width: `${(row.current / max) * 100}%` }} />
        </div>
      </div>

      <div className="col-span-1 text-center text-[9px] text-[#2b4170]">vs</div>

      <div className="col-span-4 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
          <div className="h-full rounded-full bg-[#815cff]" style={{ width: `${(row.sample / max) * 100}%` }} />
        </div>
        <span className="font-mono text-[11px] text-[#815cff] font-bold">{fmt(row.sample)}</span>
      </div>

      <div className="col-span-12 text-[9px] text-[#8996b8] pl-0.5">
        {row.unit}
        {Math.abs(delta) >= 0.05 && (
          <span className={worse ? 'text-[#ff536c] ml-2' : 'text-[#23e6b1] ml-2'}>
            当前较历史 {delta > 0 ? '+' : ''}{fmt(delta)}（{worse ? '更差' : '更优'}）
          </span>
        )}
        {flagged && <span className="text-[#ffb84d] ml-2 font-semibold">差异显著</span>}
      </div>
    </div>
  );
};

/**
 * 分屏对比视图：左＝当前待诊疗患者，右＝选中的历史参考样本。
 * 左右图表类型、坐标轴口径完全一致，逐项对齐，差异自动高亮。
 */
export const HistoryCompareView: React.FC<HistoryCompareViewProps> = ({
  patient,
  patientVector,
  sample,
  sampleVector,
  similarity
}) => {
  const pkg = getPatientDataPackage(patient.id);
  const patientPoints = pkg.longitudinalPoints;
  const samplePoints = sample.longitudinalPoints;

  const metricRows: MetricRow[] = [
    { label: 'CRP', unit: 'mg/L · 越低越好', current: patientVector.crp, sample: sampleVector.crp, lowerIsBetter: true },
    { label: '粪便钙卫蛋白', unit: 'μg/g · 越低越好', current: patientVector.fecalCalprotectin, sample: sampleVector.fecalCalprotectin, lowerIsBetter: true, digits: 0 },
    { label: '血清白蛋白', unit: 'g/L · 越高越好', current: patientVector.albumin, sample: sampleVector.albumin, lowerIsBetter: false },
    { label: 'BMI', unit: 'kg/m² · 越低越好', current: patientVector.bmi, sample: sampleVector.bmi, lowerIsBetter: false },
    { label: 'Shannon 多样性', unit: '越高越好', current: patientVector.shannonDiversity, sample: sampleVector.shannonDiversity, lowerIsBetter: false, digits: 2 },
    { label: '菌群失衡评分', unit: '分 · 越低越好', current: patientVector.dysbiosisScore, sample: sampleVector.dysbiosisScore, lowerIsBetter: true, digits: 0 },
    { label: '有益菌占比', unit: '% · 越高越好', current: patientVector.beneficialRatio, sample: sampleVector.beneficialRatio, lowerIsBetter: false },
    { label: 'SCFA 合成通路', unit: '分 · 越高越好', current: patientVector.scfaScore, sample: sampleVector.scfaScore, lowerIsBetter: false, digits: 0 },
    { label: '丁酸生成通路', unit: '分 · 越高越好', current: patientVector.butyrateScore, sample: sampleVector.butyrateScore, lowerIsBetter: false, digits: 0 },
    { label: '黏膜屏障通路', unit: '分 · 越高越好', current: patientVector.barrierScore, sample: sampleVector.barrierScore, lowerIsBetter: false, digits: 0 },
    { label: '炎症 LPS 通路', unit: '分 · 越低越好', current: patientVector.inflammationPathwayScore, sample: sampleVector.inflammationPathwayScore, lowerIsBetter: true, digits: 0 },
    { label: 'FMT 适应性评分', unit: '分 · 越高越好', current: patientVector.fmtAdaptability, sample: sampleVector.fmtAdaptability, lowerIsBetter: false, digits: 0 }
  ];

  const TRACKS: Array<{ label: string; color: string; invert: boolean; get: (v: { shannonDiversity: number; donorEngraftmentRate: number; fecalCalprotectin: number; mayoScore: number }) => number }> = [
    { label: '菌群多样性 (Shannon)', color: UI.cyan, invert: false, get: p => p.shannonDiversity },
    { label: '供体菌定植率 (%)', color: UI.blue, invert: false, get: p => p.donorEngraftmentRate },
    { label: '粪便钙卫蛋白 (μg/g)', color: UI.amber, invert: true, get: p => p.fecalCalprotectin },
    { label: '临床症状评分 (Mayo)', color: UI.green, invert: true, get: p => p.mayoScore }
  ];

  const highlight = true;

  return (
    <div className="space-y-3.5">
      {/* 左右标题对齐 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#101a33] border border-[#20cfff]/45 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#20cfff]/15 border border-[#20cfff]/50 flex items-center justify-center text-[#20cfff] font-bold text-sm shrink-0">
                {patient.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#20cfff] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#20cfff]" />
                  当前待评估患者
                </div>
                <div className="text-[10px] text-[#8996b8] truncate">
                  {patient.name} · {patient.id} · {patient.gender} {patient.age}岁
                </div>
              </div>
            </div>
            <Tag text={patient.currentPhase} color={UI.cyan} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#101a33] border border-[#815cff]/45 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#815cff]/15 border border-[#815cff]/50 flex items-center justify-center text-[#815cff] font-mono font-bold text-xs shrink-0">
                {sample.id.replace('H-', '')}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#815cff] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#815cff]" />
                  历史参考样本 {sample.id}
                </div>
                <div className="text-[10px] text-[#8996b8] truncate">
                  {sample.anonymizedMrn} · {sample.gender} {sample.age}岁 · {sample.diagnosisCategory}
                </div>
              </div>
            </div>
            <OutcomeBadge outcome={sample.outcome} />
          </div>
        </div>
      </div>

      {/* 差异高亮说明 */}
      <div className="px-3 py-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 flex items-center gap-2 text-[10px] text-[#8996b8]">
        <Info className="w-3.5 h-3.5 text-[#ffb84d] shrink-0" />
        左右两侧图表口径完全一致；相对差异 ≥ 25% 的指标会以黄色弱边框标记，便于逐项对照。
      </div>

      {/* 1. 基线关键检验指标 */}
      <SectionCard title="① 基线关键检验指标对比" icon={<Activity className="w-3.5 h-3.5 text-[#20cfff]" />}
        right={<span className="text-[10px] text-[#20cfff]">左＝当前</span>}>
        <div className="grid grid-cols-12 gap-2 pb-1.5 mb-1 border-b border-[#1e2f57] text-[10px] text-[#8996b8]">
          <div className="col-span-3">指标</div>
          <div className="col-span-4 text-right">当前待评估患者</div>
          <div className="col-span-1" />
          <div className="col-span-4">历史参考样本</div>
        </div>
        <div className="divide-y divide-[#1e2f57]/40">
          {metricRows.map(row => <CompareRow key={row.label} row={row} highlight={highlight} />)}
        </div>
      </SectionCard>

      {/* 2. 菌群生态网络左右并列 */}
      <SectionCard title="② 菌群生态网络并列对比" icon={<Dna className="w-3.5 h-3.5 text-[#20cfff]" />}
        right={<span className="text-[10px] text-[#8996b8]">节点大小＝丰度，颜色＝有益／条件致病</span>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl overflow-hidden border border-[#20cfff]/35">
            <div className="px-2.5 py-1.5 bg-[#0c1429] text-[10px] text-[#20cfff] font-semibold border-b border-[#1e2f57]">
              当前患者 {patient.name} · 治疗前菌群网络
            </div>
            <MicrobiomeKnowledgeGraph
              mode="ecological"
              compact
              className="h-[340px]"
              patient={patient}
              taxa={pkg.taxa}
              ecologicalLinks={pkg.ecologicalLinks}
            />
          </div>
          <div className="rounded-xl overflow-hidden border border-[#815cff]/35">
            <div className="px-2.5 py-1.5 bg-[#0c1429] text-[10px] text-[#815cff] font-semibold border-b border-[#1e2f57]">
              历史样本 {sample.id} · 治疗前菌群网络
            </div>
            <MicrobiomeKnowledgeGraph
              mode="ecological"
              compact
              className="h-[340px]"
              patient={patient}
              taxa={sample.microbiome.taxa}
              ecologicalLinks={sample.microbiome.ecologicalLinks}
            />
          </div>
        </div>
      </SectionCard>

      {/* 3. 功能通路成对条形 + FMT 适应性评分成对仪表盘 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <SectionCard className="lg:col-span-2" title="③ 菌群功能通路成对对比" icon={<Layers className="w-3.5 h-3.5 text-[#20cfff]" />}>
          <div className="space-y-2.5">
            {sample.microbiome.pathways.map(pw => {
              // 两侧都按通路名称归一到同一口径，避免按数组下标错位对齐
              const currentScore = pathwayField(patientVector, pw.name);
              const sampleScore = pathwayField(sampleVector, pw.name);
              const isInflammation = /炎症|LPS|TLR4/i.test(pw.name);
              const currentGood = isInflammation ? currentScore < 50 : currentScore > 50;
              const diffRatio = Math.abs(currentScore - sampleScore) / Math.max(sampleScore, 1);
              const flagged = diffRatio >= DIFF_THRESHOLD;
              return (
                <div
                  key={pw.id}
                  className={`p-2 rounded-lg ${flagged ? 'compare-flag' : ''}`}
                  style={flagged ? { border: '1px solid rgba(255,184,77,0.6)', background: 'rgba(255,184,77,0.06)' } : undefined}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1.5">
                    <span className="text-[#eef4ff]">{pw.name}</span>
                    <span className="font-mono text-[#8996b8]">
                      当前 <span style={{ color: currentGood ? UI.green : UI.amber }}>{currentScore}</span>
                      {' / '}
                      历史 <span className="text-[#815cff]">{sampleScore}</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#20cfff] w-8">当前</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
                        <div className="h-full rounded-full bg-[#20cfff]" style={{ width: `${currentScore}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#815cff] w-8">历史</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
                        <div className="h-full rounded-full bg-[#815cff]" style={{ width: `${sampleScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="④ FMT 适应性评分成对" icon={<GitMerge className="w-3.5 h-3.5 text-[#20cfff]" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-[#0c1429] border border-[#20cfff]/35 flex flex-col items-center">
              <ScoreGauge value={patientVector.fmtAdaptability} size={82} color={UI.cyan} label="当前患者" sublabel="FMT 适应性" />
              <span className="text-[9px] text-[#8996b8] mt-1">失衡度 {patientVector.dysbiosisScore}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0c1429] border border-[#815cff]/35 flex flex-col items-center">
              <ScoreGauge value={sample.microbiome.fmtAdaptabilityScore} size={82} color={UI.purple} label="历史样本" sublabel="当初入库得分" />
              <span className="text-[9px] text-[#8996b8] mt-1">失衡度 {sample.microbiome.dysbiosisScore}</span>
            </div>
          </div>
          <div className="mt-2 p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-[10px] text-[#8996b8] leading-relaxed">
            适应性评分反映宿主条件与菌群缺口的匹配度，是判断历史方案是否值得参考的前置条件之一。
          </div>
        </SectionCard>
      </div>

      {/* 4. 多轨道疗效时间轴并排 */}
      <SectionCard title="⑤ 完整多轨道疗效时间轴并排对比" icon={<Activity className="w-3.5 h-3.5 text-[#20cfff]" />}
        right={<span className="text-[10px] text-[#8996b8]">左：当前患者已有随访 ／ 右：历史样本全周期</span>}>
        <div className="space-y-3">
          {TRACKS.map(track => (
            <div key={track.label} className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center">
              <div className="p-2 rounded-lg bg-[#0c1429] border border-[#20cfff]/25">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#20cfff]">{track.label}</span>
                  <span className="font-mono text-[#8996b8]">{patientPoints.length} 个节点</span>
                </div>
                <Sparkline values={patientPoints.map(track.get)} color={track.color} invert={track.invert} height={42}
                  labels={patientPoints.map(p => p.label.replace(/第\s*/, '').replace(/\s*周.*$/, 'w'))} />
              </div>
              <div className="p-2 rounded-lg bg-[#0c1429] border border-[#815cff]/25">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#815cff]">{track.label}</span>
                  <span className="font-mono text-[#8996b8]">{samplePoints.length} 个节点</span>
                </div>
                <Sparkline values={samplePoints.map(track.get)} color={track.color} invert={track.invert} height={42}
                  labels={samplePoints.map(p => p.label.replace(/第\s*/, '').replace(/\s*周.*$/, 'w'))} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 5. 自动差异小结 */}
      <SectionCard title="📊 自动差异小结" icon={<Sparkles className="w-3.5 h-3.5 text-[#815cff]" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#0c1429] border border-[#23e6b1]/35">
            <h4 className="text-[11px] font-semibold text-[#23e6b1] flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 主要相似点
            </h4>
            <ul className="space-y-1.5 text-[10px] text-[#eef4ff]">
              {similarity.matchedPoints.map(p => (
                <li key={p.label} className="leading-relaxed">
                  · <span className="font-medium">{p.label}</span>
                  <span className="text-[#8996b8] ml-1">（{p.detail}）</span>
                </li>
              ))}
              {similarity.matchedPoints.length === 0 && <li className="text-[#8996b8]">未识别到显著匹配维度。</li>}
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-[#0c1429] border border-[#ffb84d]/40">
            <h4 className="text-[11px] font-semibold text-[#ffb84d] flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> 关键差异提醒
            </h4>
            <ul className="space-y-1.5 text-[10px] text-[#eef4ff]">
              {similarity.diffPoints.map(p => (
                <li key={p.label} className="leading-relaxed">
                  · <span className="font-medium">{p.label}</span>
                  <span className="text-[#8996b8] ml-1">（{p.detail}）</span>
                </li>
              ))}
              {similarity.diffPoints.length === 0 && <li className="text-[#8996b8]">暂未发现需要特别警惕的差异项。</li>}
            </ul>
          </div>
        </div>

        <div className="mt-3 p-2.5 rounded-lg border text-[10px] leading-relaxed"
          style={{ background: 'rgba(255,184,77,0.08)', borderColor: 'rgba(255,184,77,0.35)', color: '#ffd9a3' }}>
          该小结用于防止仅凭相似度下判断。历史样本当时的结局为
          <strong className="font-bold">「{sample.outcomeLabel}」</strong>，
          其经验与教训需结合上述差异项判断是否可迁移至当前患者。
        </div>

        <span className="hidden" style={{ color: toneColor(similarity.overall) }} />
      </SectionCard>
    </div>
  );
};
