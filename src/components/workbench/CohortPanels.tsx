import React from 'react';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import {
  FLOW_TREND,
  MONTHLY_FLOW_FUNNEL,
  PATHWAY_STAGES,
  PHYSICIAN_LOAD,
  STAGE_TAT
} from '../../data/platformOps';
import { OpsPanel, Pill, RatioBar, TrendChart, OPS_INNER } from './opsUi';

/* ========================= B1 本月阶段流转漏斗 ========================= */

// 漏斗各阶段的配色。注意这组颜色既画柱也当数字文字色，
// 所以必须走令牌：原先的 #815cff 作 9–12px 文字在面板底上只有 4.03:1，不达标。
const FLOW_COLORS = [
  'var(--color-info)',
  'var(--color-accent)',
  'var(--color-accent)',
  'var(--color-violet)',
  'var(--color-ok)',
  'var(--color-ok)',
];

/**
 * 月度流转漏斗。
 *
 * 与「六阶段当期分布」是两件事：这里跟踪的是**同一批患者**在本月的顺序流转，
 * 因此数字单调递减，相邻两段相除才是真实转化率。当期分布里各阶段并存，
 * 相除得到的比率没有临床含义，故两者分开展示、不合并。
 */
export const MonthlyFlowPanel: React.FC = () => {
  const head = MONTHLY_FLOW_FUNNEL[0].count;
  const tail = MONTHLY_FLOW_FUNNEL[MONTHLY_FLOW_FUNNEL.length - 1].count;

  return (
    <OpsPanel
      title="本月阶段流转漏斗"
      icon={Activity}
      right={
        <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
          端到端完成率 {((tail / head) * 100).toFixed(1)}%
        </span>
      }
    >
      <div className="flex gap-1.5">
        {MONTHLY_FLOW_FUNNEL.map((s, i) => {
          const color = FLOW_COLORS[i] ?? 'var(--color-accent)';
          const barH = 20 + (s.count / head) * 62;
          const prev = i === 0 ? null : MONTHLY_FLOW_FUNNEL[i - 1].count;
          const conv = prev ? (s.count / prev) * 100 : 100;

          return (
            <div key={s.stage} className="flex-1 min-w-0">
              <div className="h-[88px] flex flex-col justify-end items-center">
                <span className="font-mono font-bold text-xs mb-1" style={{ color }}>
                  {s.count}
                </span>
                <div
                  className="w-full rounded-t-[3px]"
                  style={{ height: barH, background: color, opacity: 0.88 }}
                  title={s.stage}
                />
              </div>
              <div className="mt-1.5 text-center">
                <div className="text-[length:var(--fs-10)] text-ink leading-tight truncate">{s.short}</div>
                <div className="text-[length:var(--fs-9)] font-mono leading-tight mt-0.5" style={{ color }}>
                  {i === 0 ? '基准' : `${conv.toFixed(1)}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        柱间百分比为环比转化率。最大流失出现在「匹配 → 移植」段，
        与供体复筛窗口收紧有关，属可干预环节。
      </p>
    </OpsPanel>
  );
};

/* ========================= B2 各阶段平均停留时长 ========================= */

export const StageTatPanel: React.FC = () => {
  const max = 45;
  const bottleneck = STAGE_TAT.reduce(
    (worst, s) => (s.days / s.benchmark > worst.days / worst.benchmark ? s : worst),
    STAGE_TAT[0]
  );

  return (
    <OpsPanel
      title="各阶段平均停留时长"
      icon={Clock}
      right={<Pill color="var(--color-warn)">瓶颈 · {bottleneck.stage}</Pill>}
    >
      <div className="space-y-2.5">
        {STAGE_TAT.map(s => {
          const delta = ((s.days - s.benchmark) / s.benchmark) * 100;
          const over = s.days > s.benchmark;
          return (
            <RatioBar
              key={s.stage}
              label={s.stage}
              value={s.days}
              max={max}
              mark={s.benchmark}
              color="var(--color-accent)"
              overColor="var(--color-warn)"
              right={
                <span className="flex items-center gap-1.5">
                  <span className="font-mono">{s.days.toFixed(1)} 天</span>
                  <span
                    className="text-[length:var(--fs-9)] font-mono"
                    style={{ color: over ? 'var(--color-warn)' : 'var(--color-ok)' }}
                  >
                    {/* 与基准持平时不写「−0%」——负号加零读起来像缺陷，不是结论 */}
                    {Math.abs(delta) < 0.5
                      ? '持平'
                      : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(0)}%`}
                  </span>
                </span>
              }
            />
          );
        })}
      </div>

      <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        竖线为院内基准值。菌群测序超基准{' '}
        {(((bottleneck.days - bottleneck.benchmark) / bottleneck.benchmark) * 100).toFixed(0)}%
        ——受限于外送测序排期，是当前流程的主要瓶颈。
      </p>
    </OpsPanel>
  );
};

/* ======================= B3 近 12 周入组 / 结项趋势 ======================= */

export const FlowTrendPanel: React.FC = () => {
  const enrolled = FLOW_TREND.reduce((s, w) => s + w.enrolled, 0);
  const closed = FLOW_TREND.reduce((s, w) => s + w.closed, 0);
  const net = enrolled - closed;

  return (
    <OpsPanel
      title="近 12 周入组 / 结项趋势"
      icon={TrendingUp}
      right={
        <span className="text-[length:var(--fs-10)] font-mono">
          <span className="text-ink-muted">净增 </span>
          <span className={net >= 0 ? 'text-ok' : 'text-danger'}>
            {net >= 0 ? '+' : ''}
            {net} 例
          </span>
        </span>
      }
    >
      <TrendChart
        labels={FLOW_TREND.map(w => w.week)}
        series={[
          {
            key: 'enrolled',
            label: `新入组 ${enrolled}`,
            values: FLOW_TREND.map(w => w.enrolled),
            color: 'var(--color-accent)'
          },
          {
            key: 'closed',
            label: `结项 ${closed}`,
            values: FLOW_TREND.map(w => w.closed),
            color: 'var(--color-ok)'
          }
        ]}
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className={OPS_INNER}>
          <span className="text-[length:var(--fs-10)] text-ink-muted block">周均入组</span>
          <span className="font-mono font-bold text-sm text-accent">
            {(enrolled / FLOW_TREND.length).toFixed(1)}
          </span>
        </div>
        <div className={OPS_INNER}>
          <span className="text-[length:var(--fs-10)] text-ink-muted block">周均结项</span>
          <span className="font-mono font-bold text-sm text-ok">
            {(closed / FLOW_TREND.length).toFixed(1)}
          </span>
        </div>
        <div className={OPS_INNER}>
          <span className="text-[length:var(--fs-10)] text-ink-muted block">在管规模</span>
          <span className="font-mono font-bold text-sm text-ink">
            {PATHWAY_STAGES.reduce((s, x) => s + x.count, 0)}
          </span>
        </div>
      </div>

      <p className="mt-2.5 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        近四周结项数已追平入组数，队列规模趋于稳定，重心从「扩量」转向「随访质量」。
      </p>
    </OpsPanel>
  );
};

/* =========================== B4 医师负荷分布 =========================== */

export const PhysicianLoadPanel: React.FC = () => {
  const totalActive = PHYSICIAN_LOAD.reduce((s, p) => s + p.active, 0);

  return (
    <OpsPanel
      title="医师负荷分布"
      icon={Users}
      right={
        <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
          在管合计 {totalActive} 例
        </span>
      }
    >
      <div className="space-y-3">
        {PHYSICIAN_LOAD.map(p => {
          const load = p.active / p.capacity;
          const tone = load >= 0.9 ? 'var(--color-danger)' : load >= 0.75 ? 'var(--color-warn)' : 'var(--color-ok)';
          return (
            <div key={p.name}>
              <div className="flex items-center justify-between gap-2 text-[length:var(--fs-11)] mb-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-ink shrink-0">{p.name}</span>
                  <span className="text-[length:var(--fs-10)] text-ink-muted truncate">{p.role}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="font-mono" style={{ color: tone }}>
                    {p.active}/{p.capacity}
                  </span>
                  <span className="text-[length:var(--fs-9)] font-mono text-ink-muted">
                    {Math.round(load * 100)}%
                  </span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#152347] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, load * 100)}%`, background: tone }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        负荷 = 在管例数 / 可承载例数。主任医师陈建国已接近上限，
        新增入组建议向感染科与主治医师侧分流。
      </p>
    </OpsPanel>
  );
};
