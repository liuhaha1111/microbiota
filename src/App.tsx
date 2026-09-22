import React, { useState } from 'react';
import { ModuleTab, ClinicalPatient } from './types';
import { mockPatients } from './data/mockMicroFmtData';
import { TopHeader } from './components/TopHeader';
import { SideNavigation } from './components/SideNavigation';
import { WorkbenchCockpit } from './components/WorkbenchCockpit';
import { PatientIntelligenceCenter } from './components/PatientIntelligenceCenter';
import { DonorMatchingProtocol } from './components/DonorMatchingProtocol';
import { EfficacyReconstructionTracker } from './components/EfficacyReconstructionTracker';
import { KnowledgeGraphExplorer } from './components/KnowledgeGraphExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleTab>('workbench');
  const [currentPatient, setCurrentPatient] = useState<ClinicalPatient>(mockPatients[0]);

  return (
    <div className="min-h-screen bg-[#090d18] text-[#eef4ff] font-sans flex flex-col selection:bg-[#20cfff] selection:text-[#090d18]">
      {/* 1. Universal Top Header */}
      <TopHeader
        currentPatient={currentPatient}
        onSelectPatient={setCurrentPatient}
        onNavigateTab={setActiveTab}
      />

      {/* 2. Main Platform Layout: Side Navigation + Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side Navigation */}
        <SideNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Right Active Workspace Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-[#090d18] via-[#0b1226] to-[#090d18]">
          <div className="max-w-[1600px] mx-auto w-full">
            {activeTab === 'workbench' && (
              <WorkbenchCockpit
                currentPatient={currentPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'patient_center' && (
              <PatientIntelligenceCenter
                patient={currentPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'donor_matching' && (
              <DonorMatchingProtocol
                patient={currentPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'efficacy_tracker' && (
              <EfficacyReconstructionTracker
                patient={currentPatient}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'knowledge_graph' && (
              <KnowledgeGraphExplorer patient={currentPatient} />
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
