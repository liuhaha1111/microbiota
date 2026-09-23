import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SegmentedControlItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string = string> {
  items: ReadonlyArray<SegmentedControlItem<T>>;
  active: T;
  /** NoInfer 的理由同 SecondaryNav：阻止从逆变位置把 T 反推成 string */
  onChange: (id: NoInfer<T>) => void;
  /** 右侧说明文字 */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * 分段控件（同一份数据的多种画法）。
 *
 * 层级低于 SecondaryNav：视觉上更轻（描边高亮而非实心填充），
 * 用来表达「这是同一个切面的两种呈现方式」，而不是「这是两个不同的任务」。
 *
 * 典型用法：菌群画像 Tab 内部在「生态网络拓扑 / 优势菌丰度表」之间切换——
 * 两者是同一份菌群数据的两种画法，不应与内容 Tab 平级。
 */
export function SegmentedControl<T extends string>({
  items,
  active,
  onChange,
  trailing,
  className = ''
}: SegmentedControlProps<T>) {
  return (
    <div id="module-segmented-control" className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <div className="flex items-center p-1 rounded-lg bg-[#0c1429] border border-[#2b4170]/60 text-xs">
        {items.map(item => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`segmented-${item.id}`}
              type="button"
              onClick={() => onChange(item.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#152347] text-[#20cfff] font-bold border border-[#20cfff]/40'
                  : 'text-[#8996b8] hover:text-[#eef4ff] border border-transparent'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {item.label}
            </button>
          );
        })}
      </div>
      {trailing && <span className="text-[10px] text-[#8996b8] pr-1">{trailing}</span>}
    </div>
  );
}
