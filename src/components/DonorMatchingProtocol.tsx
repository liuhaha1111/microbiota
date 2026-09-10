import React, { useState } from 'react';
import { 
  GitMerge, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Sliders, 
  Sparkles, 
  Database, 
  Thermometer, 
  Calendar, 
  UserCheck, 
  Layers, 
  Check, 
  X,
  History,
  ArrowRight,
  Info,
  Pill,
  Send
} from 'lucide-react';
import { 
  ClinicalPatient, 
  DonorProfile, 
  MicrobiotaBatch, 
  MatchEvaluation, 
  FMTTreatmentProtocol,
  SafetyRuleGate 
} from '../types';
import { 
  mockDonors, 
  mockBatches, 
  mockMatchEvaluation, 
  mockFMTProtocol, 
  mockSafetyRules 
} from '../data/mockMicroFmtData';

interface DonorMatchingProtocolProps {
  patient: ClinicalPatient;
  onNavigateTab: (tabId: any) => void;
}

export const DonorMatchingProtocol: React.FC<DonorMatchingProtocolProps> = ({
  patient,
  onNavigateTab
}) => {
  const [selectedDonor, setSelectedDonor] = useState<DonorProfile>(mockDonors[0]);
  const [selectedBatch, setSelectedBatch] = useState<MicrobiotaBatch>(mockBatches[0]);
  const [protocol, setProtocol] = useState<FMTTreatmentProtocol>(mockFMTProtocol);
  const [ruleGates, setRuleGates] = useState<SafetyRuleGate[]>(mockSafetyRules);
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'matching' | 'batches' | 'protocol'>('matching');

  // SVG Radar Chart Coordinates calculation for 6 dimensions
  const radarDimensions = [
    { label: '菌群互补度', score: mockMatchEvaluation.dimensions.microbiomeComplementarity, key: 'microbiome' },
    { label: '功能互补度', score: mockMatchEvaluation.dimensions.functionalGain, key: 'functional' },
    { label: '安全性评级', score: mockMatchEvaluation.dimensions.safetyProfile, key: 'safety' },
    { label: '定植潜力', score: mockMatchEvaluation.dimensions.colonizationPotential, key: 'colonization' },
    { label: '历史疗效', score: mockMatchEvaluation.dimensions.historicalEfficacy, key: 'history' },
    { label: '疾病适配性', score: mockMatchEvaluation.dimensions.diseaseSuitability, key: 'disease' },
  ];

  const radarPoints = radarDimensions.map((d, i) => {
    const angle = (i / radarDimensions.length) * Math.PI * 2 - Math.PI / 2;
    const r = d.score * 80;
    const cx = 110 + Math.cos(angle) * r;
    const cy = 110 + Math.sin(angle) * r;
    return `${cx},${cy}`;
  }).join(' ');

  return (
    <div id="donor-matching-protocol-container" className="space-y-4">
      {/* 1. Header Navigation & Mode Toggles */}
      <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#eef4ff] flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#20cfff]" />
            供受体智能匹配与精准移植处方系统
          </h2>
          <p className="text-xs text-[#8996b8] mt-0.5">
            当前匹配受体: <span className="text-[#eef4ff] font-semibold">{patient.name}</span> ({patient.primaryDiagnosis.split(' ')[0]}) · 供受体六维生物组学AI配型
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-[#091127] border border-[#2b4170]/60 text-xs">
          <button
            onClick={() => setActiveTab('matching')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'matching' ? 'bg-[#20cfff] text-[#090d18] font-bold shadow' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            AI智能配型与解释
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'batches' ? 'bg-[#20cfff] text-[#090d18] font-bold shadow' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            供体库与活菌批次
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'protocol' ? 'bg-[#20cfff] text-[#090d18] font-bold shadow' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            精准移植处方与安全门控
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): AI Multi-dimensional Matching & Radar */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI 6-Dimensional Radar Matching Box */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[#20cfff]/20 text-[#20cfff]">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="font-bold text-[#eef4ff] text-sm">六维生物组学智能配型</h3>
                  <span className="text-[10px] text-[#8996b8]">受体菌群组学 vs 供体微生态表型</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8996b8] block">综合匹配度</span>
                <span className="text-xl font-bold font-mono text-[#20cfff]">
                  {mockMatchEvaluation.overallScore}%
                </span>
              </div>
            </div>

            {/* Radar SVG and Dimension Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center my-2">
              {/* Radar Chart SVG */}
              <div className="flex justify-center items-center py-1">
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible select-none">
                  {/* Background Polygons */}
                  {[0.25, 0.5, 0.75, 1.0].map((scale, i) => {
                    const bgPoints = radarDimensions.map((_, idx) => {
                      const angle = (idx / radarDimensions.length) * Math.PI * 2 - Math.PI / 2;
                      const r = 80 * scale;
                      return `${110 + Math.cos(angle) * r},${110 + Math.sin(angle) * r}`;
                    }).join(' ');
                    return (
                      <polygon
                        key={i}
                        points={bgPoints}
                        fill="none"
                        stroke="#2b4170"
                        strokeWidth="0.8"
                        strokeDasharray={scale === 1 ? 'none' : '2,2'}
                        opacity="0.6"
                      />
                    );
                  })}

                  {/* Axis lines */}
                  {radarDimensions.map((_, idx) => {
                    const angle = (idx / radarDimensions.length) * Math.PI * 2 - Math.PI / 2;
                    return (
                      <line
                        key={idx}
                        x1="110"
                        y1="110"
                        x2={110 + Math.cos(angle) * 80}
                        y2={110 + Math.sin(angle) * 80}
                        stroke="#2b4170"
                        strokeWidth="0.8"
                        opacity="0.6"
                      />
                    );
                  })}

                  {/* Data Polygon */}
                  <polygon
                    points={radarPoints}
                    fill="url(#radarGradient)"
                    stroke="#20cfff"
                    strokeWidth="2"
                    className="drop-shadow-[0_0_8px_rgba(32,207,255,0.5)]"
                  />

                  {/* Dimension vertex dots */}
                  {radarDimensions.map((d, idx) => {
                    const angle = (idx / radarDimensions.length) * Math.PI * 2 - Math.PI / 2;
                    const r = d.score * 80;
                    const cx = 110 + Math.cos(angle) * r;
                    const cy = 110 + Math.sin(angle) * r;
                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r="3.5"
                        fill="#20cfff"
                        stroke="#090d18"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Gradients */}
                  <defs>
                    <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#20cfff" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#397cff" stopOpacity="0.1" />
                    </radialGradient>
                  </defs>
                </svg>
              </div>

              {/* Dimension scores table */}
              <div className="space-y-1.5 text-[11px]">
                {radarDimensions.map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center text-[#8996b8]">
                      <span>{d.label}</span>
                      <span className="font-mono font-bold text-[#eef4ff]">{(d.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-0.5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#397cff] to-[#20cfff]" style={{ width: `${d.score * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Explainable AI Matching Rationales */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
            <h3 className="text-xs font-semibold text-[#20cfff] pb-2 border-b border-[#1e2f57] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 可解释配型理由 (Explainable Rationales)
            </h3>

            <div>
              <span className="text-[11px] font-semibold text-[#23e6b1] flex items-center gap-1 mb-1.5">
                <Check className="w-3 h-3" /> 关键互补优势:
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#eef4ff]">
                {mockMatchEvaluation.advantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-1.5 bg-[#0c1429] p-2 rounded border border-[#2b4170]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#23e6b1] mt-1.5 shrink-0"></span>
                    <span>{adv}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#ffb84d] flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3 h-3" /> 潜在微生态风险提示:
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#8996b8]">
                {mockMatchEvaluation.potentialRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5 bg-[#0c1429] p-2 rounded border border-[#ffb84d]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb84d] mt-1.5 shrink-0"></span>
                    <span className="text-[#eef4ff]">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0c1e38] border border-[#20cfff]/40 text-[11px]">
              <span className="font-semibold text-[#20cfff] block mb-0.5">AI综合决策建议:</span>
              <p className="text-[#eef4ff] leading-relaxed">{mockMatchEvaluation.aiRecommendation}</p>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Donor & Batch Selection | Safety Rule Gates | FMT Protocol */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Donor Profile & Available Batches */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#20cfff]" />
                <h3 className="font-semibold text-[#eef4ff]">推荐供体与冷链菌液批次</h3>
              </div>
              <span className="text-[11px] text-[#8996b8]">超级供体库已就绪</span>
            </div>

            {/* Donor Selectable Cards */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {mockDonors.map(donor => (
                <div
                  key={donor.id}
                  onClick={() => setSelectedDonor(donor)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedDonor.id === donor.id
                      ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.25)]'
                      : 'bg-[#0c1429] border-[#2b4170]/40 hover:border-[#2b4170]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#eef4ff] font-mono">{donor.code}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      donor.rating === 'A+' ? 'bg-[#23e6b1]/20 text-[#23e6b1]' : 'bg-[#20cfff]/20 text-[#20cfff]'
                    }`}>
                      {donor.rating} 级
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8996b8] block">{donor.donorType}</span>
                  <div className="mt-2 text-[10px] text-[#8996b8] space-y-0.5">
                    <div>多样性: <span className="text-[#eef4ff] font-mono">{donor.shannonDiversity}</span></div>
                    <div>治愈率: <span className="text-[#23e6b1] font-mono font-bold">{donor.clinicalSuccessRate}%</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Donor Detailed specs */}
            <div className="p-3 rounded-lg bg-[#0c1429] border border-[#2b4170]/50 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8996b8]">供体病原筛查全套 (38项):</span>
                <span className="text-[#23e6b1] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {selectedDonor.pathogenTest}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8996b8]">高危耐药基因 (AMR) 筛查:</span>
                <span className="text-[#23e6b1] font-semibold">{selectedDonor.amrGeneRisk}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#8996b8]">筛查证书有效周期:</span>
                <span className="text-[#eef4ff] font-mono">{selectedDonor.lastScreenedDate}</span>
              </div>
            </div>

            {/* Batch Table */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-[#8996b8] block mb-2">匹配待出库菌液批次 (超低温冷链跟踪):</span>
              <div className="space-y-1.5">
                {mockBatches.map(batch => (
                  <div
                    key={batch.batchNumber}
                    onClick={() => setSelectedBatch(batch)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border flex items-center justify-between text-xs ${
                      selectedBatch.batchNumber === batch.batchNumber
                        ? 'bg-[#152347] border-[#20cfff]'
                        : 'bg-[#0c1429] border-[#2b4170]/40 hover:bg-[#101c3d]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Thermometer className="w-4 h-4 text-[#20cfff]" />
                      <div>
                        <span className="font-mono font-bold text-[#eef4ff] block">{batch.batchNumber}</span>
                        <span className="text-[10px] text-[#8996b8]">{batch.location} · {batch.storageTemp}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[#23e6b1] font-bold block">{batch.viableCellCount.split(' ')[0]}</span>
                      <span className="text-[10px] text-[#20cfff]">{batch.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Precision Treatment Protocol Prescription Form */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2f57]">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#20cfff]" />
                <h3 className="font-semibold text-[#eef4ff]">精准菌群移植方案 (FMT Treatment Prescription)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#20cfff]/20 text-[#20cfff] font-mono text-[10px] font-bold">
                {protocol.protocolVersion}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                <span className="text-[#8996b8] text-[10px] block">移植给药路径:</span>
                <span className="font-bold text-[#eef4ff] text-xs mt-0.5 block flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-[#20cfff]" /> {protocol.administrationRoute}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                <span className="text-[#8996b8] text-[10px] block">推荐活菌剂量:</span>
                <span className="font-mono font-bold text-[#eef4ff] text-xs mt-0.5 block">
                  {protocol.recommendedDose}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                <span className="text-[#8996b8] text-[10px] block">给药频次与疗程:</span>
                <span className="font-medium text-[#eef4ff] text-xs mt-0.5 block">
                  {protocol.frequency} · {protocol.treatmentDuration}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                <span className="text-[#8996b8] text-[10px] block">肠道准备与前处理:</span>
                <span className="font-medium text-[#eef4ff] text-xs mt-0.5 block">
                  {protocol.bowelPreparation}
                </span>
              </div>
            </div>

            {/* Combined therapy and nutrition */}
            <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-[11px] space-y-1">
              <div>
                <span className="text-[#8996b8]">协同营养定植方案: </span>
                <span className="text-[#eef4ff]">{protocol.nutritionalIntervention}</span>
              </div>
              <div>
                <span className="text-[#8996b8]">联合药物方案: </span>
                <span className="text-[#eef4ff]">{protocol.combinedTherapy}</span>
              </div>
            </div>

            {/* 10 Safety Rule Gates Audit Box */}
            <div className="p-3 rounded-lg bg-[#0c1429] border border-[#2b4170]/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#23e6b1]" />
                  严格临床安全门控审查 (Safety Gateways)
                </span>
                <span className="text-[10px] text-[#23e6b1] font-bold">
                  10/10 项强规则全部合规通过
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {ruleGates.map(rule => (
                  <div key={rule.id} className="p-1.5 rounded bg-[#101a33] border border-[#1e2f57] flex items-center justify-between text-[10px]">
                    <span className="text-[#eef4ff] truncate mr-1" title={rule.name}>{rule.name}</span>
                    <span className="text-[#23e6b1] shrink-0 flex items-center gap-0.5 font-bold">
                      <Check className="w-3 h-3" /> 合规
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign and Approval Action */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1e2f57]">
              <div className="text-[11px] text-[#8996b8]">
                <span>主治医生签名: </span>
                <span className="text-[#20cfff] font-semibold">{protocol.author}</span>
                <span className="ml-2 font-mono">{protocol.dateCreated}</span>
              </div>

              <button
                onClick={() => onNavigateTab('efficacy_tracker')}
                className="px-4 py-2 rounded-lg bg-[#23e6b1] text-[#090d18] text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(35,230,177,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                下发执行并启动疗效监测
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
