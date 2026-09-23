import React, { useState } from 'react';
import {
  LineChart,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Layers,
  Activity,
  ShieldCheck,
  GitBranch
} from 'lucide-react';
import { ClinicalPatient, LongitudinalTrackPoint } from '../types';
import { getPatientDataPackage } from '../data/mockMicroFmtData';
import { AnchorNav, CollapsibleSection, ContextBar, ScreenSlotBadge } from './ui';

interface EfficacyReconstructionTrackerProps {
  patient: ClinicalPatient;
}

/**
 * 本模块是「因果链」型内容，因此**不切互斥 Tab**：
 * 四轨时序、菌群演替与再决策引擎之间存在推导关系（决策依据就画在图里），
 * 拆成互斥切面会逼用户在两页之间反复横跳，认知负荷不降反升。
 * 改用「锚点导航 + 分节折叠」：内容全部留在同一滚动容器内，只做定位与降噪。
 */
const ANCHORS = [
  { id: 'efficacy-timeline', label: '时序总览' },
  { id: 'efficacy-tracks', label: '四轨监测' },
  { id: 'efficacy-succession', label: '菌群演替' },
  { id: 'efficacy-metabolism', label: '代谢功能' },
  { id: 'efficacy-redecision', label: '再决策引擎' },
  { id: 'efficacy-safety', label: '安全日志' }
];

export const EfficacyReconstructionTracker: React.FC<EfficacyReconstructionTrackerProps> = ({ patient }) => {
  const patientPackage = getPatientDataPackage(patient.id);
  const points: LongitudinalTrackPoint[] = patientPackage.longitudinalPoints;

  // 默认选中与患者当前阶段匹配的时序点
  const getDefaultStage = () => {
    if (patient.currentPhase === '评估期待') return 0;
    if (patient.currentPhase === '菌群检测完成') return 1;
    if (patient.currentPhase === '供体已匹配') return 1;
    if (patient.currentPhase === '移植执行期') return 2;
    return Math.min(3, points.length - 1);
  };

  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(getDefaultStage());

  React.useEffect(() => {
    setSelectedStageIndex(getDefaultStage());
  }, [patient.id]);

  const activePoint: LongitudinalTrackPoint = points[selectedStageIndex] || points[0];
  const baselinePoint: LongitudinalTrackPoint = points[0];

  // 临床应答状态由当前所选时序点推导，避免徽章写死后与 Mayo 评分自相矛盾
  const clinicalResponse = (() => {
    const mayo = activePoint.mayoScore;
    if (mayo <= 1) return { label: '深度临床缓解', tone: 'ok' as const };
    if (mayo <= 2) return { label: '临床缓解', tone: 'ok' as const };
    if (mayo <= 5) return { label: '部分应答改善', tone: 'warn' as const };
    return { label: '活动期 / 未缓解', tone: 'bad' as const };
  })();

  const isSteadyState = clinicalResponse.tone === 'ok' && activePoint.donorEngraftmentRate >= 60;

  // 对比条四段全部取自实测字段，并按当期四项之和归一化。
  // 只表达"当期四项应答信号之间的相对构成"，不是门/属真实丰度——
  // 原实现用 `40 - idx * 3` 这类按下标编造的数值，与数据无关。
  const stageRows = points.map(pt => {
    const beneficial = Math.max(0, pt.dominantBeneficialRatio);
    const engraftment = Math.max(0, pt.donorEngraftmentRate);
    const relief = Math.max(0, pt.symptomReliefPercentage);
    const inflammation = Math.min(100, (pt.fecalCalprotectin / 700) * 100);
    const sum = beneficial + engraftment + relief + inflammation || 1;
    return {
      pt,
      raw: { beneficial, engraftment, relief, inflammation },
      share: {
        beneficial: (beneficial / sum) * 100,
        engraftment: (engraftment / sum) * 100,
        relief: (relief / sum) * 100,
        inflammation: (inflammation / sum) * 100
      }
    };
  });

  return (
    <div id="efficacy-reconstruction-tracker" className="space-y-4">
      {/* 吸附栈：常驻上下文栏 + 页内锚点导航，保证长页滚动时上下文与定位都可达 */}
      <div id="efficacy-sticky-stack" className="sticky top-0 z-20 space-y-2 pb-2 bg-[#0a1020]/95 backdrop-blur-sm">
        <ContextBar
          sticky={false}
          icon={LineChart}
          title={`${patient.name} · FMT 疗效与菌群重构监测`}
          subtitle={`追踪微生态重塑是否早于并驱动临床黏膜愈合 · 当前时序点 ${activePoint.label}（${activePoint.date}）`}
          badges={
            <>
              <ScreenSlotBadge slot={4} />
              <span
                className={`px-2.5 py-0.5 rounded-md border font-semibold text-xs flex items-center gap-1 ${
                  clinicalResponse.tone === 'ok'
                    ? 'bg-[#23e6b1]/15 text-[#23e6b1] border-[#23e6b1]/30'
                    : clinicalResponse.tone === 'warn'
                    ? 'bg-[#ffb84d]/15 text-[#ffb84d] border-[#ffb84d]/30'
                    : 'bg-[#ff536c]/15 text-[#ff536c] border-[#ff536c]/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {clinicalResponse.label}
              </span>
            </>
          }
          metrics={[
            { label: 'Shannon 多样性', value: activePoint.shannonDiversity.toFixed(2), tone: 'info' },
            { label: '供体菌定植率', value: `${activePoint.donorEngraftmentRate}%`, tone: 'info' },
            { label: '粪便钙卫蛋白', value: `${activePoint.fecalCalprotectin} μg/g`, tone: 'warn' },
            { label: 'Mayo 评分', value: `${activePoint.mayoScore} / 12`, tone: 'ok' }
          ]}
          status={
            <>
              基线 {baselinePoint.label}
              <br />
              供体 {patient.recommendedDonorCode || 'D-0102'}
            </>
          }
        />

        <AnchorNav
          items={ANCHORS}
          scrollRootId="app-scroll-root"
          stickyId="efficacy-sticky-stack"
          trailing="本页为因果链内容，不切互斥切面；低优先级分节默认收起"
        />
      </div>

      {/* 1. 时序总览 */}
      <CollapsibleSection
        id="efficacy-timeline"
        title="纵向随访时序总览"
        icon={LineChart}
        hint="点击任一节点切换全页指标口径"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {points.map((pt, idx) => {
            const isSelected = selectedStageIndex === idx;
            const isPast = idx <= selectedStageIndex;

            return (
              <div
                key={pt.stage}
                onClick={() => setSelectedStageIndex(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-all border text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.3)]'
                    : isPast
                    ? 'bg-[#0c1429] border-[#2b4170]/70 hover:bg-[#101a33]'
                    : 'bg-[#080d1c] border-[#1e2f57]/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#eef4ff] text-xs">{pt.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-[#20cfff]' : isPast ? 'bg-[#23e6b1]' : 'bg-[#8996b8]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-[#8996b8] font-mono">{pt.date}</span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#1e2f57]/80 flex justify-between items-baseline text-[10px]">
                  <span className="text-[#8996b8]">定植率:</span>
                  <span className="font-mono font-bold text-[#20cfff]">{pt.donorEngraftmentRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* 2. 四轨监测 */}
      <CollapsibleSection
        id="efficacy-tracks"
        title="四条核心监测轨道"
        icon={Activity}
        hint="菌群多样性 · 供体菌定植率 · 炎症负荷 · 临床症状评分"
        right={
          <span className="text-[10px] text-[#8996b8] font-mono">
            对比基线 {baselinePoint.label}
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 轨道一：Shannon Diversity */}
          <div className="p-3.5 rounded-xl bg-[#0c1429] border border-[#2b4170]/60">
            <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
              <span>轨道一: 菌群多样性 (Shannon)</span>
              <span className="text-[10px] text-[#23e6b1] flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +
                {Math.max(
                  0,
                  Math.round(
                    ((activePoint.shannonDiversity - baselinePoint.shannonDiversity) /
                      Math.max(0.1, baselinePoint.shannonDiversity)) *
                      100
                  )
                )}
                %
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#eef4ff]">
                {activePoint.shannonDiversity.toFixed(2)}
              </span>
              <span className="text-xs text-[#8996b8]">
                基线: {baselinePoint.shannonDiversity.toFixed(2)} ➔ 目标: 4.5+
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#397cff] to-[#20cfff]"
                style={{ width: `${(activePoint.shannonDiversity / 5.0) * 100}%` }}
              />
            </div>
          </div>

          {/* 轨道二：Donor Engraftment Rate */}
          <div className="p-3.5 rounded-xl bg-[#0c1429] border border-[#2b4170]/60">
            <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
              <span>轨道二: 供体菌定植率 (Engraftment)</span>
              <span className="text-[10px] text-[#20cfff]">
                供体 {patient.recommendedDonorCode || 'D-0102'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#20cfff]">
                {activePoint.donorEngraftmentRate}%
              </span>
              <span className="text-xs text-[#23e6b1]">
                {activePoint.donorEngraftmentRate > 60
                  ? '稳态高效定植'
                  : activePoint.donorEngraftmentRate > 20
                  ? '定植建立中'
                  : '初期观察'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#20cfff]"
                style={{ width: `${activePoint.donorEngraftmentRate}%` }}
              />
            </div>
          </div>

          {/* 轨道三：Fecal Calprotectin */}
          <div className="p-3.5 rounded-xl bg-[#0c1429] border border-[#2b4170]/60">
            <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
              <span>轨道三: 粪便钙卫蛋白 (FC)</span>
              <span className="text-[10px] text-[#23e6b1] flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3" />{' '}
                {baselinePoint.fecalCalprotectin > activePoint.fecalCalprotectin
                  ? `-${Math.round(
                      ((baselinePoint.fecalCalprotectin - activePoint.fecalCalprotectin) /
                        baselinePoint.fecalCalprotectin) *
                        100
                    )}% 下降`
                  : '基线水平'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#ffb84d]">
                {activePoint.fecalCalprotectin}{' '}
                <span className="text-xs text-[#8996b8] font-normal">μg/g</span>
              </span>
              <span className="text-xs text-[#8996b8]">基线: {baselinePoint.fecalCalprotectin} μg/g</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#ffb84d]"
                style={{
                  width: `${Math.min(
                    100,
                    (activePoint.fecalCalprotectin /
                      Math.max(100, baselinePoint.fecalCalprotectin * 1.1)) *
                      100
                  )}%`
                }}
              />
            </div>
          </div>

          {/* 轨道四：Clinical Score */}
          <div className="p-3.5 rounded-xl bg-[#0c1429] border border-[#2b4170]/60">
            <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
              <span>轨道四: 临床症状评分 (Mayo/CDAI)</span>
              <span className="text-[10px] text-[#23e6b1]">
                {activePoint.mayoScore <= 2
                  ? '深度临床缓解'
                  : activePoint.mayoScore <= 5
                  ? '部分应答改善'
                  : '活动期监测'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-[#23e6b1]">
                {activePoint.mayoScore} <span className="text-xs text-[#8996b8] font-normal">/ 12分</span>
              </span>
              <span className="text-xs text-[#23e6b1]">基线: {baselinePoint.mayoScore} 分</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#23e6b1]"
                style={{ width: `${(activePoint.mayoScore / 12) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 3. 菌群重构演替 */}
      <CollapsibleSection
        id="efficacy-succession"
        title="菌群重构演替与临床应答指标对比"
        icon={BarChart3}
        hint="四段为实测值相对构成（按当期归一化）"
      >
        <div className="space-y-3">
          {stageRows.map(({ pt, raw, share }, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-[#8996b8]">
                <span
                  className={`font-medium ${
                    idx === selectedStageIndex ? 'text-[#20cfff] font-bold' : 'text-[#eef4ff]'
                  }`}
                >
                  {pt.label}
                </span>
                <span className="font-mono text-[10px]">
                  有益菌 {raw.beneficial}% · 定植 {raw.engraftment}% · 缓解 {raw.relief}% · FC{' '}
                  {pt.fecalCalprotectin} μg/g
                </span>
              </div>

              {/* Multi-segment stacked bar */}
              <div className="w-full h-3 rounded bg-[#0c1429] flex overflow-hidden border border-[#1e2f57]/50">
                <div
                  className="h-full bg-[#20cfff] transition-all"
                  style={{ width: `${share.beneficial}%` }}
                  title={`有益菌占比: ${raw.beneficial}%`}
                />
                <div
                  className="h-full bg-[#397cff] transition-all"
                  style={{ width: `${share.engraftment}%` }}
                  title={`供体菌定植率: ${raw.engraftment}%`}
                />
                <div
                  className="h-full bg-[#23e6b1] transition-all"
                  style={{ width: `${share.relief}%` }}
                  title={`症状缓解率: ${raw.relief}%`}
                />
                <div
                  className="h-full bg-[#ff536c] transition-all"
                  style={{ width: `${share.inflammation}%` }}
                  title={`炎症负荷: FC ${pt.fecalCalprotectin} μg/g（按 700 μg/g 归一化 = ${raw.inflammation.toFixed(1)}%）`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-2.5 border-t border-[#1e2f57] flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-[#8996b8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#20cfff]" /> 有益菌占比
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#397cff]" /> 供体菌定植率
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#23e6b1]" /> 症状缓解率
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#ff536c]" /> 炎症负荷 (FC 归一化)
          </span>
        </div>
      </CollapsibleSection>

      {/* 4. 代谢功能恢复（低优先级，默认收起） */}
      <CollapsibleSection
        id="efficacy-metabolism"
        title="微生态功能恢复与炎症下调趋势"
        icon={Layers}
        hint="SCFA · 胆汁酸 · 黏膜屏障 · LPS 通路"
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
            <span className="text-[#8996b8] text-[10px] block">SCFA短链脂肪酸合成</span>
            <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+160%</span>
            <span className="text-[10px] text-[#8996b8]">结肠上皮供能恢复</span>
          </div>

          <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
            <span className="text-[#8996b8] text-[10px] block">次级胆汁酸生成</span>
            <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+138%</span>
            <span className="text-[10px] text-[#8996b8]">定植抗力重建</span>
          </div>

          <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
            <span className="text-[#8996b8] text-[10px] block">黏膜物理屏障</span>
            <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+114%</span>
            <span className="text-[10px] text-[#8996b8]">Claudin-1紧密连接</span>
          </div>

          <div className="p-2.5 rounded bg-[#241121]/40 border border-[#ff536c]/40 text-center">
            <span className="text-[#ff536c] text-[10px] block font-semibold">炎症相关LPS通路</span>
            <span className="font-mono font-bold text-sm text-[#ff536c] block my-1">-72%</span>
            <span className="text-[10px] text-[#ff536c]">内毒素负荷消退</span>
          </div>
        </div>
      </CollapsibleSection>

      {/* 5. 临床再决策引擎 */}
      <CollapsibleSection
        id="efficacy-redecision"
        title="临床再决策引擎 (Re-Decision)"
        icon={GitBranch}
        hint="基于定植率、FC 变化与排便频率自动推演下一步干预路径"
        right={
          <span
            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isSteadyState ? 'bg-[#23e6b1]/20 text-[#23e6b1]' : 'bg-[#ffb84d]/20 text-[#ffb84d]'
            }`}
          >
            {isSteadyState ? '稳态达标' : '仍在疗程内'}
          </span>
        }
      >
        <div className="space-y-2">
          {/* Option 1: Continue Maintenance Follow-up — 仅在达到稳态时才作为推荐项高亮 */}
          <div
            className={`p-3 rounded-lg border ${
              isSteadyState
                ? 'bg-[#0c1e38] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.2)]'
                : 'bg-[#0c1429] border-[#2b4170]/40'
            }`}
          >
            <div
              className={`flex items-center justify-between font-bold text-xs mb-1 ${
                isSteadyState ? 'text-[#20cfff]' : 'text-[#8996b8]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isSteadyState ? 'text-[#23e6b1]' : 'text-[#8996b8]'}`} />
                决策建议 A：维持定期随访与益生元巩固
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isSteadyState ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'bg-[#152347] text-[#8996b8]'
                }`}
              >
                {isSteadyState ? '推荐' : '待达标后启用'}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isSteadyState ? 'text-[#eef4ff]' : 'text-[#8996b8]'}`}>
              患者 {patient.name} 当前所选时段 ({activePoint.label})，定植率达到{' '}
              {activePoint.donorEngraftmentRate}%，FC 为 {activePoint.fecalCalprotectin} μg/g (基线{' '}
              {baselinePoint.fecalCalprotectin} μg/g)，多样性指数{' '}
              {activePoint.shannonDiversity.toFixed(2)}，Mayo {activePoint.mayoScore} 分。
              {isSteadyState
                ? '建议结合供体菌群特征维持口服高纤维营养定植方案与定期随访。'
                : '尚未达到稳态标准（需 Mayo ≤ 2 且定植率 ≥ 60%），建议继续当前疗程并按计划复评。'}
            </p>
          </div>

          {/* Option 2: Booster FMT trigger rules */}
          <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 opacity-80">
            <div className="flex items-center justify-between text-[#8996b8] font-semibold text-[11px] mb-0.5">
              <span>决策触发 B：追加单剂强化 FMT 规则门槛</span>
              <span className="text-[10px] text-[#8996b8]">未触发</span>
            </div>
            <p className="text-[10px] text-[#8996b8]">
              触发条件：随访期定植率连续2次下降 &gt;15%，或 FC 再次反弹超过 250 μg/g。
            </p>
          </div>

          {/* Option 3: Non-microbial exploration */}
          <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 opacity-80">
            <div className="flex items-center justify-between text-[#8996b8] font-semibold text-[11px] mb-0.5">
              <span>决策提示 C：排查非菌群驱动因素</span>
              <span className="text-[10px] text-[#8996b8]">未触发</span>
            </div>
            <p className="text-[10px] text-[#8996b8]">
              若菌群重构达标但腹痛无缓解，提示评估肠易激内脏敏感或纤维狭窄等非微生态因素。
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* 6. 安全日志（低优先级，默认收起） */}
      <CollapsibleSection
        id="efficacy-safety"
        title="不良事件与患者耐受性记录 (Safety Log)"
        icon={ShieldCheck}
        right={<span className="text-[#23e6b1] text-[10px] font-bold">无严重不良事件 (SAE: 0)</span>}
        defaultOpen={false}
      >
        <div className="space-y-1.5 text-[11px]">
          <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
            <div>
              <span className="font-medium text-[#eef4ff]">轻微腹胀 (排气增多)</span>
              <span className="text-[10px] text-[#8996b8] block">FMT #1 次日出现，持续18小时自行消退</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/15 text-[#23e6b1]">
              轻度 / 已缓解
            </span>
          </div>

          <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
            <div>
              <span className="font-medium text-[#eef4ff]">一过性低热 (37.4°C)</span>
              <span className="text-[10px] text-[#8996b8] block">多饮水后正常，血培养阴性</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/15 text-[#23e6b1]">
              轻度 / 已恢复
            </span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
