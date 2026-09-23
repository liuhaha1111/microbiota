import React from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { SampleOutcome, TwinSnapshot } from '../../types';
import { SAMPLE_OUTCOME_META } from '../../data/historicalSamples';

/* ============================================================================
 * 历史治疗样本参考库 · 可视化原语
 * 全部沿用平台既定深色医疗科技规范：
 *   高相似 #20CFFF ／ 正常匹配 #397CFF ／ 低相似 #8996B8
 *   成功结局 #23E6B1 ／ 警告风险 #FFB84D ／ 严重风险 #FF536C ／ 辅助紫 #815CFF
 * ========================================================================== */

export const UI = {
  cyan: '#20cfff',
  blue: '#397cff',
  purple: '#815cff',
  green: '#23e6b1',
  amber: '#ffb84d',
  red: '#ff536c',
  muted: '#8996b8',
  panel: '#101a33',
  panelDeep: '#0c1429',
  line: '#2b4170'
} as const;

export function toneColor(score: number): string {
  if (score >= 80) return UI.cyan;
  if (score >= 60) return UI.blue;
  return UI.muted;
}

/* ------------------------------ 环形仪表盘 ------------------------------ */

interface ScoreGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  /** 是否展示 0-100 刻度底环 */
  showTrack?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  value,
  size = 84,
  strokeWidth = 6,
  color,
  label,
  sublabel,
  showTrack = true
}) => {
  const pct = Math.max(0, Math.min(100, value));
  const stroke = color ?? toneColor(pct);
  const r = (36 - strokeWidth) / 2 + strokeWidth / 2;

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {showTrack && (
            <circle cx="18" cy="18" r={r} fill="none" stroke="#1e2f57" strokeWidth={strokeWidth} />
          )}
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-[#eef4ff] leading-none" style={{ fontSize: size * 0.24 }}>
            {pct.toFixed(1)}
          </span>
          <span className="text-[#8996b8] leading-none mt-0.5" style={{ fontSize: size * 0.11 }}>
            %
          </span>
        </div>
      </div>
      {label && <span className="text-[10px] text-[#eef4ff] mt-1 font-medium">{label}</span>}
      {sublabel && <span className="text-[9px] text-[#8996b8]">{sublabel}</span>}
    </div>
  );
};

/* ------------------------------ 三维度迷你雷达 ------------------------------ */

interface MiniRadar3Props {
  /** [临床病情, 身体状态, 菌群微生态]，0-100 */
  values: [number, number, number];
  size?: number;
  labels?: [string, string, string];
  color?: string;
  showLabels?: boolean;
}

export const MiniRadar3: React.FC<MiniRadar3Props> = ({
  values,
  size = 96,
  labels = ['临床', '身体', '菌群'],
  color = UI.cyan,
  showLabels = true
}) => {
  const pad = showLabels ? 20 : 4;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - pad;
  // 顶点朝上，顺时针 120° 分布
  const angles = [-90, 30, 150].map(deg => (deg * Math.PI) / 180);
  const pointAt = (idx: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angles[idx]),
    y: cy + r * ratio * Math.sin(angles[idx])
  });
  const poly = (ratio: number) => angles.map((_, i) => { const p = pointAt(i, ratio); return `${p.x},${p.y}`; }).join(' ');
  const valuePoly = values
    .map((v, i) => { const p = pointAt(i, Math.max(0.04, Math.min(1, v / 100))); return `${p.x},${p.y}`; })
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.33, 0.66, 1].map(lv => (
        <polygon key={lv} points={poly(lv)} fill="none" stroke="#1e2f57" strokeWidth="1" />
      ))}
      {angles.map((_, i) => {
        const p = pointAt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e2f57" strokeWidth="1" />;
      })}
      <polygon points={valuePoly} fill={`${color}33`} stroke={color} strokeWidth="1.5" />
      {values.map((v, i) => {
        const p = pointAt(i, Math.max(0.04, Math.min(1, v / 100)));
        return <circle key={i} cx={p.x} cy={p.y} r="2.2" fill={color} />;
      })}
      {showLabels && labels.map((lb, i) => {
        const p = pointAt(i, 1.34);
        return (
          <text
            key={lb}
            x={p.x}
            y={p.y}
            fill="#8996b8"
            fontSize="8.5"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {lb}
          </text>
        );
      })}
    </svg>
  );
};

/* ------------------------------ 结局 / 路径 / 标签 ------------------------------ */

export const OutcomeBadge: React.FC<{ outcome: SampleOutcome; text?: string; size?: 'sm' | 'md' }> = ({
  outcome,
  text,
  size = 'sm'
}) => {
  const meta = SAMPLE_OUTCOME_META[outcome];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold border ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      }`}
      style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {text ?? meta.label}
    </span>
  );
};

const ROUTE_TONE: Record<string, string> = {
  肠溶胶囊: UI.cyan,
  结肠镜: UI.purple,
  鼻肠管: UI.blue,
  保留灌肠: UI.amber
};

export function routeTone(route: string): string {
  const hit = Object.keys(ROUTE_TONE).find(k => route.includes(k));
  return hit ? ROUTE_TONE[hit] : UI.muted;
}

export const RouteTag: React.FC<{ route: string }> = ({ route }) => {
  const color = routeTone(route);
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border"
      style={{ color, background: `${color}1f`, borderColor: `${color}66` }}
    >
      {route}
    </span>
  );
};

export const Tag: React.FC<{ text: string; color?: string }> = ({ text, color = UI.muted }) => (
  <span
    className="px-1.5 py-0.5 rounded text-[10px] border whitespace-nowrap"
    style={{ color, background: `${color}14`, borderColor: `${color}3d` }}
  >
    {text}
  </span>
);

/* ------------------------------ 面板容器 ------------------------------ */

interface SectionCardProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  right,
  children,
  className = '',
  bodyClassName = ''
}) => (
  <div className={`rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg ${className}`}>
    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#1e2f57]">
      <h3 className="text-xs font-semibold text-[#eef4ff] flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      {right}
    </div>
    <div className={`px-3.5 py-3 ${bodyClassName}`}>{children}</div>
  </div>
);

/* ------------------------------ 成对指标柱 ------------------------------ */

interface PairBarProps {
  label: string;
  currentValue: number;
  sampleValue: number;
  unit?: string;
  /** true 表示数值越低越好（炎症指标），false 表示越高越好（白蛋白等） */
  lowerIsBetter?: boolean;
  /** 当前患者相对历史样本的差值提示 */
  highlightDelta?: boolean;
  format?: (v: number) => string;
}

export const PairBar: React.FC<PairBarProps> = ({
  label,
  currentValue,
  sampleValue,
  unit = '',
  lowerIsBetter = false,
  highlightDelta = false,
  format
}) => {
  const fmt = format ?? ((v: number) => (Math.round(v * 10) / 10).toString());
  const max = Math.max(currentValue, sampleValue, 0.001);
  const delta = currentValue - sampleValue;
  const worse = lowerIsBetter ? delta > 0 : delta < 0;
  const diffRatio = Math.abs(delta) / Math.max(sampleValue, 0.001);
  const flagged = highlightDelta && diffRatio >= 0.25;

  return (
    <div
      className={`p-2 rounded-lg border bg-[#0c1429] ${
        flagged ? 'border-[#ffb84d]/60' : 'border-[#2b4170]/40'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] mb-1.5">
        <span className="text-[#8996b8]">{label}</span>
        <span className="flex items-center gap-1 font-mono">
          <span className="text-[#8996b8]">{fmt(sampleValue)}</span>
          <span className="text-[#2b4170]">→</span>
          <span className={flagged ? 'text-[#ffb84d] font-bold' : 'text-[#eef4ff] font-bold'}>
            {fmt(currentValue)}
          </span>
          {unit && <span className="text-[#8996b8] font-normal">{unit}</span>}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#815cff] w-8 shrink-0">历史</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
            <div className="h-full rounded-full bg-[#815cff]" style={{ width: `${(sampleValue / max) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#20cfff] w-8 shrink-0">当前</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#20cfff]"
              style={{ width: `${(currentValue / max) * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[9px]">
        {Math.abs(delta) < 0.05 ? (
          <span className="text-[#8996b8] flex items-center gap-0.5">
            <Minus className="w-2.5 h-2.5" /> 两者基本持平
          </span>
        ) : (
          <span className={`flex items-center gap-0.5 ${worse ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
            {delta > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            当前较历史 {delta > 0 ? '+' : ''}
            {fmt(delta)}
            {unit}
            {worse ? ' · 更差' : ' · 更优'}
          </span>
        )}
      </div>
    </div>
  );
};

/* ------------------------------ 微趋势折线 ------------------------------ */

interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  invert?: boolean;
  labels?: string[];
}

export const Sparkline: React.FC<SparklineProps> = ({
  values,
  color = UI.cyan,
  width = 200,
  height = 48,
  invert = false,
  labels
}) => {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const padY = 6;
  const stepX = values.length > 1 ? (width - 8) / (values.length - 1) : 0;
  const points = values.map((v, i) => {
    const ratio = (v - min) / span;
    const y = invert ? padY + ratio * (height - padY * 2) : height - padY - ratio * (height - padY * 2);
    return { x: 4 + i * stepX, y };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <path d={area} fill={`${color}1a`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
      ))}
      {labels &&
        labels.map((lb, i) => (
          <text
            key={lb}
            x={points[i]?.x ?? 0}
            y={height - 0.5}
            fill="#8996b8"
            fontSize="7.5"
            textAnchor="middle"
          >
            {lb}
          </text>
        ))}
    </svg>
  );
};

/* ------------------------------ 数字孪生快照条 ------------------------------ */

const TWIN_ITEMS: Array<{ key: keyof TwinSnapshot; label: string }> = [
  { key: 'ecologicalStability', label: '生态稳定性' },
  { key: 'dysbiosisDegree', label: '菌群失衡度' },
  { key: 'donorEngraftment', label: '供体定植度' },
  { key: 'inflammationLevel', label: '炎症水平' },
  { key: 'functionalRecovery', label: '功能恢复' }
];

export const TwinSnapshotStrip: React.FC<{ snapshot: TwinSnapshot; tone?: string; caption?: string }> = ({
  snapshot,
  tone = UI.cyan,
  caption
}) => (
  <div className="space-y-1.5">
    {caption && <span className="text-[10px] text-[#8996b8] block">{caption}</span>}
    {TWIN_ITEMS.map(item => {
      const value = snapshot[item.key];
      const isBad = item.key === 'dysbiosisDegree' || item.key === 'inflammationLevel';
      const color = isBad ? (value > 60 ? UI.red : value > 35 ? UI.amber : UI.green) : value >= 65 ? UI.green : value >= 40 ? UI.amber : UI.red;
      return (
        <div key={item.key} className="flex items-center gap-2 text-[10px]">
          <span className="text-[#8996b8] w-16 shrink-0">{item.label}</span>
          <div className="flex-1 h-1.5 rounded-full bg-[#091127] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
          </div>
          <span className="font-mono w-7 text-right" style={{ color }}>
            {value}
          </span>
        </div>
      );
    })}
    <span className="text-[9px] text-[#2b4170] block pt-0.5">数字孪生为辅助可视化，判断依据以左侧量化指标为准</span>
    <span className="hidden" style={{ color: tone }} />
  </div>
);

/* ------------------------------ 安全提示徽章 ------------------------------ */

export const RiskFlag: React.FC<{ text: string; tone?: string; dense?: boolean }> = ({
  text,
  tone = UI.amber,
  dense = false
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded border font-semibold ${
      dense ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'
    }`}
    style={{ color: tone, background: `${tone}1a`, borderColor: `${tone}66` }}
  >
    <AlertTriangle className={dense ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    {text}
  </span>
);

/* ------------------------------ 进度条（优势/风险） ------------------------------ */

export const RatioBar: React.FC<{ label: string; value: number; tone?: string; suffix?: string }> = ({
  label,
  value,
  tone = UI.cyan,
  suffix = ''
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[#8996b8]">{label}</span>
      <span className="font-mono font-bold" style={{ color: tone }}>
        {value}
        {suffix}
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-[#091127] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: tone }} />
    </div>
  </div>
);
