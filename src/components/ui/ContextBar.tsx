import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ContextTone = 'default' | 'ok' | 'warn' | 'danger' | 'info';

export interface ContextMetric {
  label: string;
  value: React.ReactNode;
  tone?: ContextTone;
}

interface ContextBarProps {
  icon?: LucideIcon;
  /** 主标识：患者姓名 / 样本编号 / 模块对象 */
  title: React.ReactNode;
  /** 副标识：性别年龄病历号、诊断等 */
  subtitle?: React.ReactNode;
  /** 标题行内徽章（分期、风险等级、当前阶段） */
  badges?: React.ReactNode;
  /** 关键量化指标，常驻可见 */
  metrics?: ReadonlyArray<ContextMetric>;
  /** 右侧状态区 */
  status?: React.ReactNode;
  /** danger 用于红线预警等安全底线信息 */
  tone?: 'default' | 'danger';
  /**
   * 是否吸附在滚动容器顶部。默认 true。
   * 若外层已有吸附容器（例如与 AnchorNav 组成吸附栈），传 false 避免嵌套吸附。
   */
  sticky?: boolean;
}

const TONE_TEXT: Record<ContextTone, string> = {
  default: 'text-[#eef4ff]',
  ok: 'text-[#23e6b1]',
  warn: 'text-[#ffb84d]',
  danger: 'text-[#ff536c]',
  info: 'text-[#20cfff]'
};

/**
 * 常驻上下文栏（persistent context bar）。
 *
 * 不参与二级导航切换，任何 Tab 下都固定可见。
 * 存在的理由：分屏后模块之间不再互相跳转，每屏必须自带完整上下文
 * （信息自洽 / self-contained），否则用户切到任一 Tab 都缺少判断依据。
 *
 * 默认吸附在滚动容器顶部，配合可滚动长页使用。
 */
export const ContextBar: React.FC<ContextBarProps> = ({
  icon: Icon,
  title,
  subtitle,
  badges,
  metrics,
  status,
  tone = 'default',
  sticky = true
}) => {
  const isDanger = tone === 'danger';
  return (
    <div
      id="module-context-bar"
      className={`${sticky ? 'sticky top-0 z-20' : ''} px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm ${
        isDanger
          ? 'bg-[#1a0f1c]/95 border-[#ff536c]/50'
          : 'bg-[#0d1730]/95 border-[#2b4170]/60'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* 身份区 */}
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div
              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${
                isDanger
                  ? 'bg-[#ff536c]/15 border-[#ff536c]/40 text-[#ff536c]'
                  : 'bg-[#20cfff]/12 border-[#20cfff]/35 text-[#20cfff]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isDanger ? 'animate-pulse' : ''}`} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={`text-base font-bold truncate ${
                  isDanger ? 'text-[#ff536c]' : 'text-[#eef4ff]'
                }`}
              >
                {title}
              </h2>
              {badges}
            </div>
            {subtitle && (
              <p className="text-[11px] text-[#8996b8] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* 指标区 */}
        {metrics && metrics.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {metrics.map(m => (
              <div key={m.label} className="text-right">
                <span className="text-[10px] text-[#8996b8] block leading-none">{m.label}</span>
                <span
                  className={`font-mono font-bold text-sm leading-tight block mt-1 ${
                    TONE_TEXT[m.tone ?? 'default']
                  }`}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 状态区 */}
        {status && <div className="text-[10px] text-[#8996b8] shrink-0">{status}</div>}
      </div>
    </div>
  );
};
