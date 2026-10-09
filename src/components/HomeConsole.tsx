import React from 'react';
import {
  Users,
  ClipboardCheck,
  GitMerge,
  Activity,
  AlertTriangle,
  TrendingUp,
  Library,
  ShieldCheck,
  ArrowRight,
  Monitor,
  LayoutDashboard
} from 'lucide-react';
import { ClinicalPatient, ModuleTab } from '../types';
import { getPatientDataPackage } from '../data/mockMicroFmtData';
import { historicalSamples } from '../data/historicalSamples';
import { SCREEN_SLOTS, SCREEN_SLOT_COUNT } from '../data/screenSlots';
import { ContextBar, ScreenSlotBadge } from './ui';

interface HomeConsoleProps {
  currentPatient: ClinicalPatient;
  /** 已投送内容并加载完成的屏位 */
  dispatched: ReadonlyArray<ModuleTab>;
  /** 点击入口卡：把模块投送至对应屏位并进入 */
  onEnter: (tab: ModuleTab) => void;
}

const KPI_CARDS = [
  { label: '今日在管患者', value: '28', note: '+3 新增', tone: 'ok', icon: Users, accent: 'var(--color-accent)' },
  { label: '待 FMT 评估', value: '12', note: '需医师核准', tone: 'warn', icon: ClipboardCheck, accent: 'var(--color-info)' },
  { label: '待供体匹配', value: '8', note: 'AI配型就绪', tone: 'info', icon: GitMerge, accent: 'var(--color-violet)' },
  { label: '移植治疗进行中', value: '36', note: '定植监测期', tone: 'muted', icon: Activity, accent: 'var(--color-ok)' },
  { label: '需风险复评', value: '5', note: '定植迟缓', tone: 'warn', icon: AlertTriangle, accent: 'var(--color-warn)' }
] as const;

const TONE_CLASS: Record<string, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  info: 'text-accent',
  muted: 'text-ink-muted'
};

/**
 * 启动台（主屏）。
 *
 * 这是 5 块屏的**初始态**——不是第 6 块屏。启动时 5 块屏都显示本页内容，
 * 点击入口卡后对应屏位才加载它的模块。
 *
 * 因此「实时监控」类内容（队列概览、红线预警、风险推送）归属本页而非工作台：
 * 它们是**调度依据**，医生在主屏看完就要决定把哪块屏调起来。
 */
export const HomeConsole: React.FC<HomeConsoleProps> = ({
  currentPatient,
  dispatched,
  onEnter
}) => {
  const dataPackage = getPatientDataPackage(currentPatient.id);
  const evaluation = dataPackage.matchEvaluation;
  const points = dataPackage.longitudinalPoints;
  const latestPoint = points[points.length - 1];
  const markers = currentPatient.clinicalMarkers;

  const referableSamples = historicalSamples.filter(s => s.allowClinicalReference).length;
  const idleCount = SCREEN_SLOT_COUNT - dispatched.length;

  /**
   * 入口卡上的量化摘要全部取自各模块的权威字段（与模块内 ContextBar 同源），
   * 保证主屏看到的数与进入模块后看到的数一致——不另存快照。
   */
  const SLOT_METRICS: Record<ModuleTab, ReadonlyArray<{ label: string; value: React.ReactNode; tone: string }>> = {
    workbench: [
      { label: '在管队列', value: '197 例', tone: 'text-accent' },
      { label: '随访监测期', value: '51%', tone: 'text-warn' }
    ],
    patient_center: [
      { label: 'FMT 适应度', value: currentPatient.adaptability.overallScore, tone: 'text-accent' },
      { label: '粪便钙卫蛋白', value: `${markers.fecalCalprotectin.value} μg/g`, tone: 'text-danger' }
    ],
    donor_matching: [
      { label: '推荐供体', value: evaluation.donorCode, tone: 'text-ink' },
      { label: '六维匹配度', value: `${evaluation.overallScore}%`, tone: 'text-ok' }
    ],
    efficacy_tracker: [
      { label: 'Shannon 多样性', value: latestPoint.shannonDiversity.toFixed(2), tone: 'text-accent' },
      { label: '供体定植率', value: `${latestPoint.donorEngraftmentRate}%`, tone: 'text-ok' }
    ],
    history_library: [
      { label: '库内样本', value: `${historicalSamples.length} 例`, tone: 'text-accent' },
      { label: '可临床参考', value: `${referableSamples} 例`, tone: 'text-ok' }
    ]
  };

  return (
    <div id="home-console" className="space-y-4">
      {/* 常驻上下文栏：红线异常是安全底线，5 块屏处于待命态时也必须先被看到 */}
      <ContextBar
        tone="danger"
        icon={AlertTriangle}
        title="红线异常预警"
        subtitle="需即刻干预 · 5 块屏待命期间先于一切调度决策"
        badges={
          <span className="px-2 py-0.5 rounded text-[length:var(--fs-10)] font-bold bg-danger/25 text-danger border border-danger/50">
            3 条待处理
          </span>
        }
        metrics={[
          { label: '红线异常', value: '3 例', tone: 'danger' },
          { label: '需风险复评', value: '5 例', tone: 'warn' },
          { label: '今日在管', value: '28 例', tone: 'info' }
        ]}
        status={
          <>
            当前受体 <span className="text-ink font-semibold">{currentPatient.name}</span>
            <br />
            主治 {currentPatient.attendingPhysician}
          </>
        }
      />

      {/* 屏位调度说明：把「各屏初始都是主屏内容」这个部署事实显式说出来。
          注意这里的计数是**全局真值**，不是本窗口自己算的 —— dispatched 经
          BroadcastChannel 跨屏同步，所以任一屏投送后，所有屏的启动台都会跟着更新。 */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-2/85 border border-line/60">
        <div className="flex items-start gap-2.5 text-[length:var(--fs-11)] leading-relaxed min-w-0">
          <Monitor className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-ink-muted">
            <span className="text-ink font-semibold">
              各屏当前均显示本启动台。
            </span>
            点击下方任一入口卡，对应模块将投送至该屏位并加载；屏位与模块为固定绑定，不占用额外屏位。
            <span className="text-accent">投送状态与受体病例在各屏之间实时联动。</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[length:var(--fs-10)] font-mono shrink-0">
          <span className="px-2 py-0.5 rounded bg-violet/20 text-violet border border-violet/40">
            跨屏联动
          </span>
          <span className="px-2 py-0.5 rounded bg-track text-ink-muted">
            待命 {idleCount} / {SCREEN_SLOT_COUNT}
          </span>
          <span
            className={`px-2 py-0.5 rounded ${
              dispatched.length > 0
                ? 'bg-ok/20 text-ok'
                : 'bg-track text-ink-muted'
            }`}
          >
            已加载 {dispatched.length} / {SCREEN_SLOT_COUNT}
          </span>
        </div>
      </div>

      {/* 核心指标带。方片加大：字号上浮后原来的 p-3.5 会让「28 / +3 新增」挤在一起，
          并且给一个最小高度，让五张卡在宽屏上等高、数值基线对齐。 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 rounded-xl bg-surface border border-line/60 shadow-lg relative overflow-hidden min-h-[8.5rem] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-ink-muted text-xs gap-2">
                <span>{card.label}</span>
                <Icon className="w-5 h-5 shrink-0" style={{ color: card.accent }} />
              </div>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-bold font-mono text-ink">{card.value}</span>
                <span className={`text-[length:var(--fs-11)] ${TONE_CLASS[card.tone]}`}>{card.note}</span>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
                style={{ background: `linear-gradient(to right, transparent, ${card.accent}, transparent)` }}
              />
            </div>
          );
        })}
      </div>

      {/* 屏位入口卡：主屏的核心动作就是「把哪块屏调起来」 */}
      <div className="p-5 rounded-xl bg-surface border border-line/60 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-line-2">
          <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <LayoutDashboard className="w-3.5 h-3.5 text-accent" />
            屏位调度 · 5 个模块屏入口
          </h4>
          <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
            屏位固定绑定 · 点击即投送
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SCREEN_SLOTS.map(slot => {
            const Icon = slot.icon;
            const isDispatched = dispatched.includes(slot.tab);

            return (
              <button
                key={slot.tab}
                id={`home-entry-slot-${slot.slot}`}
                onClick={() => onEnter(slot.tab)}
                className={`group text-left p-5 rounded-xl border transition-all flex flex-col ${
                  isDispatched
                    ? 'bg-gradient-to-b from-surface to-tint-info border-accent/45 hover:border-accent/80'
                    : 'bg-surface-2 border-line/60 hover:bg-surface hover:border-accent/50'
                } shadow-md`}
              >
                {/* 屏位编号 + 加载状态 */}
                <div className="flex items-center justify-between w-full">
                  <ScreenSlotBadge slot={slot.slot} />
                  <span
                    className={`flex items-center gap-1 text-[length:var(--fs-10)] font-mono ${
                      isDispatched ? 'text-ok' : 'text-ink-muted'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDispatched ? 'bg-ok' : 'bg-ink-muted/60 animate-pulse'
                      }`}
                    />
                    {isDispatched ? '已加载' : '待命'}
                  </span>
                </div>

                {/* 模块身份 */}
                <div className="flex items-start gap-3 mt-3.5">
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border transition-colors ${
                      isDispatched
                        ? 'bg-accent/20 border-accent/50 text-accent'
                        : 'bg-track border-line/60 text-ink-muted group-hover:text-accent'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink leading-tight">{slot.name}</div>
                    <div className="text-[length:var(--fs-10)] text-ink-muted leading-tight mt-1">{slot.sub}</div>
                  </div>
                </div>

                <p className="mt-2.5 text-[length:var(--fs-11)] text-ink-muted leading-relaxed">{slot.role}</p>

                {/* 真实数据摘要（与模块内同源） */}
                <div className="mt-3 pt-2.5 border-t border-line-2 flex items-center gap-5">
                  {SLOT_METRICS[slot.tab].map(m => (
                    <div key={m.label} className="min-w-0">
                      <span className="text-[length:var(--fs-10)] text-ink-muted block leading-none">{m.label}</span>
                      <span className={`font-mono font-bold text-xs block mt-1 ${m.tone}`}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 投送动作 */}
                <div className="mt-3 flex items-center justify-end text-[length:var(--fs-10)] text-accent font-semibold">
                  <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
                    投送至屏 {slot.slot}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 临床风险预警与再决策推送 */}
      <div className="p-5 rounded-xl bg-surface border border-line/60 shadow-lg">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-line-2">
          <h4 className="text-xs font-semibold text-danger flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            临床风险预警与再决策推送
          </h4>
          <span className="px-1.5 py-0.5 rounded text-[length:var(--fs-10)] bg-danger/20 text-danger font-bold">
            3条待处理
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          {/* 当前受体重点警报 */}
          <div className="p-3 rounded-lg bg-tint-danger border border-danger/50 text-xs shadow-md">
            <div className="flex items-center justify-between text-danger font-bold text-[length:var(--fs-11)] mb-1.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping" />
                当前受体重点警报 ({currentPatient.id})
              </span>
              <span className="text-[length:var(--fs-10)] px-1.5 py-0.2 rounded bg-danger/30 text-danger font-medium">
                高优先级
              </span>
            </div>
            <p className="text-ink text-[length:var(--fs-11)] leading-relaxed">
              <strong>{currentPatient.name}</strong>：{currentPatient.chiefComplaint}。
              微生态特征：{currentPatient.microbiomeSummary?.dominantDysbiosis || '菌群失衡明显'}。
            </p>
            <div className="mt-2.5 pt-2 border-t border-danger/25 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--fs-10)] text-ink-muted">
              <span>主治医师: <span className="text-warn font-semibold">{currentPatient.attendingPhysician}</span></span>
              <span>风险等级: <span className="text-danger font-semibold">{currentPatient.riskLevel === 'high' ? '高危重症' : '中度活动期'}</span></span>
            </div>
          </div>

          {/* 供体配型摘要 —— 点击可直达屏 3 */}
          <button
            onClick={() => onEnter('donor_matching')}
            className="group text-left p-3 rounded-lg bg-tint-neutral border border-accent/40 hover:border-accent/70 text-xs transition-colors"
          >
            <div className="flex items-center justify-between text-accent font-bold text-[length:var(--fs-11)] mb-1.5">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                供体配型摘要
              </span>
              <span className="text-ok">{currentPatient.currentPhase}</span>
            </div>
            <p className="text-ink-muted text-[length:var(--fs-11)] leading-relaxed">
              推荐供体 <span className="text-ink font-mono font-semibold">{evaluation.donorCode}</span>，
              六维综合匹配度 <span className="text-accent font-mono font-bold">{evaluation.overallScore}%</span>。
              已针对受体 {currentPatient.name} 的微生态缺损特征定制肠溶胶囊与菌液灌肠联合定植方案。
            </p>
            <div className="mt-2.5 pt-2 border-t border-accent/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[length:var(--fs-10)] text-ink-muted">
              <span>优势: <span className="text-ok">{evaluation.advantages[0] ?? '菌群互补度优异'}</span></span>
              <span className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                查看屏 3 完整方案 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* 疗效随访轨道 —— 点击可直达屏 4 */}
          <button
            onClick={() => onEnter('efficacy_tracker')}
            className="group text-left p-3 rounded-lg bg-surface border border-line/60 hover:border-ok/50 text-xs transition-colors"
          >
            <div className="flex items-center justify-between text-ok font-bold text-[length:var(--fs-11)] mb-1.5">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {currentPatient.name} 的疗效随访与重构轨道
              </span>
              <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">最新: {currentPatient.lastFollowUp}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-surface-2 border border-line/40">
                <span className="text-[length:var(--fs-10)] text-ink-muted block">粪便钙卫蛋白</span>
                <span className="font-mono font-bold text-sm text-danger">
                  {markers.fecalCalprotectin.value}
                </span>
                <span className="text-[length:var(--fs-9)] text-ink-muted">μg/g</span>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-line/40">
                <span className="text-[length:var(--fs-10)] text-ink-muted block">C-反应蛋白</span>
                <span className="font-mono font-bold text-sm text-danger">
                  {markers.crp.value}
                </span>
                <span className="text-[length:var(--fs-9)] text-ink-muted">mg/L</span>
              </div>
              <div className="p-2 rounded bg-surface-2 border border-line/40">
                <span className="text-[length:var(--fs-10)] text-ink-muted block">血沉</span>
                <span className="font-mono font-bold text-sm text-warn">
                  {markers.esr.value}
                </span>
                <span className="text-[length:var(--fs-9)] text-ink-muted">mm/h</span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-line-2 flex items-center justify-end text-[length:var(--fs-10)] text-ok">
              <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                查看屏 4 完整时序 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          {/* 历史样本库存量 —— 点击可直达屏 5 */}
          <button
            onClick={() => onEnter('history_library')}
            className="group text-left p-3 rounded-lg bg-gradient-to-r from-surface to-tint-info border border-info/40 hover:border-info/70 text-xs transition-colors"
          >
            <div className="flex items-center justify-between text-accent font-bold text-[length:var(--fs-11)] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" />
                历史治疗样本参考库存量
              </span>
              <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">只读参考</span>
            </div>
            <p className="text-ink-muted text-[length:var(--fs-11)] leading-relaxed">
              库内共 <span className="text-ink font-mono font-bold">{historicalSamples.length}</span> 例已闭环 FMT 样本，
              其中 <span className="text-ok font-mono font-bold">{referableSamples}</span> 例允许临床参考。
            </p>
            <div className="mt-2.5 pt-2 border-t border-info/20 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[length:var(--fs-10)] text-ink-muted">
              <span className="flex items-center gap-1.5 text-warn">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                相似度不等于预后保证，历史方案不得直接照搬
              </span>
              <span className="flex items-center gap-1 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                查看屏 5 <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
