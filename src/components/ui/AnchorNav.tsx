import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface AnchorNavItem {
  id: string;
  label: string;
}

interface AnchorNavProps {
  items: ReadonlyArray<AnchorNavItem>;
  /** 滚动容器的 DOM id */
  scrollRootId: string;
  /** 吸附栏的 DOM id，用于计算偏移，避免锚点被吸附栏遮住 */
  stickyId?: string;
  trailing?: React.ReactNode;
}

/**
 * 锚点导航（页内目录 / in-page TOC）。
 *
 * 与 Tab 的本质区别：
 * - Tab 是「切换内容」——互斥渲染，一次只有一个切面存在；
 * - 锚点导航是「跳转到内容」——内容全部保留在同一个滚动容器内，只做定位。
 *
 * 适用场景：内容之间存在因果链、需要互相对照的页面。
 * 此时拆 Tab 会让用户在两页之间反复横跳，认知负荷不降反升。
 */
export const AnchorNav: React.FC<AnchorNavProps> = ({
  items,
  scrollRootId,
  stickyId,
  trailing
}) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const frameRef = useRef<number | null>(null);

  const getOffset = useCallback(() => {
    const sticky = stickyId ? document.getElementById(stickyId) : null;
    return (sticky?.getBoundingClientRect().height ?? 0) + 12;
  }, [stickyId]);

  const syncActive = useCallback(() => {
    const root = document.getElementById(scrollRootId);
    if (!root) return;
    const offset = getOffset();
    const rootTop = root.getBoundingClientRect().top;
    let current = items[0]?.id ?? '';
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top - rootTop;
      if (top - offset <= 8) current = item.id;
    }
    setActiveId(current);
  }, [items, scrollRootId, getOffset]);

  useEffect(() => {
    const root = document.getElementById(scrollRootId);
    if (!root) return;

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        syncActive();
      });
    };

    syncActive();
    root.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      root.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [scrollRootId, syncActive]);

  const go = (id: string) => {
    const root = document.getElementById(scrollRootId);
    const el = document.getElementById(id);
    if (!root || !el) return;
    const delta = el.getBoundingClientRect().top - root.getBoundingClientRect().top;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.scrollTo({
      top: root.scrollTop + delta - getOffset(),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    setActiveId(id);
  };

  return (
    <nav
      id="module-anchor-nav"
      className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#0c1429] border border-[#2b4170]/60 text-xs"
    >
      <div className="flex flex-wrap items-center gap-1">
        {items.map(item => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-[#152347] text-[#20cfff] border border-[#20cfff]/40 font-bold'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347] border border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {trailing && <span className="text-[10px] text-[#8996b8] pr-1">{trailing}</span>}
    </nav>
  );
};
