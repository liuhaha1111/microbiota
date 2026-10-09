import React from 'react';
import { Clock, PieChart, LayoutDashboard, Sparkles, MonitorPlay } from 'lucide-react';
import { ThreeGutDigitalTwin } from './ThreeGutDigitalTwin';
import { ClinicalPatient } from '../types';
import { ContextBar, ScreenSlotBadge } from './ui';
import { COHORTS, MANAGED_COHORT_TOTAL, PATHWAY_STAGES, summarizeBatches } from '../data/platformOps';
import { mockBatches } from '../data/mockMicroFmtData';
import {
  BatchQualityPanel,
  DonorPoolPanel,
  DonorScreeningPanel
} from './workbench/SupplyPanels';
import {
  FlowTrendPanel,
  MonthlyFlowPanel,
  PhysicianLoadPanel,
  StageTatPanel
} from './workbench/CohortPanels';

interface WorkbenchCockpitProps {
  currentPatient: ClinicalPatient;
}

/**
 * 屏 1 · 工作台驾驶舱
 *
 * 部署形态决定了本屏的版面：它挂在 **49 寸 5120×1440（32:9）带鱼屏** 上。
 * 原先「数字孪生 / 患者队列」两个互斥切面在这种画幅下是错的 —— 无论切到哪一面，
 * 另一面的信息都缺席，而 3D 舱或面板组又填不满 32:9，两侧必然留白。
 * 因此这里把两个切面**合并为单屏**：
 *
 *   ┌──────────┬────────────────────────┬──────────┐
 *   │ 左栏 5    │   3D 数字孪生舱（居中）   │ 右栏 4    │
 *   │ 患者侧     │   随视口高度自适应        │ 资源侧     │
 *   └──────────┴────────────────────────┴──────────┘
 *
 * 分栏依据是**信息归属**，不是「哪块面板更短」：
 *   左栏 = 患者侧 —— 队列结构、路径分布、流转与停留时长；
 *   右栏 = 资源侧 —— 医师负荷、供体池、菌液批次、筛查漏斗。
 * 这样横向扫一眼就知道「患者在哪一段、资源够不够」，两栏互为对照，
 * 而 3D 舱作为居中主体承载「当前受体」的实时映射。
 *
 * 断点策略：三栏只在 `3xl`（≥2200px，见 index.css 的 --breakpoint-3xl）成立。
 * 普通 16:9 屏退化为「3D 整宽 + 左右两组并排」，不会把面板挤成细条。
 *
 * 边界纪律（沿用自合并前，未变）：
 *   - 队列概览、红线预警、风险推送等**调度依据**归启动台主屏（HomeConsole），
 *     因为那是「该把哪块屏调起来」的判断材料，不占本屏。
 *   - 本屏补的体系级内容刻意走「资产 / 运营 / 供给」线，不碰「某位患者异常」——
 *     那是各患者模块与主屏预警的职责，重复承载只会让三处口径互相打架。
 *   - 已删且**不要恢复**：切面「体系运行」（与屏 5、屏 3 重复）、数字孪生切面的
 *     「平台底座」侧栏（跨屏调度与启动台同源，知识图谱资产归屏 5）、
 *     「库存水位与剩余效期」面板（与「菌液批次质控」同讲批次档案）。
 *     共同病因都是**为凑版面而重复承载**，不是内容本身没价值。
 *
 * 另一个纪律：本屏所有聚合数字都从各模块的权威字段**实时派生**
 * （供体池 ← mockDonors，批次 ← mockBatches），不另存快照——抄一份就一定会漂移。
 */

/** 全流程患者治疗路径分布 —— 六阶段当期分布（各阶段并存，相邻两段相除没有转化率含义） */
const PathwayPanel: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface border border-line/60 shadow-lg">
    <div className="flex items-center justify-between mb-3 text-xs">
      <span className="font-semibold text-ink flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-accent" />
        全流程患者治疗路径分布
      </span>
      <span className="text-ink-muted font-mono">总计 {MANAGED_COHORT_TOTAL} 例</span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {PATHWAY_STAGES.map(stage => (
        <div
          key={stage.stage}
          className={`p-3 rounded-lg bg-surface-2 border ${stage.color} flex flex-col justify-between text-xs`}
        >
          <span className="text-[length:var(--fs-11)] text-ink-muted">{stage.stage}</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono text-ink">
              {stage.count}
            </span>
            <span className="text-[length:var(--fs-10)] text-ink-muted">{stage.percent}</span>
          </div>
        </div>
      ))}
    </div>

    <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed flex items-start gap-1.5">
      <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
      <span>
        定植随访与疗效评价合计占比 51%，说明队列主体已进入移植后监测期；
        这是当期分布，各阶段并存，因此相邻两段相除没有转化率含义。
      </span>
    </p>
  </div>
);

/** 适应症疾病队列分布 */
const CohortMixPanel: React.FC = () => (
  <div className="p-4 rounded-xl bg-surface border border-line/60 shadow-lg">
    <div className="flex items-center justify-between pb-2 mb-3 border-b border-line-2">
      <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
        <PieChart className="w-3.5 h-3.5 text-accent" />
        适应症疾病队列
      </h4>
      <span className="text-[length:var(--fs-10)] text-ink-muted">真实世界</span>
    </div>

    <div className="space-y-3">
      {COHORTS.map(cohort => (
        <div key={cohort.name} className="text-xs">
          <div className="flex justify-between items-center mb-1 text-ink-muted">
            <span className="text-ink font-medium truncate">{cohort.name}</span>
            <span className="font-mono shrink-0 ml-2">
              {cohort.count}例 ({cohort.share}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${cohort.color}`}
              style={{ width: `${cohort.share}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * 3D 数字孪生舱 —— 合并后的居中主体。
 * 高度走 flex：外层给了确定高度（超宽栏的 calc(100vh-16rem)）就填满，
 * 否则由 min-h 兜底（普通屏下 3D 整宽）。
 */
const TwinStage: React.FC<{ patient: ClinicalPatient }> = ({ patient }) => (
  <div className="p-4 rounded-xl bg-surface border border-line/60 shadow-xl flex flex-col h-full">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
        <h3 className="text-sm font-bold text-ink tracking-wide flex items-center gap-2">
          Gut Microbiome Digital Twin
          <span className="text-xs font-normal text-accent font-mono">
            肠道微生态3D数字孪生舱
          </span>
        </h3>
      </div>
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <span>实时映射受体:</span>
        <span className="font-semibold text-ink px-2 py-0.5 rounded bg-tint-info border border-line/50">
          {patient.name} ({patient.primaryDiagnosis.split(' ')[0]})
        </span>
      </div>
    </div>

    {/* 3D WebGL Canvas —— 内部信息卡与右下角「实时生理参数」药丸都是绝对定位，
        因此需要一块确定高度的容器；超宽栏由父级给高，此处只保证最小高度。 */}
    <ThreeGutDigitalTwin className="flex-1 min-h-[560px]" patient={patient} />
  </div>
);

export const WorkbenchCockpit: React.FC<WorkbenchCockpitProps> = ({ currentPatient }) => {
  /** 可用菌源批次（已释放可使用的批次数），供上下文栏常驻展示 */
  const releasedBatches = summarizeBatches(mockBatches).released;

  return (
    <div id="workbench-cockpit-container" className="space-y-4">
      {/* 常驻上下文栏：合并后左右两栏共用，因此三项指标都取**体系级**口径。
          原先第三项是「当前孪生受体」——它只在孪生面成立，受体姓名已由 3D 舱头部承载。 */}
      <ContextBar
        icon={LayoutDashboard}
        title="工作台驾驶舱"
        subtitle="微生态三维孪生与全流程队列运营"
        badges={<ScreenSlotBadge slot={1} />}
        metrics={[
          { label: '在管队列', value: `${MANAGED_COHORT_TOTAL} 例`, tone: 'info' },
          { label: '随访监测期', value: '51%', tone: 'warn' },
          { label: '可用菌源', value: `${releasedBatches} 批`, tone: 'default' }
        ]}
        status={
          <>
            主治 {currentPatient.attendingPhysician}
            <br />
            风险 {currentPatient.riskLevel === 'high' ? '高危重症' : '中度活动期'}
          </>
        }
      />

      {/* ==================== 单屏三栏 ====================
          DOM 顺序刻意是「中 → 左 → 右」：普通屏下 grid-cols-1 按 DOM 顺序堆叠，
          3D 舱必须最先出现；grid-cols-2 时它跨两列占满一行，左右两组再并排。
          超宽栏由 .wb-uw-* 显式定位到第 2 列，不依赖 DOM 顺序。 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 wb-uw-grid">
        {/* ---------- 中栏：3D 数字孪生舱（居中主体） ---------- */}
        <div className="lg:col-span-2 wb-uw-center wb-uw-col">
          <TwinStage patient={currentPatient} />
        </div>

        {/* ---------- 左栏：患者侧（队列结构 · 路径 · 流转） ---------- */}
        <div className="space-y-4 wb-uw-left wb-uw-col wb-uw-scroll thin-scroll">
          <PathwayPanel />
          <CohortMixPanel />
          <MonthlyFlowPanel />
          <StageTatPanel />
          <FlowTrendPanel />
        </div>

        {/* ---------- 右栏：资源侧（医师负荷 · 菌源供应链） ---------- */}
        <div className="space-y-4 wb-uw-right wb-uw-col wb-uw-scroll thin-scroll">
          <PhysicianLoadPanel />
          <DonorPoolPanel />
          <BatchQualityPanel />
          <DonorScreeningPanel />
        </div>
      </div>

      {/* 超宽栏的分栏依据说明。只在三栏成立时出现（.wb-uw-note 覆盖 hidden）——
          普通屏下两栏是上下堆叠的，「左栏/右栏」的说法不成立，写出来只会造成误读。 */}
      <p className="hidden wb-uw-note items-center gap-1.5 text-[length:var(--fs-10)] text-ink-muted">
        <MonitorPlay className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>
          32:9 超宽布局：中央为当前受体的 3D 微生态孪生，左栏为患者侧（队列结构与流转），
          右栏为资源侧（医师负荷与菌源供应链）。两栏各自独立滚动，3D 舱高度随视口自适应。
        </span>
      </p>
    </div>
  );
};
