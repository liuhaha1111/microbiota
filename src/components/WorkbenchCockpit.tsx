import React, { useState } from 'react';
import { Users, Clock, PieChart, Boxes, LayoutDashboard, Sparkles } from 'lucide-react';
import { ThreeGutDigitalTwin } from './ThreeGutDigitalTwin';
import { ClinicalPatient } from '../types';
import { ContextBar, SecondaryNav, SecondaryNavItem, ScreenSlotBadge } from './ui';
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

type WorkbenchTab = 'twin' | 'cohort';

/**
 * 屏 1 承载两件事，按「看什么」切分：
 *
 *   ① 数字孪生 —— 看得见**微生态**：单个受体的 3D 实时映射，3D 舱整宽。
 *   ② 患者队列 —— 看得见**队列**：六阶段当期分布、流转效率、菌源供应链。
 *
 * 边界纪律：队列概览、红线预警、风险推送等**调度依据**归启动台主屏（HomeConsole），
 * 因为那是「该把哪块屏调起来」的判断材料，不占本屏。
 * 本屏补的体系级内容刻意走「资产 / 运营 / 供给」线，不碰「某位患者异常」——
 * 那是各患者模块与主屏预警的职责，重复承载只会让三处口径互相打架。
 *
 * 三轮删减留下的边界（要恢复任何一块，先读这段）：
 *   - 第三个切面「体系运行」（引擎状态、门控吞吐、合规覆盖率、数据接入…）：
 *     与历史样本库、供受体匹配两屏重复，已删。
 *   - 数字孪生切面的「平台底座」侧栏（跨屏调度状态 + 知识图谱资产）：
 *     「跨屏调度状态」与启动台主屏的屏位调度说明条数字同源，「知识图谱资产」
 *     归屏 5 知识规则中心，已删，3D 舱收回整宽。
 *   - 「库存水位与剩余效期」面板：与「菌液批次质控」同讲批次档案、信息重叠，已删。
 * 这三块的共同病因都是**为凑版面而重复承载**，不是内容本身没价值。
 * 恢复前先确认它不在别的屏上已经存在，否则只是把同一批数字换个地方再写一遍。
 *
 * 另一个纪律：本屏所有聚合数字都从各模块的权威字段**实时派生**
 * （供体池 ← mockDonors，批次 ← mockBatches），不另存快照——抄一份就一定会漂移。
 */
const WORKBENCH_TABS: ReadonlyArray<SecondaryNavItem<WorkbenchTab>> = [
  { id: 'twin', label: '数字孪生', icon: Boxes, hint: '肠道微生态 3D 实时映射' },
  { id: 'cohort', label: '患者队列', icon: Users, hint: '全流程路径、运营效率与菌源供应链' }
];

/** 各切面右侧的一句话口径说明，避免用户误以为两处数字同源 */
const TAB_TRAILING: Record<WorkbenchTab, string> = {
  twin: '5 块屏 · 屏位固定绑定',
  cohort: `${MANAGED_COHORT_TOTAL} 例在管队列 · 真实世界数据`
};

export const WorkbenchCockpit: React.FC<WorkbenchCockpitProps> = ({ currentPatient }) => {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('twin');

  /** 可用菌源批次（已释放可使用的批次数），供上下文栏常驻展示 */
  const releasedBatches = summarizeBatches(mockBatches).released;

  return (
    <div id="workbench-cockpit-container" className="space-y-4">
      {/* 常驻上下文栏：两个切面共用，因此三项指标都取**体系级**口径。
          原先第三项是「当前孪生受体」——它只在切面一成立，切到队列后毫无意义，
          受体姓名已由切面一的画布头部承载。 */}
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

      <SecondaryNav
        items={WORKBENCH_TABS}
        active={activeTab}
        onChange={setActiveTab}
        trailing={TAB_TRAILING[activeTab]}
      />

      {/* ==================== 切面一：数字孪生（3D 舱整宽） ==================== */}
      {activeTab === 'twin' && (
        <div className="p-4 rounded-xl bg-[#101a33] border border-line/60 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#20cfff] animate-ping" />
              <h3 className="text-sm font-bold text-ink tracking-wide flex items-center gap-2">
                Gut Microbiome Digital Twin
                <span className="text-xs font-normal text-accent font-mono">
                  肠道微生态3D数字孪生舱
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>实时映射受体:</span>
              <span className="font-semibold text-ink px-2 py-0.5 rounded bg-[#151f3d] border border-line/50">
                {currentPatient.name} ({currentPatient.primaryDiagnosis.split(' ')[0]})
              </span>
            </div>
          </div>

          {/* 3D WebGL Canvas —— 保留 580px 高度以保证内部信息卡与右下角
              「实时生理参数」药丸的相对位置不变 */}
          <ThreeGutDigitalTwin className="h-[580px]" patient={currentPatient} />
        </div>
      )}

      {/* ==================== 切面二：患者队列运营 ==================== */}
      {activeTab === 'cohort' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 六阶段当期分布 */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-[#101a33] border border-line/60 shadow-lg">
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
                    className={`p-3 rounded-lg bg-[#0c1429] border ${stage.color} flex flex-col justify-between text-xs`}
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

            {/* 适应症疾病队列分布 */}
            <div className="lg:col-span-3 p-4 rounded-xl bg-[#101a33] border border-line/60 shadow-lg">
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
                    <div className="w-full h-1.5 rounded-full bg-[#0c1429] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cohort.color}`}
                        style={{ width: `${cohort.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 本月阶段流转漏斗（真正的顺序流转，才有转化率） */}
            <div className="lg:col-span-4">
              <MonthlyFlowPanel />
            </div>
          </div>

          {/* 运营效率三件套 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <StageTatPanel />
            </div>
            <div className="lg:col-span-4">
              <FlowTrendPanel />
            </div>
            <div className="lg:col-span-4">
              <PhysicianLoadPanel />
            </div>
          </div>

          {/* 菌源供应链：供体池 / 批次质控 / 筛查漏斗 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <DonorPoolPanel />
            </div>
            <div className="lg:col-span-4">
              <BatchQualityPanel />
            </div>
            <div className="lg:col-span-4">
              <DonorScreeningPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
