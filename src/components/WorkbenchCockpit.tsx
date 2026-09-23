import React, { useState } from 'react';
import {
  Users,
  Clock,
  PieChart,
  Boxes,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { ThreeGutDigitalTwin } from './ThreeGutDigitalTwin';
import { ClinicalPatient } from '../types';
import { ContextBar, SecondaryNav, SecondaryNavItem, ScreenSlotBadge } from './ui';

interface WorkbenchCockpitProps {
  currentPatient: ClinicalPatient;
}

type WorkbenchTab = 'twin' | 'cohort';

/**
 * 屏 1 只承载「看得见微生态」和「看得见队列」两件事。
 *
 * 队列概览、红线预警、风险推送等**调度依据**已上移到启动台主屏（HomeConsole）——
 * 那些内容决定"该把哪块屏调起来"，属于主屏职责，不占本屏。
 */
const WORKBENCH_TABS: ReadonlyArray<SecondaryNavItem<WorkbenchTab>> = [
  { id: 'twin', label: '数字孪生', icon: Boxes, hint: '肠道微生态 3D 实时映射' },
  { id: 'cohort', label: '患者队列', icon: Users, hint: '全流程治疗路径与适应症分布' }
];

const PATHWAY_STAGES = [
  { stage: '1. 临床评估', count: 28, percent: '14%', color: 'border-[#397cff] text-[#397cff]' },
  { stage: '2. 菌群测序', count: 19, percent: '10%', color: 'border-[#20cfff] text-[#20cfff]' },
  { stage: '3. 供体匹配', count: 14, percent: '7%', color: 'border-[#815cff] text-[#815cff]' },
  { stage: '4. FMT执行', count: 36, percent: '18%', color: 'border-[#23e6b1] text-[#23e6b1]' },
  { stage: '5. 定植随访', count: 52, percent: '26%', color: 'border-[#ffb84d] text-[#ffb84d]' },
  { stage: '6. 疗效评价', count: 48, percent: '25%', color: 'border-[#20cfff] text-[#eef4ff]' }
];

const COHORTS = [
  { name: '溃疡性结肠炎 (UC)', count: 83, share: 42, color: 'bg-[#20cfff]' },
  { name: '复发性艰难梭菌感染 (rCDI)', count: 47, share: 24, color: 'bg-[#ff536c]' },
  { name: '肠易激综合征 (IBS-D/C)', count: 35, share: 18, color: 'bg-[#815cff]' },
  { name: '克罗恩病与未定型IBD', count: 22, share: 11, color: 'bg-[#ffb84d]' },
  { name: '神经微生态队列 (ASD/PD)', count: 10, share: 5, color: 'bg-[#23e6b1]' }
];

export const WorkbenchCockpit: React.FC<WorkbenchCockpitProps> = ({ currentPatient }) => {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('twin');

  return (
    <div id="workbench-cockpit-container" className="space-y-4">
      {/* 常驻上下文栏：本屏的上下文是「孪生的是谁」+「队列在哪一段」。
          红线预警的详情已归启动台主屏，本屏不重复承载。 */}
      <ContextBar
        icon={LayoutDashboard}
        title="工作台驾驶舱"
        subtitle="肠道微生态三维孪生映射与全流程患者队列分布"
        badges={<ScreenSlotBadge slot={1} />}
        metrics={[
          { label: '在管队列', value: '197 例', tone: 'info' },
          { label: '随访监测期', value: '51%', tone: 'warn' },
          { label: '当前孪生受体', value: currentPatient.name, tone: 'default' }
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
        trailing="197 例在管队列 · 真实世界数据"
      />

      {/* ============ 切面一：数字孪生 ============ */}
      {activeTab === 'twin' && (
        <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#20cfff] animate-ping" />
              <h3 className="text-sm font-bold text-[#eef4ff] tracking-wide flex items-center gap-2">
                Gut Microbiome Digital Twin
                <span className="text-xs font-normal text-[#20cfff] font-mono">肠道微生态3D数字孪生舱</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8996b8]">
              <span>实时映射受体:</span>
              <span className="font-semibold text-[#eef4ff] px-2 py-0.5 rounded bg-[#151f3d] border border-[#2b4170]/50">
                {currentPatient.name} ({currentPatient.primaryDiagnosis.split(' ')[0]})
              </span>
            </div>
          </div>

          {/* 3D WebGL Canvas —— 独占本切面，保留原有 580px 高度以保证内部
              信息卡与右下角「实时生理参数」药丸的相对位置不变 */}
          <ThreeGutDigitalTwin className="h-[580px]" patient={currentPatient} />
        </div>
      )}

      {/* ============ 切面二：患者队列 ============ */}
      {activeTab === 'cohort' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 全流程治疗路径分布 */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#20cfff]" />
                全流程患者治疗路径分布 (Patient Pathway Distribution)
              </span>
              <span className="text-[#8996b8]">总计在管 197 例</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PATHWAY_STAGES.map(stage => (
                <div
                  key={stage.stage}
                  className={`p-3 rounded-lg bg-[#0c1429] border ${stage.color} flex flex-col justify-between text-xs`}
                >
                  <span className="text-[11px] text-[#8996b8]">{stage.stage}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-[#eef4ff]">{stage.count}</span>
                    <span className="text-[10px] text-[#8996b8]">{stage.percent}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 pt-2.5 border-t border-[#1e2f57] text-[10px] text-[#8996b8] leading-relaxed flex items-start gap-1.5">
              <Sparkles className="w-3 h-3 text-[#20cfff] shrink-0 mt-0.5" />
              <span>
                定植随访与疗效评价合计占比 51%，说明队列主体已进入移植后监测期；
                启动台主屏的红线预警即从该阶段患者中产生。
              </span>
            </p>
          </div>

          {/* 适应症疾病队列分布 */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <h4 className="text-xs font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#20cfff]" />
                适应症疾病队列分布
              </h4>
              <span className="text-[11px] text-[#8996b8]">真实世界队列</span>
            </div>

            <div className="space-y-3">
              {COHORTS.map(cohort => (
                <div key={cohort.name} className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-[#8996b8]">
                    <span className="text-[#eef4ff] font-medium">{cohort.name}</span>
                    <span className="font-mono">
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
        </div>
      )}
    </div>
  );
};
