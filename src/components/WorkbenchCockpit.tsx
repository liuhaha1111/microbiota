import React from 'react';
import { 
  Users, 
  ClipboardCheck, 
  GitMerge, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  PieChart, 
  Microscope,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ThreeGutDigitalTwin } from './ThreeGutDigitalTwin';
import { ClinicalPatient } from '../types';
import { getPatientDataPackage } from '../data/mockMicroFmtData';

interface WorkbenchCockpitProps {
  currentPatient: ClinicalPatient;
  onSelectPatient: (patient: ClinicalPatient) => void;
  onNavigateTab: (tabId: any) => void;
}

export const WorkbenchCockpit: React.FC<WorkbenchCockpitProps> = ({
  currentPatient,
  onSelectPatient,
  onNavigateTab
}) => {
  const patientData = getPatientDataPackage(currentPatient.id);
  const isHighRisk = currentPatient.riskLevel === 'high';

  return (
    <div id="workbench-cockpit-container" className="space-y-4">
      {/* 1. Top Core Metrics Bar */}
      <div id="workbench-kpi-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8996b8] text-xs">
            <span>今日在管患者</span>
            <Users className="w-4 h-4 text-[#20cfff]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#eef4ff]">28</span>
            <span className="text-[11px] text-[#23e6b1] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +3 新增
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#20cfff] to-transparent opacity-60"></div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8996b8] text-xs">
            <span>待 FMT 评估</span>
            <ClipboardCheck className="w-4 h-4 text-[#397cff]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#eef4ff]">12</span>
            <span className="text-[11px] text-[#ffb84d]">需医师核准</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#397cff] to-transparent opacity-60"></div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8996b8] text-xs">
            <span>待供体匹配</span>
            <GitMerge className="w-4 h-4 text-[#815cff]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#eef4ff]">8</span>
            <span className="text-[11px] text-[#20cfff]">AI配型就绪</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#815cff] to-transparent opacity-60"></div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8996b8] text-xs">
            <span>移植治疗进行中</span>
            <Activity className="w-4 h-4 text-[#23e6b1]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#eef4ff]">36</span>
            <span className="text-[11px] text-[#8996b8]">定植监测期</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#23e6b1] to-transparent opacity-60"></div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-[#8996b8] text-xs">
            <span>需风险复评</span>
            <AlertTriangle className="w-4 h-4 text-[#ffb84d]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#ffb84d]">5</span>
            <span className="text-[11px] text-[#ffb84d]">定植迟缓</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ffb84d] to-transparent opacity-60"></div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#ff536c]/40 shadow-lg relative overflow-hidden bg-gradient-to-b from-[#101a33] to-[#241121]">
          <div className="flex items-center justify-between text-[#ff536c] text-xs">
            <span className="font-semibold">红线异常预警</span>
            <AlertTriangle className="w-4 h-4 text-[#ff536c] animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#ff536c]">3</span>
            <span className="text-[11px] text-[#ff536c]">即刻干预</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff536c] to-transparent opacity-80"></div>
        </div>
      </div>

      {/* 2. Main Hero Visualization: 3D Gut Microbiome Digital Twin & Cockpit Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Cols: Large 3D Digital Twin Visual Stage */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#20cfff] animate-ping" />
                <h3 className="text-sm font-bold text-[#eef4ff] tracking-wide flex items-center gap-2">
                  Gut Microbiome Digital Twin
                  <span className="text-xs font-normal text-[#20cfff] font-mono">肠道微生态3D数字孪生舱</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8996b8]">
                <span>实时映射受体:</span>
                <span className="font-semibold text-[#eef4ff] px-2 py-0.5 rounded bg-[#151f3d] border border-[#2b4170]/50">
                  {currentPatient.name} ({currentPatient.primaryDiagnosis.split(' ')[0]})
                </span>
                <button
                  onClick={() => onNavigateTab('patient_center')}
                  className="text-[#20cfff] hover:underline flex items-center text-xs ml-1"
                >
                  深入画像 <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3D WebGL Canvas */}
            <ThreeGutDigitalTwin className="h-[490px]" patient={currentPatient} />
          </div>

          {/* Treatment Path Pipeline */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#20cfff]" />
                全流程患者治疗路径分布 (Patient Pathway Distribution)
              </span>
              <span className="text-[#8996b8]">总计在管 197 例</span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {[
                { stage: '1. 临床评估', count: 28, percent: '14%', color: 'border-[#397cff] text-[#397cff]' },
                { stage: '2. 菌群测序', count: 19, percent: '10%', color: 'border-[#20cfff] text-[#20cfff]' },
                { stage: '3. 供体匹配', count: 14, percent: '7%', color: 'border-[#815cff] text-[#815cff]' },
                { stage: '4. FMT执行', count: 36, percent: '18%', color: 'border-[#23e6b1] text-[#23e6b1]' },
                { stage: '5. 定植随访', count: 52, percent: '26%', color: 'border-[#ffb84d] text-[#ffb84d]' },
                { stage: '6. 疗效评价', count: 48, percent: '25%', color: 'border-[#20cfff] text-[#eef4ff]' },
              ].map((p, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg bg-[#0c1429] border ${p.color} flex flex-col justify-between text-xs`}>
                  <span className="text-[11px] text-[#8996b8] truncate">{p.stage}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-bold font-mono text-[#eef4ff]">{p.count}</span>
                    <span className="text-[10px] text-[#8996b8]">{p.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Cohort Distribution & Real-Time Alerts */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Disease Cohort Distribution */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <h4 className="text-xs font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-[#20cfff]" />
                适应症疾病队列分布
              </h4>
              <span className="text-[11px] text-[#8996b8]">真实世界队列</span>
            </div>

            <div className="space-y-3">
              {[
                { name: '溃疡性结肠炎 (UC)', count: 83, share: 42, color: 'bg-[#20cfff]' },
                { name: '复发性艰难梭菌感染 (rCDI)', count: 47, share: 24, color: 'bg-[#ff536c]' },
                { name: '肠易激综合征 (IBS-D/C)', count: 35, share: 18, color: 'bg-[#815cff]' },
                { name: '克罗恩病与未定型IBD', count: 22, share: 11, color: 'bg-[#ffb84d]' },
                { name: '神经微生态队列 (ASD/PD)', count: 10, share: 5, color: 'bg-[#23e6b1]' },
              ].map((cohort, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-[#8996b8]">
                    <span className="text-[#eef4ff] font-medium">{cohort.name}</span>
                    <span className="font-mono">{cohort.count}例 ({cohort.share}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0c1429] overflow-hidden">
                    <div className={`h-full rounded-full ${cohort.color}`} style={{ width: `${cohort.share}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Alerts & Risk Re-evaluation */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
                <h4 className="text-xs font-semibold text-[#ff536c] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff536c]" />
                  临床风险预警与再决策推送
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#ff536c]/20 text-[#ff536c] font-bold">
                  3条待处理
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Dynamic Patient Specific Alert */}
                <div className="p-2.5 rounded-lg bg-[#241121] border border-[#ff536c]/50 text-xs shadow-md">
                  <div className="flex items-center justify-between text-[#ff536c] font-bold text-[11px] mb-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff536c] animate-ping" />
                      当前受体重点警报 ({currentPatient.id})
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff536c]/30 text-[#ff536c] font-medium">高优先级</span>
                  </div>
                  <p className="text-[#eef4ff] text-[11px] leading-relaxed">
                    <strong>{currentPatient.name}</strong>: {currentPatient.chiefComplaint}。
                    微生态特征：{currentPatient.microbiomeSummary?.dominantDysbiosis || '菌群失衡明显'}。
                  </p>
                  <div className="mt-2 flex justify-between items-center text-[10px]">
                    <span className="text-[#ffb84d]">主治: {currentPatient.attendingPhysician}</span>
                    <button 
                      onClick={() => onNavigateTab('patient_center')}
                      className="text-[#20cfff] hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      调阅患者画像 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Patient Protocol / Matching Status */}
                <div className="p-2.5 rounded-lg bg-[#1a1c29] border border-[#20cfff]/40 text-xs">
                  <div className="flex items-center justify-between text-[#20cfff] font-bold text-[11px] mb-1">
                    <span>供体配型方案 ({currentPatient.recommendedDonorCode || 'D-0102'})</span>
                    <span className="text-[#23e6b1]">{currentPatient.currentPhase}</span>
                  </div>
                  <p className="text-[#8996b8] text-[11px] leading-relaxed">
                    针对受体 {currentPatient.name} 的微生态缺损特征，已定制肠溶胶囊及菌液灌肠联合定植方案。
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => onNavigateTab('donor_matching')}
                      className="text-[10px] text-[#20cfff] hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      查看配型方案 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Follow-up / Trajectory */}
                <div className="p-2.5 rounded-lg bg-[#101a33] border border-[#2b4170]/60 text-xs">
                  <div className="flex items-center justify-between text-[#23e6b1] font-bold text-[11px] mb-1">
                    <span>{currentPatient.name} 的疗效随访与重构轨道</span>
                    <span>最新: {currentPatient.lastFollowUp}</span>
                  </div>
                  <p className="text-[#8996b8] text-[11px] leading-relaxed">
                    钙卫蛋白(FC) {currentPatient.clinicalMarkers.fecalCalprotectin.value} μg/g，CRP {currentPatient.clinicalMarkers.crp.value} mg/L。
                  </p>
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => onNavigateTab('efficacy_tracker')}
                      className="text-[10px] text-[#23e6b1] hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      查看重构追踪 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick entry to knowledge graph */}
            <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-[#101a33] to-[#17254d] border border-[#397cff]/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#eef4ff] block">微生态与疾病知识图谱</span>
                <span className="text-[10px] text-[#8996b8]">探索菌种-代谢通路-免疫靶点拓扑</span>
              </div>
              <button
                onClick={() => onNavigateTab('knowledge_graph')}
                className="px-3 py-1 rounded bg-[#20cfff] text-[#090d18] text-xs font-bold hover:brightness-110 transition-all shadow-md"
              >
                探索图谱
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
