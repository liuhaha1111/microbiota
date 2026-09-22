import React from 'react';
import { 
  Dna, 
  ChevronDown, 
  Bell, 
  Database
} from 'lucide-react';
import { ClinicalPatient } from '../types';
import { mockPatients } from '../data/mockMicroFmtData';

interface TopHeaderProps {
  currentPatient: ClinicalPatient;
  onSelectPatient: (patient: ClinicalPatient) => void;
  onNavigateTab: (tabId: any) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPatient,
  onSelectPatient,
  onNavigateTab
}) => {
  return (
    <header id="app-top-header" className="h-16 px-4 border-b border-[#1e2f57] bg-[#091127] flex items-center justify-between gap-4 select-none z-30 sticky top-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#20cfff] to-[#397cff] flex items-center justify-center shadow-[0_0_15px_rgba(32,207,255,0.4)]">
          <Dna className="w-5 h-5 text-[#090d18]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-wide text-[#eef4ff] font-sans">
              MicroFMT
            </h1>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40 font-semibold">
              精准诊疗平台
            </span>
          </div>
          <p className="text-[10px] text-[#8996b8] tracking-tight hidden sm:block">
            Precision Microbiota Transplantation & Clinical Intelligence Platform
          </p>
        </div>
      </div>

      {/* Center: Active Patient Switcher & Clinical Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8996b8] hidden md:inline">受体病例:</span>
        <div className="relative">
          <select
            id="patient-case-switcher"
            value={currentPatient.id}
            onChange={(e) => {
              const selected = mockPatients.find(p => p.id === e.target.value);
              if (selected) onSelectPatient(selected);
            }}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-[#101a33] border border-[#2b4170] text-xs text-[#eef4ff] font-medium focus:outline-none focus:border-[#20cfff] cursor-pointer hover:bg-[#152347] transition-all"
          >
            {mockPatients.map(p => (
              <option key={p.id} value={p.id} className="bg-[#091127] text-[#eef4ff]">
                {p.name} · {p.age}岁 ({p.primaryDiagnosis.split(' ')[0]})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8996b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <span className="text-[11px] px-2 py-0.5 rounded bg-[#101a33] text-[#20cfff] border border-[#2b4170]/60 font-mono hidden lg:inline">
          {currentPatient.mrn}
        </span>
      </div>

      {/* Right Tools & Status Indicators */}
      <div className="flex items-center gap-3 text-xs">
        {/* Cloud Genomics & Biobank Link Status */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] text-[#8996b8] border-r border-[#1e2f57] pr-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#23e6b1] animate-pulse"></span>
            mNGS测序云网: 连通
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#20cfff]" />
            超级菌库: A+级储备
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => onNavigateTab('workbench')}
            className="p-2 rounded-lg bg-[#101a33] border border-[#2b4170]/60 text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347] transition-all relative"
            title="查看系统预警"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff536c]"></span>
          </button>
        </div>

        {/* Physician Profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-[#152347] border border-[#20cfff]/40 flex items-center justify-center text-[#20cfff] font-bold text-xs">
            陈
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-[#eef4ff] block leading-none">陈建国 主任</span>
            <span className="text-[10px] text-[#8996b8] leading-none mt-1 block">FMT MDT组长</span>
          </div>
        </div>
      </div>
    </header>
  );
};
