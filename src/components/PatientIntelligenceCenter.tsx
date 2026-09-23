import React, { useState } from 'react';
import {
  FileText,
  Activity,
  TrendingUp,
  Dna,
  ShieldAlert,
  Sparkles,
  Layers,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { ClinicalPatient, MicrobialTaxon } from '../types';
import { getPatientDataPackage } from '../data/mockMicroFmtData';
import { MicrobiomeKnowledgeGraph } from './MicrobiomeKnowledgeGraph';
import { ContextBar, SecondaryNav, SecondaryNavItem, SegmentedControl, ScreenSlotBadge } from './ui';

interface PatientIntelligenceCenterProps {
  patient: ClinicalPatient;
}

type PatientTab = 'clinical' | 'microbiome' | 'pathway';
type MicrobiomeView = 'network' | 'taxa_list';

const PATIENT_TABS: ReadonlyArray<SecondaryNavItem<PatientTab>> = [
  { id: 'clinical', label: '临床画像', icon: FileText, hint: '检验指标、病史、用药与过敏警示' },
  { id: 'microbiome', label: '菌群画像', icon: Dna, hint: '生态网络、优势菌丰度表与失衡特征' },
  { id: 'pathway', label: '功能通路', icon: Layers, hint: '通路损伤评估与 FMT 适应性安全评估' }
];

/**
 * 可视化形式切换（同一份菌群数据的两种画法），层级低于内容 Tab，
 * 因此用 SegmentedControl 而非 SecondaryNav，且只在「菌群画像」切面内出现。
 */
const MICROBIOME_VIEWS: ReadonlyArray<{ id: MicrobiomeView; label: string; icon: typeof Dna }> = [
  { id: 'network', label: '菌群生态网络拓扑', icon: Dna },
  { id: 'taxa_list', label: '优势/差异菌丰度表', icon: Layers }
];

export const PatientIntelligenceCenter: React.FC<PatientIntelligenceCenterProps> = ({ patient }) => {
  const patientPackage = getPatientDataPackage(patient.id);
  const taxa = patientPackage.taxa;
  const pathways = patientPackage.pathways;
  const stats = patientPackage.microbiomeStats;
  const aiAdvice = patientPackage.aiAdvice;

  const [activeTab, setActiveTab] = useState<PatientTab>('clinical');
  const [microbiomeView, setMicrobiomeView] = useState<MicrobiomeView>('network');
  const [selectedTaxon, setSelectedTaxon] = useState<MicrobialTaxon>(taxa[0] || ({} as MicrobialTaxon));

  React.useEffect(() => {
    if (taxa.length > 0) {
      setSelectedTaxon(taxa[0]);
    }
    // 换患者时只同步数据，不重置当前切面——用户选定的切面不应被患者切换打断
  }, [patient.id]);

  const markers = patient.clinicalMarkers;

  return (
    <div id="patient-intelligence-center" className="space-y-4">
      {/* 常驻上下文栏：患者身份 + 首屏优先的关键指标。
          分屏后本屏不再向外跳转，患者基线必须常驻，否则任一 Tab 都缺少判断依据。 */}
      <ContextBar
        icon={UserCheck}
        title={patient.name}
        subtitle={`${patient.primaryDiagnosis} · 主管医师 ${patient.attendingPhysician} · 最近随访 ${patient.lastFollowUp}`}
        badges={
          <>
            <ScreenSlotBadge slot={2} />
            <span className="text-xs px-2 py-0.5 rounded bg-[#151f3d] text-[#8996b8] border border-[#2b4170]/40 font-mono">
              {patient.gender} · {patient.age}岁 · {patient.mrn}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#20cfff]/15 text-[#20cfff] border border-[#20cfff]/40">
              {patient.currentPhase}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                patient.riskLevel === 'high'
                  ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/40'
                  : 'bg-[#ffb84d]/20 text-[#ffb84d] border border-[#ffb84d]/40'
              }`}
            >
              {patient.riskLevel === 'high' ? '高危重症' : '中度活动期'}
            </span>
          </>
        }
        metrics={[
          { label: 'CRP', value: `${markers.crp.value} mg/L`, tone: 'danger' },
          { label: '粪便钙卫蛋白', value: `${markers.fecalCalprotectin.value} μg/g`, tone: 'danger' },
          { label: 'BMI', value: markers.bmi.value, tone: 'warn' },
          { label: 'FMT 适应度', value: patient.adaptability.overallScore, tone: 'info' }
        ]}
      />

      <SecondaryNav
        items={PATIENT_TABS}
        active={activeTab}
        onChange={setActiveTab}
        trailing="菌群检测: mNGS 深度测序 · 通路注释 KEGG / MetaCyc"
      />

      {/* ============ 切面一：临床画像 ============ */}
      {activeTab === 'clinical' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 重点临床检验指标 */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#20cfff]" /> 重点临床检验指标
              </span>
              <span className="text-[10px] text-[#8996b8]">最新检验</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8996b8] text-[11px] block">C-反应蛋白 (CRP)</span>
                  <span className="text-[10px] text-[#8996b8]">参考: &lt;5.0 mg/L</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#ff536c] flex items-center gap-0.5 justify-end">
                    {markers.crp.value} {markers.crp.unit}
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#ff536c]">重度升高</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#241121] border border-[#ff536c]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#ff536c] font-semibold text-[11px] block">粪便钙卫蛋白 (FC)</span>
                  <span className="text-[10px] text-[#8996b8]">肠黏膜活动性溃疡核心指标</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-base text-[#ff536c] flex items-center gap-0.5 justify-end">
                    {markers.fecalCalprotectin.value} μg/g
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] text-[#ff536c] font-bold">参考: &lt;50 μg/g</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8996b8] text-[11px] block">血沉 (ESR)</span>
                  <span className="text-[10px] text-[#8996b8]">参考: 0-15 mm/h</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#ffb84d] flex items-center gap-0.5 justify-end">
                    {markers.esr.value} mm/h
                    <TrendingUp className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] text-[#ffb84d]">显著升高</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-xs">
                  <span className="text-[#8996b8] text-[10px] block">血清白蛋白</span>
                  <span className="font-mono font-bold text-sm text-[#ffb84d]">{markers.albumin.value} g/L</span>
                  <span className="text-[9px] text-[#ffb84d] block">轻度低蛋白血症</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-xs">
                  <span className="text-[#8996b8] text-[10px] block">体质指数 (BMI)</span>
                  <span className="font-mono font-bold text-sm text-[#ff536c]">{markers.bmi.value}</span>
                  <span className="text-[9px] text-[#ff536c] block">消瘦消耗状态</span>
                </div>
              </div>
            </div>
          </div>

          {/* 临床病史与诊断表型 */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 border-b border-[#1e2f57] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#20cfff]" /> 临床病史与诊断表型
            </h3>

            <div>
              <span className="text-[10px] text-[#8996b8] block">主诉与现病史:</span>
              <p className="text-[#eef4ff] text-[11px] leading-relaxed mt-0.5 bg-[#0c1429] p-2.5 rounded border border-[#2b4170]/30">
                {patient.chiefComplaint}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#8996b8] block mb-1">疾病特征标签:</span>
                <div className="flex flex-wrap gap-1">
                  {patient.diagnosticTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#152347] text-[#20cfff] text-[10px] border border-[#20cfff]/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#8996b8] block mb-1">近期维持用药:</span>
                <div className="space-y-1">
                  {patient.pastMedications.map((med, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded bg-[#0c1429] text-[#eef4ff] text-[11px] border border-[#2b4170]/30"
                    >
                      {med}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#241121] border border-[#ff536c]/30 text-[11px]">
              <span className="text-[#ff536c] font-semibold flex items-center gap-1 mb-0.5">
                <AlertCircle className="w-3.5 h-3.5" /> 药物/食物过敏警示:
              </span>
              <p className="text-[#eef4ff]">{patient.allergies.join('、') || '无已知严重超敏史'}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">疾病分期</span>
                <span className="text-[#eef4ff] text-[11px] font-semibold block mt-0.5">{patient.stage}</span>
              </div>
              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">前白蛋白</span>
                <span className="font-mono text-[#eef4ff] text-[11px] font-semibold block mt-0.5">
                  {markers.prealbumin.value} {markers.prealbumin.unit}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">营养风险</span>
                <span className="text-[#ffb84d] text-[11px] font-semibold block mt-0.5">
                  {patient.adaptability.nutritionalRisk}
                </span>
              </div>
              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">禁忌症</span>
                <span className="text-[#23e6b1] text-[11px] font-semibold block mt-0.5">
                  {patient.adaptability.contraindications}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ 切面二：菌群画像 ============ */}
      {activeTab === 'microbiome' && (
        <div className="space-y-4">
          <SegmentedControl
            items={MICROBIOME_VIEWS}
            active={microbiomeView}
            onChange={setMicrobiomeView}
            trailing="支持全屏展开与节点详情自适应折叠"
          />

          {microbiomeView === 'network' ? (
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
                onSelectNode={taxon => {
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
                <span className="text-[10px] text-[#8996b8]">mNGS 深度测序 · 共 {taxa.length} 株</span>
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
                    {taxa.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => {
                          setSelectedTaxon(t);
                          setMicrobiomeView('network');
                        }}
                        className="hover:bg-[#152347]/60 cursor-pointer transition-colors"
                      >
                        <td className="py-2">
                          <span className="font-semibold text-[#eef4ff] block">{t.chineseName}</span>
                          <span className="font-mono text-[10px] text-[#8996b8]">{t.name}</span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              t.category === 'beneficial'
                                ? 'bg-[#23e6b1]/20 text-[#23e6b1]'
                                : t.category === 'pathogen'
                                ? 'bg-[#ff536c]/20 text-[#ff536c]'
                                : t.category === 'opportunistic'
                                ? 'bg-[#ffb84d]/20 text-[#ffb84d]'
                                : 'bg-[#815cff]/20 text-[#815cff]'
                            }`}
                          >
                            {t.category === 'beneficial'
                              ? '有益菌'
                              : t.category === 'pathogen'
                              ? '致病菌'
                              : t.category === 'opportunistic'
                              ? '条件致病'
                              : '中性共生'}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-[#eef4ff]">{t.abundance}%</td>
                        <td className="py-2 text-right font-mono text-[#8996b8]">
                          {t.normalRange[0]}% - {t.normalRange[1]}%
                        </td>
                        <td
                          className={`py-2 text-right font-mono font-bold ${
                            t.relativeChange < 0 ? 'text-[#ff536c]' : 'text-[#ffb84d]'
                          }`}
                        >
                          {t.relativeChange > 0 ? `+${t.relativeChange}%` : `${t.relativeChange}%`}
                        </td>
                        <td className="py-2 pl-3 text-[#8996b8] text-[10px]">{t.therapeuticTarget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 微生态关键指标与失衡特征分析 */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <h4 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <Dna className="w-3.5 h-3.5 text-[#20cfff]" />
                微生态关键指标与失衡特征分析
              </h4>
              <span className="text-[10px] text-[#8996b8]">宏基因组二代测序 (mNGS)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">香农多样性指数</span>
                <span className="font-mono font-bold text-lg text-[#ff536c] block my-0.5">
                  {stats.shannonDiversity.toFixed(2)} ↓
                </span>
                <span className="text-[10px] text-[#8996b8]">正常参考: 4.5 - 5.5</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">有益菌丰度占比</span>
                <span className="font-mono font-bold text-lg text-[#ffb84d] block my-0.5">
                  {stats.beneficialRatio}% ↓
                </span>
                <span className="text-[10px] text-[#8996b8]">有益菌群严重受损</span>
              </div>

              <div className="p-2.5 rounded-lg border border-[#ff536c]/40 text-center bg-[#241121]/50">
                <span className="text-[#ff536c] text-[10px] block font-semibold">炎症/条件致病菌负荷</span>
                <span className="font-mono font-bold text-lg text-[#ff536c] block my-0.5">
                  {stats.pathogenLoad}% ↑
                </span>
                <span className="text-[10px] text-[#ff536c]">致病群落过度扩张</span>
              </div>
            </div>

            <p className="mt-3 pt-2.5 border-t border-[#1e2f57] text-[10px] text-[#8996b8] leading-relaxed">
              <span className="text-[#eef4ff] font-semibold">失衡主导特征：</span>
              {stats.dominantFeature} · 病变累及节段{' '}
              <span className="font-mono text-[#20cfff]">{stats.lesionSegment}</span>
            </p>
          </div>
        </div>
      )}

      {/* ============ 切面三：功能通路 ============ */}
      {activeTab === 'pathway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* FMT 适应性安全评估 */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#20cfff]" /> FMT 适应性安全评估
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/20 text-[#23e6b1] font-bold">
                门控通过
              </span>
            </h3>

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
                  <span className="text-sm font-bold font-mono text-[#eef4ff]">
                    {patient.adaptability.overallScore}
                  </span>
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

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">菌群失衡度:</span>
                <span className="font-mono font-bold text-[#ff536c]">
                  {patient.adaptability.dysbiosisScore} / 100 (重度)
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">黏膜炎症风险:</span>
                <span className="font-mono font-bold text-[#ffb84d]">
                  {patient.adaptability.inflammationRisk} / 100 (评估)
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">感染病原排查:</span>
                <span className="font-semibold text-[#23e6b1]">✓ {patient.adaptability.infectionScreening}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">绝对禁忌症:</span>
                <span className="font-semibold text-[#23e6b1]">✓ 肠管无梗阻/穿孔</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1e2f57]/60">
                <span className="text-[#8996b8]">营养风险分级:</span>
                <span className="font-semibold text-[#ffb84d]">{patient.adaptability.nutritionalRisk}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8996b8]">推荐配型供体:</span>
                <span className="text-[#20cfff] font-bold font-mono">
                  {patient.recommendedDonorCode || 'D-0102'}
                </span>
              </div>
            </div>
          </div>

          {/* 菌群功能通路损伤评估 */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <h3 className="text-xs font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#20cfff]" /> 菌群功能通路损伤评估
              </span>
              <span className="text-[10px] text-[#8996b8]">KEGG / MetaCyc · 共 {pathways.length} 条通路</span>
            </h3>

            <div className="space-y-2">
              {pathways.map(pw => (
                <div key={pw.id} className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-[#eef4ff] text-[11px] flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] shrink-0 ${
                          pw.category === '代谢功能'
                            ? 'bg-[#20cfff]/15 text-[#20cfff]'
                            : pw.category === '免疫调节'
                            ? 'bg-[#815cff]/15 text-[#815cff]'
                            : pw.category === '屏障保护'
                            ? 'bg-[#23e6b1]/15 text-[#23e6b1]'
                            : 'bg-[#ff536c]/15 text-[#ff536c]'
                        }`}
                      >
                        {pw.category}
                      </span>
                      <span className="truncate">{pw.name}</span>
                    </span>
                    <span
                      className={`font-mono font-bold text-[11px] shrink-0 ${
                        pw.changePercentage < 0 ? 'text-[#ff536c]' : 'text-[#23e6b1]'
                      }`}
                    >
                      {pw.changePercentage > 0 ? `+${pw.changePercentage}%` : `${pw.changePercentage}%`}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    <p className="text-[10px] text-[#8996b8] leading-relaxed flex-1">{pw.mechanism}</p>
                    <span className="text-[10px] text-[#8996b8] shrink-0 font-mono">
                      相关度 {pw.relevanceScore}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-[#0c1429] mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pw.status === 'suppressed'
                          ? 'bg-[#ff536c]'
                          : pw.status === 'activated'
                          ? 'bg-[#ffb84d]'
                          : 'bg-[#23e6b1]'
                      }`}
                      style={{ width: `${Math.min(100, pw.relevanceScore)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 推荐临床策略（AI 决策辅助）—— 原先的跳转按钮改为屏内结论 */}
          <div className="lg:col-span-12 p-4 rounded-xl bg-gradient-to-br from-[#101a33] to-[#15274d] border border-[#397cff]/50 shadow-lg text-xs">
            <div className="flex items-center gap-1.5 text-[#20cfff] font-semibold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 推荐临床策略 (AI决策辅助)
            </div>
            <p className="text-[#eef4ff] text-[11px] leading-relaxed">{aiAdvice}</p>
            <p className="mt-2.5 pt-2.5 border-t border-[#397cff]/25 text-[10px] text-[#8996b8] leading-relaxed">
              <span className="text-[#ffb84d] font-semibold">本模块不替代医生最终决策。</span>
              供受体配型与处方参数在「供受体智能匹配」屏独立完成，本屏结论仅作为其输入依据。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
