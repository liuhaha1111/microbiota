import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  /** 锚点 id，供 AnchorNav 定位使用 */
  id?: string;
  title: string;
  icon?: LucideIcon;
  /** 标题右侧说明文字 */
  hint?: React.ReactNode;
  /** 标题右侧操作区 */
  right?: React.ReactNode;
  /** 是否可折叠；默认 true */
  collapsible?: boolean;
  /** 折叠态默认是否展开 */
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * 可折叠分节卡。
 *
 * 用于不适合切 Tab 的「因果链」型页面：内容之间需要互相对照
 * （例如疗效监测的四轨时序与再决策引擎，决策依据就画在图里），
 * 拆成互斥 Tab 会打断因果链、逼用户在标签间反复横跳。
 *
 * 这类页面改用「锚点导航 + 分节折叠」：保留全局可扫读性，
 * 同时让低优先级分节默认收起，降低首屏视觉负荷。
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  icon: Icon,
  hint,
  right,
  collapsible = true,
  defaultOpen = true,
  className = '',
  children
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <section
      id={id}
      className={`rounded-xl bg-surface border border-line/60 shadow-lg scroll-mt-32 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-line-2">
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              aria-expanded={isOpen}
              className="p-1 -ml-1 rounded text-ink-muted hover:text-ink hover:bg-track transition-all"
              title={isOpen ? '收起分节' : '展开分节'}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`}
              />
            </button>
          )}
          <h3 className="text-xs font-semibold text-ink flex items-center gap-1.5 truncate">
            {Icon && <Icon className="w-3.5 h-3.5 text-accent shrink-0" />}
            {title}
          </h3>
          {hint && <span className="text-[length:var(--fs-10)] text-ink-muted truncate">{hint}</span>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>

      {isOpen && <div className="p-5">{children}</div>}
    </section>
  );
};
