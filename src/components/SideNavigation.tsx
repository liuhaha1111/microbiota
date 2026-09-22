import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  GitMerge, 
  LineChart, 
  Network, 
  Database
} from 'lucide-react';
import { ModuleTab } from '../types';

interface SideNavigationProps {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const navItems = [
    {
      id: 'workbench' as ModuleTab,
      name: '工作台驾驶舱',
      sub: '3D微生态数字孪生',
      icon: LayoutDashboard,
      badge: '3D'
    },
    {
      id: 'patient_center' as ModuleTab,
      name: '患者精准诊疗',
      sub: '菌群画像与微生态网络',
      icon: UserCheck,
      badge: '核心'
    },
    {
      id: 'donor_matching' as ModuleTab,
      name: '供受体智能匹配',
      sub: '六维雷达与精准处方',
      icon: GitMerge,
      badge: 'AI'
    },
    {
      id: 'efficacy_tracker' as ModuleTab,
      name: '疗效与重构监测',
      sub: '四轨时序与再决策',
      icon: LineChart,
      badge: '随访'
    },
    {
      id: 'knowledge_graph' as ModuleTab,
      name: '微生态知识图谱',
      sub: '全景拓扑与生物科研',
      icon: Network,
      badge: '图谱'
    },
  ];

  return (
    <aside id="app-side-navigation" className="w-56 bg-[#091127] border-r border-[#1e2f57] flex flex-col justify-between select-none shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation items list */}
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-semibold text-[#8996b8] tracking-wider uppercase">
          精准医疗核心闭环
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                isActive
                  ? 'bg-gradient-to-r from-[#101a33] to-[#16274d] text-[#eef4ff] border border-[#20cfff]/50 shadow-[0_0_15px_rgba(32,207,255,0.15)]'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#101a33]/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'bg-[#0c1429] text-[#8996b8] group-hover:text-[#20cfff]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs font-semibold leading-tight ${isActive ? 'text-[#eef4ff]' : ''}`}>
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[#8996b8] leading-tight mt-0.5">
                    {item.sub}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isActive ? 'bg-[#20cfff] text-[#090d18]' : 'bg-[#152347] text-[#8996b8]'
                }`}>
                  {item.badge}
                </span>
              )}
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
