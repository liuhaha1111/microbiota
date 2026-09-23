import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * 二级导航项。
 *
 * 切分维度是「任务」而不是「内容区块」——每个 Tab 必须能独立回答
 * 「用户在这个屏上现在要做什么」，而不是一个可以被任意拆开的数据块。
 */
export interface SecondaryNavItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** 一句话说明这个切面解决什么任务，渲染为 title 提示 */
  hint?: string;
  badge?: React.ReactNode;
}

interface SecondaryNavProps<T extends string = string> {
  items: ReadonlyArray<SecondaryNavItem<T>>;
  active: T;
  /**
   * 必须用 NoInfer 包住 T。
   *
   * 否则 TS 会从这个**逆变**位置反推 T：传入 `setActiveTab`（即
   * `Dispatch<SetStateAction<T>>`）时，推断出的候选是 `T | ((prev: T) => T)`，
   * 它不满足 `T extends string` 约束，TS 便退化成约束值 `string`——
   * 结果是 T 被推成 string，`items` / `active` 的字面量联合类型全部丢失。
   * NoInfer 让 T 只从 `items` 与 `active` 推断。
   */
  onChange: (id: NoInfer<T>) => void;
  /** 右侧补充信息（例如「共 3 项待处理」） */
  trailing?: React.ReactNode;
}

/**
 * 二级导航（模块内一级切分）。
 *
 * 与 SegmentedControl 的分工：
 * - SecondaryNav —— 任务切换，一次只渲染一个切面，用实心高亮；
 * - SegmentedControl —— 同一份数据的两种画法（可视化形式切换），层级更低、更轻。
 *
 * 分屏约束下的定位：多显示器各占一屏时，用户扫视的是「哪个屏有事」，
 * 因此默认 Tab 必须承载最关键的信息，关键上下文另由 ContextBar 常驻。
 */
export function SecondaryNav<T extends string>({
  items,
  active,
  onChange,
  trailing
}: SecondaryNavProps<T>) {
  return (
    <nav
      id="module-secondary-nav"
      className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 text-xs"
    >
      <div className="flex flex-wrap items-center gap-1">
        {items.map(item => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`secondary-nav-${item.id}`}
              type="button"
              title={item.hint}
              onClick={() => onChange(item.id)}
              className={`px-3.5 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#20cfff] text-[#090d18] font-bold shadow-[0_0_12px_rgba(32,207,255,0.25)]'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {item.label}
              {item.badge != null && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isActive ? 'bg-[#090d18]/20 text-[#090d18]' : 'bg-[#152347] text-[#8996b8]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {trailing && <div className="text-[10px] text-[#8996b8] pr-2">{trailing}</div>}
    </nav>
  );
}
