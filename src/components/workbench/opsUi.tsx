import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { withAlpha } from '../../utils/color';

/* ============================================================================
 * 工作台驾驶舱 · 体系运行面板的可视化原语
 *
 * 这些原语只服务屏 1 的体系级内容（面板外壳、堆叠条、环形占比、趋势线…），
 * 不承载任何业务语义。业务语义留在各 Panels 文件里。
 *
 * 配色沿用平台规范，不在原语里新造颜色：
 *   #20cfff 青蓝（主） / #397cff 蓝 / #815cff 紫 / #23e6b1 绿（正常）
 *   #ffb84d 橙（警告） / #ff536c 红（严重） / #8996b8 灰（低强度）
 * ========================================================================== */

export const OPS_PANEL = 'p-4 rounded-xl bg-[#101a33] border border-line/60 shadow-lg';
export const OPS_INNER = 'p-2.5 rounded-lg bg-[#0c1429] border border-line/50';
export const OPS_TRACK = 'bg-[#152347]';

export const OPS_TONE: Record<string, string> = {
  ok: 'var(--color-ok)',
  info: 'var(--color-accent)',
  purple: 'var(--color-violet)',
  warn: 'var(--color-warn)',
  danger: 'var(--color-danger)',
  muted: 'var(--color-ink-muted)'
};

/* ---------------------------------------------------------------- 面板外壳 */

interface OpsPanelProps {
  title: string;
  icon?: LucideIcon;
  /** 一句话说明这块讲什么，渲染在标题右侧 */
  hint?: React.ReactNode;
  /** 右上角补充区（计数、状态徽标） */
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const OpsPanel: React.FC<OpsPanelProps> = ({
  title,
  icon: Icon,
  hint,
  right,
  className = '',
  children
}) => (
  <section className={`${OPS_PANEL} flex flex-col ${className}`}>
    <header className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-line-2">
      <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
        {title}
      </h4>
      {right ?? (hint ? <span className="text-[length:var(--fs-10)] text-ink-muted">{hint}</span> : null)}
    </header>
    <div className="flex-1 min-w-0">{children}</div>
  </section>
);

/* ------------------------------------------------------------------ 指标块 */

interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  note?: React.ReactNode;
  tone?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({ label, value, unit, note, tone = 'info' }) => (
  <div className={`${OPS_INNER} min-w-0`}>
    <span className="text-[length:var(--fs-10)] text-ink-muted block leading-none truncate">{label}</span>
    <div className="mt-1.5 flex items-baseline gap-1 min-w-0">
      <span className="text-base font-bold font-mono leading-none" style={{ color: OPS_TONE[tone] }}>
        {value}
      </span>
      {unit && <span className="text-[length:var(--fs-10)] text-ink-muted">{unit}</span>}
    </div>
    {note && <div className="mt-1 text-[length:var(--fs-10)] text-ink-muted leading-tight">{note}</div>}
  </div>
);

/* ---------------------------------------------------------------- 堆叠占比条 */

export interface OpsSegment {
  key: string;
  count: number;
  color: string;
}

interface StackedBarProps {
  segments: ReadonlyArray<OpsSegment>;
  /** 显示在图例上的短名，缺省用 key */
  labelOf?: (key: string) => string;
  height?: number;
  /** 是否在图例中显示计数 */
  showCount?: boolean;
  className?: string;
}

/**
 * 水平堆叠占比条。
 *
 * 计数全为 0 时退化为空轨道，而不是渲染一条满格——否则「零供体不可用」
 * 会被画成「全部不可用」，语义正好反过来。
 */
export const StackedBar: React.FC<StackedBarProps> = ({
  segments,
  labelOf,
  height = 8,
  showCount = true,
  className = ''
}) => {
  const total = segments.reduce((s, x) => s + x.count, 0);

  return (
    <div className={className}>
      <div
        className={`w-full ${OPS_TRACK} rounded-full overflow-hidden flex`}
        style={{ height }}
      >
        {total > 0 &&
          segments
            .filter(s => s.count > 0)
            .map(s => (
              <div
                key={s.key}
                style={{ width: `${(s.count / total) * 100}%`, background: s.color }}
                title={`${labelOf ? labelOf(s.key) : s.key} ${s.count}`}
              />
            ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {segments.map(s => (
          <span key={s.key} className="flex items-center gap-1 text-[length:var(--fs-10)] text-ink-muted">
            <span
              className="w-1.5 h-1.5 rounded-sm shrink-0"
              style={{ background: s.color, opacity: s.count > 0 ? 1 : 0.35 }}
            />
            {labelOf ? labelOf(s.key) : s.key}
            {showCount && <span className="font-mono text-ink">{s.count}</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ 比例条 */

interface RatioBarProps {
  label: React.ReactNode;
  value: number;
  max: number;
  color: string;
  /** 右侧文字，缺省显示 value */
  right?: React.ReactNode;
  /** 基准线（0-max 上的刻度），用于 TAT 对标 */
  mark?: number;
  /** 超过基准时的高亮色 */
  overColor?: string;
}

export const RatioBar: React.FC<RatioBarProps> = ({
  label,
  value,
  max,
  color,
  right,
  mark,
  overColor
}) => {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const exceeded = mark !== undefined && value > mark;
  const fill = exceeded && overColor ? overColor : color;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 text-[length:var(--fs-11)] mb-1">
        <span className="text-ink truncate">{label}</span>
        <span className="font-mono text-ink-muted shrink-0">{right ?? value}</span>
      </div>
      <div className={`relative w-full h-1.5 ${OPS_TRACK} rounded-full overflow-hidden`}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fill }} />
        {mark !== undefined && mark > 0 && mark < max && (
          <div
            className="absolute top-0 bottom-0 w-px bg-[#eef4ff]/50"
            style={{ left: `${(mark / max) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- 环形占比图 */

interface DonutArcProps {
  segments: ReadonlyArray<OpsSegment>;
  size?: number;
  thickness?: number;
  centerValue?: React.ReactNode;
  centerLabel?: string;
  centerTone?: string;
}

export const DonutArc: React.FC<DonutArcProps> = ({
  segments,
  size = 88,
  thickness = 11,
  centerValue,
  centerLabel,
  centerTone = 'var(--color-ink)'
}) => {
  const total = segments.reduce((s, x) => s + x.count, 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let consumed = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#152347"
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments
            .filter(s => s.count > 0)
            .map(s => {
              const len = (s.count / total) * circumference;
              const dash = `${len} ${circumference - len}`;
              const el = (
                <circle
                  key={s.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={dash}
                  strokeDashoffset={-consumed}
                />
              );
              consumed += len;
              return el;
            })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-sm leading-none" style={{ color: centerTone }}>
          {centerValue ?? total}
        </span>
        {centerLabel && (
          <span className="text-[length:var(--fs-9)] text-ink-muted mt-1 leading-none">{centerLabel}</span>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- 双线趋势图 */

interface TrendChartProps {
  labels: ReadonlyArray<string>;
  series: ReadonlyArray<{ key: string; values: ReadonlyArray<number>; color: string; label: string }>;
  height?: number;
}

/**
 * 极简双线趋势图。
 *
 * 画布用 preserveAspectRatio="none" 自适应容器宽度，线条另加
 * non-scaling-stroke 保证描边不被横向拉伸变粗。
 * 横轴刻度**不画在 SVG 里**——非等比缩放会把 SVG 文本横向拉变形，
 * 因此刻度改用等分布的 HTML flex 行渲染。
 */
export const TrendChart: React.FC<TrendChartProps> = ({ labels, series, height = 88 }) => {
  const W = 300;
  const H = 90;
  const padX = 6;
  const padTop = 10;
  const padBottom = 6;
  const innerH = H - padTop - padBottom;
  const max = Math.max(1, ...series.flatMap(s => s.values));
  const step = labels.length > 1 ? (W - padX * 2) / (labels.length - 1) : 0;

  const toPoint = (v: number, i: number) => ({
    x: padX + i * step,
    y: padTop + innerH * (1 - v / max)
  });

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
        {series.map(s => (
          <span key={s.key} className="flex items-center gap-1 text-[length:var(--fs-10)] text-ink-muted">
            <span className="w-2.5 h-0.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto font-mono text-[length:var(--fs-10)] text-ink-muted">峰值 {max}</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full block"
        style={{ height }}
        aria-hidden="true"
      >
        {[0, 0.5, 1].map(t => (
          <line
            key={t}
            x1={padX}
            x2={W - padX}
            y1={padTop + innerH * t}
            y2={padTop + innerH * t}
            stroke="var(--color-line-2)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {series.map(s => {
          const pts = s.values.map((v, i) => toPoint(v, i));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
          const last = pts[pts.length - 1];
          return (
            <g key={s.key}>
              <path
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={1.6}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {last && <circle cx={last.x} cy={last.y} r={2.6} fill={s.color} />}
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between font-mono text-[length:var(--fs-9)] text-ink-muted">
        {labels.map((l, i) => (
          <span key={l} className={i % 2 === 0 || i === labels.length - 1 ? '' : 'invisible'}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------- 徽标 */

interface PillProps {
  children: React.ReactNode;
  color: string;
  /** 实心反白，用于最高优先级 */
  solid?: boolean;
}

export const Pill: React.FC<PillProps> = ({ children, color, solid = false }) => (
  <span
    className="px-1.5 py-0.5 rounded text-[length:var(--fs-10)] font-mono whitespace-nowrap"
    style={
      solid
        ? { background: color, color: 'var(--color-on-bright)', fontWeight: 700 }
        : { background: withAlpha(color, 13), color, border: `1px solid ${withAlpha(color, 33)}` }
    }
  >
    {children}
  </span>
);

/* ------------------------------------------------------------ 面板内空状态 */

export const OpsEmpty: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-4 text-center text-[length:var(--fs-10)] text-ink-muted">{text}</div>
);
