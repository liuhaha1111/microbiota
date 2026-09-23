import React from 'react';
import { Database, Monitor } from 'lucide-react';
import { AppView, ModuleTab } from '../types';
import { SCREEN_SLOTS, SCREEN_SLOT_COUNT } from '../data/screenSlots';

interface SideNavigationProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  /** 已投送并加载完成的屏位 */
  dispatched: ReadonlyArray<ModuleTab>;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  activeView,
  onNavigate,
  dispatched
}) => {
  const isHome = activeView === 'home';
  const idleCount = SCREEN_SLOT_COUNT - dispatched.length;

  return (
    <aside id="app-side-navigation" className="w-56 bg-[#091127] border-r border-[#1e2f57] flex flex-col justify-between select-none shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-3 space-y-1.5">
        {/* 启动台入口：它是 5 块屏的初始态，不是第 6 块屏，
            因此用独立卡片样式与下方 5 个屏位项区分开。 */}
        <button
          id="nav-item-home"
          onClick={() => onNavigate('home')}
          className={`w-full p-2.5 rounded-xl text-left transition-all border ${
            isHome
              ? 'bg-gradient-to-r from-[#20cfff]/20 to-[#397cff]/10 border-[#20cfff]/60 text-[#eef4ff] shadow-[0_0_15px_rgba(32,207,255,0.18)]'
              : 'bg-[#0c1429] border-[#2b4170]/60 text-[#8996b8] hover:text-[#eef4ff] hover:border-[#20cfff]/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold">
              <Monitor className={`w-4 h-4 ${isHome ? 'text-[#20cfff]' : ''}`} />
              启动台 · 总控
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                isHome ? 'bg-[#20cfff] text-[#090d18]' : 'bg-[#152347] text-[#8996b8]'
              }`}
            >
              主屏
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#8996b8] font-mono">
            <span>5 块屏调度</span>
            <span className="text-[#2b4170]">|</span>
            <span className={idleCount === 0 ? 'text-[#23e6b1]' : 'text-[#ffb84d]'}>
              {idleCount === 0 ? '全部已加载' : `待命 ${idleCount}`}
            </span>
          </div>
        </button>

        {/* 屏位分组标题 */}
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-[#8996b8] tracking-wider uppercase flex items-center justify-between">
          <span>精准医疗核心闭环</span>
          <span className="font-mono normal-case">{SCREEN_SLOT_COUNT} 屏</span>
        </div>

        {SCREEN_SLOTS.map(slot => {
          const Icon = slot.icon;
          const isActive = activeView === slot.tab;
          const isDispatched = dispatched.includes(slot.tab);

          return (
            <button
              key={slot.tab}
              id={`nav-item-${slot.tab}`}
              onClick={() => onNavigate(slot.tab)}
              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-gradient-to-r from-[#101a33] to-[#16274d] text-[#eef4ff] border border-[#20cfff]/50 shadow-[0_0_15px_rgba(32,207,255,0.15)]'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#101a33]/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`relative p-1.5 rounded-lg transition-colors shrink-0 ${
                  isActive ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'bg-[#0c1429] text-[#8996b8] group-hover:text-[#20cfff]'
                }`}>
                  <Icon className="w-4 h-4" />
                  {/* 未投送的屏位在图标上带一个待命点，一眼看出哪块屏还没调起来 */}
                  {!isDispatched && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#ffb84d]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-[#eef4ff]' : ''}`}>
                    {slot.name}
                  </div>
                  <div className="text-[10px] text-[#8996b8] leading-tight mt-0.5 truncate">
                    {slot.sub}
                  </div>
                </div>
              </div>

              <span
                id={`nav-slot-${slot.slot}`}
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                  isActive ? 'bg-[#20cfff] text-[#090d18]' : 'bg-[#152347] text-[#8996b8]'
                }`}
              >
                屏 {slot.slot}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Status & Biobank Widget */}
      <div className="p-3 border-t border-[#1e2f57]">
        <div className="p-3 rounded-xl bg-[#0c1429] border border-[#2b4170]/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#eef4ff] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#20cfff]" /> 智能液氮菌库
            </span>
            <span className="w-2 h-2 rounded-full bg-[#23e6b1] animate-pulse"></span>
          </div>

          <div className="space-y-1 text-[10px] text-[#8996b8]">
            <div className="flex justify-between">
              <span>在库合格批次:</span>
              <span className="text-[#eef4ff] font-mono font-bold">142 份</span>
            </div>
            <div className="flex justify-between">
              <span>超低温冷链状态:</span>
              <span className="text-[#23e6b1] font-mono">-82.4°C</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-[#1e2f57]/80 text-[10px] text-[#8996b8] flex items-center justify-between">
            <span>系统版本: v2.8 Pro</span>
            <span className="text-[#20cfff]">科研临床级</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
