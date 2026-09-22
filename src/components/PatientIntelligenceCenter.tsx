import React, { useState } from 'react';
import { 
  FileText, 
  Activity, 
  TrendingUp, 
  Dna, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ClinicalPatient, MicrobialTaxon } from '../types';
import { getPatientDataPackage } from '../data/mockMicroFmtData';
import { MicrobiomeKnowledgeGraph } from './MicrobiomeKnowledgeGraph';

interface PatientIntelligenceCenterProps {
  patient: ClinicalPatient;
  onNavigateTab: (tabId: any) => void;
}

export const PatientIntelligenceCenter: React.FC<PatientIntelligenceCenterProps> = ({
  patient,
  onNavigateTab
}) => {
  const patientPackage = getPatientDataPackage(patient.id);
  const taxa = patientPackage.taxa;
  const pathways = patientPackage.pathways;
  const stats = patientPackage.microbiomeStats;
  const aiAdvice = patientPackage.aiAdvice;

  const [selectedTaxon, setSelectedTaxon] = useState<MicrobialTaxon>(taxa[0] || {} as MicrobialTaxon);
  const [activeViewTab, setActiveViewTab] = useState<'network' | 'taxa_list'>('network');

  React.useEffect(() => {
    if (taxa.length > 0) {
      setSelectedTaxon(taxa[0]);
    }
  }, [patient.id]);

  return (
    <div id="patient-intelligence-center" className="space-y-4">
      {/* 1. Top Patient Header Summary Bar */}
      <div id="patient-summary-banner" className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#20cfff]/20 to-[#397cff]/30 border border-[#20cfff]/40 flex items-center justify-center text-[#20cfff] font-bold text-lg font-mono">
            {patient.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#eef4ff]">{patient.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#151f3d] text-[#8996b8] border border-[#2b4170]/40 font-mono">
                {patient.gender} · {patient.age}岁 · {patient.mrn}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#20cfff]/15 text-[#20cfff] border border-[#20cfff]/40">
                {patient.currentPhase}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                patient.riskLevel === 'high' ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/40' : 'bg-[#ffb84d]/20 text-[#ffb84d] border border-[#ffb84d]/40'
              }`}>
                {patient.riskLevel === 'high' ? '高危重症' : '中度活动期'}
              </span>
            </div>
            <p className="text-xs text-[#8996b8] mt-1 flex items-center gap-2">
              <span className="text-[#eef4ff] font-medium">{patient.primaryDiagnosis}</span>
              <span>| 主管医师: {patient.attendingPhysician}</span>
              <span>| 最近随访: {patient.lastFollowUp}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('donor_matching')}
            className="px-4 py-2 rounded-lg bg-[#20cfff] text-[#090d18] text-xs font-bold hover:brightness-110 shadow-[0_0_12px_rgba(32,207,255,0.3)] flex items-center gap-1.5 transition-all"
          >
            进入供受体智能匹配 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Three Columns Core Grid: Clinical Info & Markers (3) | Microbiome Profile & Ecological Graph (6) | Adaptability & Pathways (3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (3 cols): Clinical Indicators & History */}
        <div className="lg:col-span-3 space-y-4">
          {/* Key Clinical Biomarkers */}
          <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#20cfff]" /> 重点临床检验指标
              </span>
              <span className="text-[10px] text-[#8996b8]">最新检验</span>
            </h3>

            <div className="space-y-2.5">
              {/* CRP */}
              <div className="p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8996b8] text-[11px] block">C-反应蛋白 (CRP)</span>
                  <span className="text-[10px] text-[#8996b8]">参考: &lt;5.0 mg/L</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#ff536c] flex items-center gap-0.5 justify-end">
                    {patient.clinicalMarkers.crp.value} {patient.clinicalMarkers.crp.unit}
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#ff536c]">重度升高</span>
                </div>
              </div>

              {/* Fecal Calprotectin */}
              <div className="p-2 rounded-lg bg-[#241121] border border-[#ff536c]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#ff536c] font-semibold text-[11px] block">粪便钙卫蛋白 (FC)</span>
                  <span className="text-[10px] text-[#8996b8]">肠黏膜活动性溃疡核心指标</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-base text-[#ff536c] flex items-center gap-0.5 justify-end">
                    {patient.clinicalMarkers.fecalCalprotectin.value} μg/g
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#ff536c] font-bold">参考: &lt;50 μg/g</span>
                </div>
              </div>

              {/* ESR */}
              <div className="p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8996b8] text-[11px] block">血沉 (ESR)</span>
                  <span className="text-[10px] text-[#8996b8]">参考: 0-15 mm/h</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#ffb84d] flex items-center gap-0.5 justify-end">
                    {patient.clinicalMarkers.esr.value} mm/h
                    <TrendingUp className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] text-[#ffb84d]">显著升高</span>
                </div>
              </div>

              {/* Albumin & Nutrition */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-xs">
                  <span className="text-[#8996b8] text-[10px] block">血清白蛋白</span>
                  <span className="font-mono font-bold text-xs text-[#ffb84d]">{patient.clinicalMarkers.albumin.value} g/L</span>
                  <span className="text-[9px] text-[#ffb84d] block">轻度低蛋白血症</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-xs">
                  <span className="text-[#8996b8] text-[10px] block">体质指数 (BMI)</span>
                  <span className="font-mono font-bold text-xs text-[#ff536c]">{patient.clinicalMarkers.bmi.value}</span>
                  <span className="text-[9px] text-[#ff536c] block">消瘦消牦状态</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Profile Details */}
          <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 border-b border-[#1e2f57] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#20cfff]" /> 临床病史与诊断表型
            </h3>

            <div>
              <span className="text-[10px] text-[#8996b8] block">主诉与现病史:</span>
              <p className="text-[#eef4ff] text-[11px] leading-relaxed mt-0.5 bg-[#0c1429] p-2 rounded border border-[#2b4170]/30">
                {patient.chiefComplaint}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-[#8996b8] block mb-1">疾病特征标签:</span>
              <div className="flex flex-wrap gap-1">
                {patient.diagnosticTags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-[#152347] text-[#20cfff] text-[10px] border border-[#20cfff]/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#8996b8] block mb-1">近期维持用药:</span>
              <div className="space-y-1">
                {patient.pastMedications.map((med, i) => (
                  <div key={i} className="p-1 rounded bg-[#0c1429] text-[#eef4ff] text-[11px] flex items-center justify-between">
                    <span>{med}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#241121] border border-[#ff536c]/30 text-[11px]">
              <span className="text-[#ff536c] font-semibold flex items-center gap-1 mb-0.5">
                <AlertCircle className="w-3.5 h-3.5" /> 药物/食物过敏警示:
              </span>
              <p className="text-[#eef4ff]">{patient.allergies.join('、') || '无已知严重超敏史'}</p>
            </div>
          </div>
        </div>

        {/* Center Column (6 cols): Microbiome Ecological Network & Taxa Profiling */}
        <div className="lg:col-span-6 space-y-4">
          {/* View Tab Switcher Header */}
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveViewTab('network')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'network'
                    ? 'bg-[#20cfff] text-[#090d18] font-bold shadow-sm'
                    : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                菌群生态网络拓扑
              </button>
              <button
                onClick={() => setActiveViewTab('taxa_list')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'taxa_list'
                    ? 'bg-[#815cff] text-white font-bold shadow-sm'
                    : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                优势/差异菌丰度表
              </button>
            </div>
            <span className="text-[10px] text-[#8996b8] hidden sm:inline pr-2">
              支持全屏展开与节点详情自适应折叠
            </span>
          </div>

          {/* Embedded Interactive Microbiome Knowledge Graph or Taxa List */}
          {activeViewTab === 'network' ? (
            <div className="rounded-xl overflow-hidden shadow-xl">
              <MicrobiomeKnowledgeGraph 
                mode="ecological" 
                compact={true}
                className="h-[540px] min-h-[480px]"
                patient={patient}
                taxa={taxa}
                ecologicalLinks={patientPackage.ecologicalLinks}
                /* 把当前选中菌种同步给图谱，否则从「丰度表」点某一行切回网络视图时，
                   图谱不会选中对应节点，跨视图联动是断的 */
                initialSelectedId={selectedTaxon?.id}
                onSelectNode={(taxon) => {
                  if (taxon && taxon.abundance !== undefined) {
                    setSelectedTaxon(taxon);
                  }
                }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl text-xs space-y-3 min-h-[480px]">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2f57]">
                <h4 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#20cfff]" />
                  宿主肠道宏基因组关键优势与失衡菌群谱 ({patient.name})
                </h4>
                <span className="text-[10px] text-[#8996b8]">mNGS 深度测序</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] text-[#8996b8] border-b border-[#1e2f57]">
                      <th className="pb-2 font-medium">菌种名称</th>
                      <th className="pb-2 font-medium">生态分类</th>
                      <th className="pb-2 font-medium text-right">当前丰度</th>
                      <th className="pb-2 font-medium text-right">正常参考</th>
                      <th className="pb-2 font-medium text-right">偏差</th>
                      <th className="pb-2 font-medium pl-3">FMT干预定植定位</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2f57]/50 text-[11px]">
                    {taxa.map((t) => (
                      <tr 
                        key={t.id} 
                        onClick={() => {
                          setSelectedTaxon(t);
                          setActiveViewTab('network');
                        }}
                        className="hover:bg-[#152347]/60 cursor-pointer transition-colors"
                      >
                        <td className="py-2">
                          <span className="font-semibold text-[#eef4ff] block">{t.chineseName}</span>
                          <span className="font-mono text-[10px] text-[#8996b8]">{t.name}</span>
                        </td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            t.category === 'beneficial' ? 'bg-[#23e6b1]/20 text-[#23e6b1]' :
                            t.category === 'pathogen' ? 'bg-[#ff536c]/20 text-[#ff536c]' :
                            t.category === 'opportunistic' ? 'bg-[#ffb84d]/20 text-[#ffb84d]' :
                            'bg-[#815cff]/20 text-[#815cff]'
                          }`}>
                            {t.category === 'beneficial' ? '有益菌' : t.category === 'pathogen' ? '致病菌' : t.category === 'opportunistic' ? '条件致病' : '中性共生'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-[#eef4ff]">
                          {t.abundance}%
                        </td>
                        <td className="py-2 text-right font-mono text-[#8996b8]">
                          {t.normalRange[0]}% - {t.normalRange[1]}%
                        </td>
                        <td className={`py-2 text-right font-mono font-bold ${
                          t.relativeChange < 0 ? 'text-[#ff536c]' : 'text-[#ffb84d]'
                        }`}>
                          {t.relativeChange > 0 ? `+${t.relativeChange}%` : `${t.relativeChange}%`}
                        </td>
                        <td className="py-2 pl-3 text-[#8996b8] text-[10px]">
                          {t.therapeuticTarget.slice(0, 24)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Core Dysbiosis Summary Card */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <h4 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-[#20cfff]" />
                微生态关键指标与失衡特征分析
              </h4>
              <span className="text-[10px] text-[#8996b8]">宏基因组二代测序 (mNGS)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">香农多样性指数</span>
                <span className="font-mono font-bold text-lg text-[#ff536c] block my-0.5">{stats.shannonDiversity.toFixed(2)} ↓</span>
                <span className="text-[10px] text-[#8996b8]">正常参考: 4.5 - 5.5</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">有益菌丰度占比</span>
                <span className="font-mono font-bold text-lg text-[#ffb84d] block my-0.5">{stats.beneficialRatio}% ↓</span>
                <span className="text-[10px] text-[#8996b8]">有益菌群严重受损</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#ff536c]/40 text-center bg-[#241121]/50">
                <span className="text-[#ff536c] text-[10px] block font-semibold">炎症/条件致病菌负荷</span>
                <span className="font-mono font-bold text-lg text-[#ff536c] block my-0.5">{stats.pathogenLoad}% ↑</span>
                <span className="text-[10px] text-[#ff536c]">致病群落过度扩张</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): FMT Adaptability Gauge & Functional Pathways */}
        <div className="lg:col-span-3 space-y-4">
          {/* FMT Adaptability Assessment Box */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#20cfff]" /> FMT 适应性安全评估
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/20 text-[#23e6b1] font-bold">
                门控通过
              </span>
            </h3>

            {/* Circular Gauge Score */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0c1429] border border-[#20cfff]/30 mb-3">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#1e2f57]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#20cfff]"
                    strokeDasharray={`${patient.adaptability.overallScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-bold font-mono text-[#eef4ff]">{patient.adaptability.overallScore}</span>
                  <span className="text-[8px] text-[#8996b8]">分值</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#eef4ff] block">
                  {patient.adaptability.overallScore >= 80 ? '高适应度 (强烈推荐)' : '中高适应度 (严密监护)'}
                </span>
                <span className="text-[10px] text-[#8996b8] leading-tight block mt-0.5">
                  {patient.adaptability.contraindications}
                </span>
              </div>
            </div>

            {/* Assessment Checklist */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">菌群失衡度:</span>
                <span className="font-mono font-bold text-[#ff536c]">{patient.adaptability.dysbiosisScore} / 100 (重度)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">黏膜炎症风险:</span>
                <span className="font-mono font-bold text-[#ffb84d]">{patient.adaptability.inflammationRisk} / 100 (评估)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">感染病原排查:</span>
                <span className="font-semibold text-[#23e6b1]">✓ {patient.clinicalMarkers.cdiffToxin ? 'C.diff 阳性(符合移植)' : '常规病原阴性'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">绝对禁忌症:</span>
                <span className="font-semibold text-[#23e6b1]">✓ 肠管无梗阻/穿孔</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8996b8]">推荐配型供体:</span>
                <span className="text-[#20cfff] font-bold">{patient.recommendedDonorCode || 'D-0102'}</span>
              </div>
            </div>
          </div>

          {/* Functional Pathways Impact */}
          <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-2.5 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#20cfff]" /> 菌群功能通路损伤评估
              </span>
              <span className="text-[10px] text-[#8996b8]">KEGG / MetaCyc</span>
            </h3>

            <div className="space-y-2">
              {pathways.slice(0, 5).map(pw => (
                <div key={pw.id} className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#eef4ff] text-[11px] truncate">{pw.name}</span>
                    <span className={`font-mono font-bold text-[11px] ${
                      pw.changePercentage < 0 ? 'text-[#ff536c]' : 'text-[#23e6b1]'
                    }`}>
                      {pw.changePercentage > 0 ? `+${pw.changePercentage}%` : `${pw.changePercentage}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8996b8] mt-1 line-clamp-1">{pw.mechanism}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Strategy Advice */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#101a33] to-[#15274d] border border-[#397cff]/50 shadow-lg text-xs">
            <div className="flex items-center gap-1.5 text-[#20cfff] font-semibold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 推荐临床策略 (AI决策辅助)
            </div>
            <p className="text-[#eef4ff] text-[11px] leading-relaxed">
              {aiAdvice}
            </p>
            <button
              onClick={() => onNavigateTab('donor_matching')}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-[#20cfff]/20 text-[#20cfff] hover:bg-[#20cfff]/30 border border-[#20cfff]/40 font-semibold text-center transition-all flex items-center justify-center gap-1 text-[11px]"
            >
              前往供体智能匹配与处方生成 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
