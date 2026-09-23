import { useState } from 'react';
import { AppView, ModuleTab, ClinicalPatient } from './types';
import { mockPatients } from './data/mockMicroFmtData';
import { TopHeader } from './components/TopHeader';
import { SideNavigation } from './components/SideNavigation';
import { HomeConsole } from './components/HomeConsole';
import { WorkbenchCockpit } from './components/WorkbenchCockpit';
import { PatientIntelligenceCenter } from './components/PatientIntelligenceCenter';
import { DonorMatchingProtocol } from './components/DonorMatchingProtocol';
import { EfficacyReconstructionTracker } from './components/EfficacyReconstructionTracker';
import { HistoricalSampleLibrary } from './components/HistoricalSampleLibrary';

export default function App() {
  /**
   * 部署形态：5 块物理屏 ↔ 5 个模块（屏位固定绑定，没有第 6 块屏）。
   * 启动时 5 块屏都显示启动台主屏，因此默认视图是 'home' 而不是某个模块。
   */
  const [view, setView] = useState<AppView>('home');
  /** 已投送内容并加载完成的屏位 */
  const [dispatched, setDispatched] = useState<ModuleTab[]>([]);
  const [currentPatient, setCurrentPatient] = useState<ClinicalPatient>(mockPatients[0]);

  /**
   * 切换视图。
   *
   * 进入任一模块屏即视为该屏位「已加载」——无论入口是启动台的投送卡还是侧边栏。
   * 否则会出现自相矛盾的状态：人正看着屏 3，启动台却报「5 块屏待命」。
   * 'home' 是启动台本身，不占屏位，因此不登记。
   */
  const navigate = (next: AppView) => {
    if (next !== 'home') {
      setDispatched(prev => (prev.includes(next) ? prev : [...prev, next]));
    }
    setView(next);
  };

  return (
    <div className="min-h-screen bg-[#090d18] text-[#eef4ff] font-sans flex flex-col selection:bg-[#20cfff] selection:text-[#090d18]">
      {/* 1. Universal Top Header */}
      <TopHeader
        currentPatient={currentPatient}
        onSelectPatient={setCurrentPatient}
      />

      {/* 2. Main Platform Layout: Side Navigation + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side Navigation */}
        <SideNavigation
          activeView={view}
          onNavigate={navigate}
          dispatched={dispatched}
        />

        {/* Right Active Workspace Container
            id 供页内锚点导航（AnchorNav）定位滚动容器使用 */}
        <main
          id="app-scroll-root"
          className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-[#090d18] via-[#0b1226] to-[#090d18]"
        >
          <div className="max-w-[1600px] mx-auto w-full">
            {/* 分屏约束：每个模块自成一屏，模块之间不互相跳转，
                因此不向模块下发 onNavigateTab。模块内所需上下文由各模块的
                ContextBar 常驻承载（信息自洽 / self-contained）。
                唯一的跨屏入口是启动台主屏上的屏位调度卡——它是投送动作，
                不是模块间的业务跳转。 */}
            {view === 'home' && (
              <HomeConsole
                currentPatient={currentPatient}
                dispatched={dispatched}
                onEnter={navigate}
              />
            )}

            {view === 'workbench' && (
              <WorkbenchCockpit currentPatient={currentPatient} />
            )}

            {view === 'patient_center' && (
              <PatientIntelligenceCenter patient={currentPatient} />
            )}

            {view === 'donor_matching' && (
              <DonorMatchingProtocol patient={currentPatient} />
            )}

            {view === 'efficacy_tracker' && (
              <EfficacyReconstructionTracker patient={currentPatient} />
            )}

            {view === 'history_library' && (
              <HistoricalSampleLibrary patient={currentPatient} />
            )}
          </div>
        </main>
      </div>

      {/* 3. Deep Tech Medical Footer */}
      <footer className="h-9 px-4 bg-[#070b14] border-t border-[#1e2f57] flex items-center justify-between text-[11px] text-[#8996b8] select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#23e6b1]"></span>
            <span>MicroFMT 菌群移植精准诊疗与科研一体化平台</span>
          </span>
          <span className="hidden md:inline text-[#2b4170]">|</span>
          <span className="hidden md:inline">适应症标准：ACG / ECCO 2024 结肠菌群移植临床共识</span>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden sm:inline">冷链质控标准: cGMP-Micro24</span>
          <span className="hidden sm:inline">·</span>
          <span>基因组学质控: Q30 &gt; 92%</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-[#20cfff] font-mono">v2.8-Production</span>
        </div>
      </footer>
    </div>
  );
}
