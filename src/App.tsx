import { useCallback, useEffect, useRef, useState } from 'react';
import { AppView, ModuleTab, ClinicalPatient } from './types';
import { mockPatients } from './data/mockMicroFmtData';
import { TopHeader } from './components/TopHeader';
import { HomeConsole } from './components/HomeConsole';
import { WorkbenchCockpit } from './components/WorkbenchCockpit';
import { PatientIntelligenceCenter } from './components/PatientIntelligenceCenter';
import { DonorMatchingProtocol } from './components/DonorMatchingProtocol';
import { EfficacyReconstructionTracker } from './components/EfficacyReconstructionTracker';
import { HistoricalSampleLibrary } from './components/HistoricalSampleLibrary';
import { useWallSync } from './hooks/useWallSync';
import { isSameDispatched, type WallSyncState } from './utils/wallSync';

export default function App() {
  /**
   * 部署形态：N 块物理屏 ↔ N 个模块窗口，屏位固定绑定，没有额外屏位。
   * 启动时每块屏都显示启动台主屏，因此默认视图是 'home' 而不是某个模块。
   *
   * view 是**本窗口私有**的 —— 每块屏显示哪个模块互不干涉；
   * dispatched 与 currentPatient 则通过跨屏同步共享，所以启动台的
   * 「待命 N/5」和受体病例在所有屏上都是一致的。
   */
  const [view, setView] = useState<AppView>('home');
  const [dispatched, setDispatched] = useState<ModuleTab[]>([]);
  const [currentPatient, setCurrentPatient] = useState<ClinicalPatient>(mockPatients[0]);

  /**
   * 接收其它屏广播过来的病例与投送状态。
   *
   * 只在内容确实不同时才 setState。远端数组每次都是新引用，直接替换会让下面的
   * 广播 effect 再次发出消息，两块屏之间来回弹射形成无限循环。
   */
  const applyRemote = useCallback((remote: WallSyncState) => {
    setCurrentPatient(prev => {
      if (prev.id === remote.patientId) return prev;
      return mockPatients.find(p => p.id === remote.patientId) ?? prev;
    });
    setDispatched(prev => (isSameDispatched(prev, remote.dispatched) ? prev : remote.dispatched));
  }, []);

  const { active: wallActive, publish } = useWallSync(applyRemote);

  /**
   * 广播本地状态变化。
   *
   * 必须先用指纹比对再发。否则远端应用过来的状态会改变 effect 的依赖，触发又一次
   * 广播，形成 A→B→A→… 的无限循环。
   */
  const lastBroadcastRef = useRef('');

  useEffect(() => {
    if (!wallActive) return;
    const state: WallSyncState = { patientId: currentPatient.id, dispatched };
    const fingerprint = `${state.patientId}|${state.dispatched.join(',')}`;
    if (fingerprint === lastBroadcastRef.current) return;
    lastBroadcastRef.current = fingerprint;
    publish(state);
  }, [wallActive, publish, currentPatient.id, dispatched]);

  /**
   * 切换视图。
   *
   * 进入任一模块屏即视为该屏位「已加载」——无论入口是启动台的投送卡还是顶栏的
   * 启动台按钮。'home' 是启动台本身，不占屏位，因此不登记。
   */
  const navigate = (next: AppView) => {
    if (next !== 'home') {
      setDispatched(prev => (prev.includes(next) ? prev : [...prev, next]));
    }
    setView(next);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex flex-col selection:bg-accent selection:text-on-bright">
      {/* 1. Universal Top Header
          侧边导航已移除，顶栏的「启动台」按钮是模块屏回到主屏的唯一回路。 */}
      <TopHeader
        currentPatient={currentPatient}
        onSelectPatient={setCurrentPatient}
        isHome={view === 'home'}
        onGoHome={() => navigate('home')}
      />

      {/* 2. Full-bleed Workspace
          分屏约束：每块屏只承载一个模块，模块之间不互相跳转，因此不再有左侧目录。
          每屏所需的全部上下文由各模块的 ContextBar 常驻承载（信息自洽）。
          id 供页内锚点导航（AnchorNav）定位滚动容器使用。 */}
      <main
        id="app-scroll-root"
        className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-canvas via-surface-2 to-canvas"
      >
        <div
          className={`mx-auto w-full ${
            /* 屏 1 部署在 49 寸 5120×1440（32:9）带鱼屏上，1600px 上限会让
               两侧各空出 1760px。工作台因此解除宽度上限，改用三栏超宽布局
               （见 WorkbenchCockpit 的 3xl: 断点）；其余模块仍维持 1600px，
               避免在普通 16:9 屏上被拉成过宽的一行字。 */
            view === 'workbench' ? 'max-w-none' : 'max-w-[1600px]'
          }`}
        >
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

      {/* 3. Deep Tech Medical Footer */}
      <footer className="h-9 px-4 bg-canvas border-t border-line-2 flex items-center justify-between text-[length:var(--fs-11)] text-ink-muted select-none z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ok"></span>
            <span>MicroFMT 菌群移植精准诊疗与科研一体化平台</span>
          </span>
          <span className="hidden md:inline text-ink-subtle">|</span>
          <span className="hidden md:inline">适应症标准：ACG / ECCO 2024 结肠菌群移植临床共识</span>
        </div>

        <div className="flex items-center gap-4 text-[length:var(--fs-10)]">
          <span className="hidden sm:inline">冷链质控标准: cGMP-Micro24</span>
          <span className="hidden sm:inline">·</span>
          <span>基因组学质控: Q30 &gt; 92%</span>
          <span className="hidden sm:inline">·</span>
          <span className="text-accent font-mono">v2.8-Production</span>
        </div>
      </footer>
    </div>
  );
}
