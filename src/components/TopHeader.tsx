import React from 'react';
import { 
  Dna, 
  ChevronDown, 
  Bell, 
  Database,
  LayoutGrid,
  Contrast,
  ALargeSmall
} from 'lucide-react';
import { ClinicalPatient } from '../types';
import { mockPatients } from '../data/mockMicroFmtData';
import { useDisplayMode } from '../hooks/useDisplayMode';

interface TopHeaderProps {
  currentPatient: ClinicalPatient;
  onSelectPatient: (patient: ClinicalPatient) => void;
  /** 当前是否停在启动台主屏 */
  isHome: boolean;
  /** 返回启动台主屏。侧边导航已移除，这是模块屏唯一的回路。 */
  onGoHome: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPatient,
  onSelectPatient,
  isHome,
  onGoHome
}) => {
  const { mode, toggle } = useDisplayMode();

  return (
    <header id="app-top-header" className="h-16 px-4 border-b border-line-2 bg-chrome flex items-center justify-between gap-4 select-none z-30 sticky top-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-info flex items-center justify-center shadow-[0_0_15px_rgba(32,207,255,0.4)]">
          <Dna className="w-5 h-5 text-on-bright" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-wide text-ink font-sans">
              MicroFMT
            </h1>
            <span className="text-[length:var(--fs-10)] px-1.5 py-0.2 rounded bg-accent/20 text-accent border border-accent/40 font-semibold">
              精准诊疗平台
            </span>
          </div>
          <p className="text-[length:var(--fs-10)] text-ink-muted tracking-tight hidden sm:block">
            Precision Microbiota Transplantation & Clinical Intelligence Platform
          </p>
        </div>

        {/* 返回启动台
            侧边导航已移除，每块屏只承载一个模块，这里是回到主屏的唯一入口。
            停在主屏时不渲染，避免出现一个点不动的控件。 */}
        {!isHome && (
          <button
            id="back-to-home"
            onClick={onGoHome}
            title="返回启动台主屏"
            className="ml-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-line text-[length:var(--fs-11)] text-ink-muted hover:text-accent hover:border-accent/60 hover:bg-track transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">启动台</span>
          </button>
        )}
      </div>

      {/* Center: Active Patient Switcher & Clinical Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted hidden md:inline">受体病例:</span>
        <div className="relative">
          <select
            id="patient-case-switcher"
            value={currentPatient.id}
            onChange={(e) => {
              const selected = mockPatients.find(p => p.id === e.target.value);
              if (selected) onSelectPatient(selected);
            }}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-surface border border-line text-xs text-ink font-medium focus:outline-none focus:border-accent cursor-pointer hover:bg-track transition-all"
          >
            {mockPatients.map(p => (
              <option key={p.id} value={p.id} className="bg-chrome text-ink">
                {p.name} · {p.age}岁 ({p.primaryDiagnosis.split(' ')[0]})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <span className="text-[length:var(--fs-11)] px-2 py-0.5 rounded bg-surface text-accent border border-line/60 font-mono hidden lg:inline">
          {currentPatient.mrn}
        </span>
      </div>

      {/* Right Tools & Status Indicators */}
      <div className="flex items-center gap-3 text-xs">
        {/* Cloud Genomics & Biobank Link Status */}
        <div className="hidden xl:flex items-center gap-3 text-[length:var(--fs-11)] text-ink-muted border-r border-line-2 pr-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ok animate-pulse"></span>
            mNGS测序云网: 连通
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-accent" />
            超级菌库: A+级储备
          </span>
        </div>

        {/* 显示档位开关
            投在大屏上远距离观看时，深色底 + 10px 小字会一起糊掉，看不清。
            这两个开关分别对付「对比度」和「字号」，互相独立、可同时开。
            状态落在 <html> 的 data-contrast / data-size 上（见 index.css 的令牌覆盖块），
            由 localStorage 持久化，刷新后保持。 */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface border border-line">
          <button
            id="display-toggle-contrast"
            type="button"
            onClick={() => toggle('contrast')}
            aria-pressed={mode.contrast}
            title="高对比：提亮全站文字与描边"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[length:var(--fs-11)] font-medium transition-colors ${
              mode.contrast
                ? 'bg-accent text-on-bright'
                : 'text-ink-muted hover:text-ink hover:bg-track'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">高对比</span>
          </button>

          <button
            id="display-toggle-large"
            type="button"
            onClick={() => toggle('largeText')}
            aria-pressed={mode.largeText}
            title="大字号：全站字号上浮一档"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[length:var(--fs-11)] font-medium transition-colors ${
              mode.largeText
                ? 'bg-accent text-on-bright'
                : 'text-ink-muted hover:text-ink hover:bg-track'
            }`}
          >
            <ALargeSmall className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">大字号</span>
          </button>
        </div>

        {/* Global Alert Indicator
            分屏约束下模块之间不再互相跳转，此处只作为全局预警指示灯；
            红线预警的详情与处置入口由启动台主屏的常驻 ContextBar 承载。 */}
        <div
          role="status"
          title="全局红线预警指示灯 · 详情见启动台主屏常驻预警栏"
          className="p-2 rounded-lg bg-surface border border-danger/40 text-danger relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse"></span>
        </div>

        {/* Physician Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-track border border-accent/40 flex items-center justify-center text-accent font-bold text-xs">
            陈
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-ink block leading-none">陈建国 主任</span>
            <span className="text-[length:var(--fs-10)] text-ink-muted leading-none mt-1 block">FMT MDT组长</span>
          </div>
        </div>
      </div>
    </header>
  );
};
