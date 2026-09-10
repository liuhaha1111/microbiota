import React, { useState } from 'react';
import { 
  LineChart, 
  Clock, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  ArrowRight,
  Info,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { ClinicalPatient, LongitudinalTrackPoint } from '../types';
import { mockLongitudinalPoints } from '../data/mockMicroFmtData';

interface EfficacyReconstructionTrackerProps {
  patient: ClinicalPatient;
  onNavigateTab: (tabId: any) => void;
}

export const EfficacyReconstructionTracker: React.FC<EfficacyReconstructionTrackerProps> = ({
  patient,
  onNavigateTab
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(3); // Default to Week 4
  const activePoint: LongitudinalTrackPoint = mockLongitudinalPoints[selectedStageIndex];

  return (
    <div id="efficacy-reconstruction-tracker" className="space-y-4">
      {/* 1. Top Longitudinal Time Axis Bar */}
      <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#eef4ff] flex items-center gap-2">
              <LineChart className="w-5 h-5 text-[#20cfff]" />
              FMT 疗效与肠道菌群重构时序监测中心
            </h2>
            <p className="text-xs text-[#8996b8] mt-0.5">
              受体: <span className="text-[#eef4ff] font-semibold">{patient.name}</span> · 追踪微生态重塑是否早于并驱动临床黏膜愈合
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-[#23e6b1]/15 text-[#23e6b1] border border-[#23e6b1]/30 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 临床深度缓解态
            </span>
          </div>
        </div>

        {/* Interactive Milestones Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {mockLongitudinalPoints.map((pt, idx) => {
            const isSelected = selectedStageIndex === idx;
            const isPast = idx <= selectedStageIndex;

            return (
              <div
                key={pt.stage}
                onClick={() => setSelectedStageIndex(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-all border text-xs flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.3)]'
                    : isPast
                    ? 'bg-[#0c1429] border-[#2b4170]/70 hover:bg-[#101a33]'
                    : 'bg-[#080d1c] border-[#1e2f57]/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#eef4ff] text-xs">{pt.label}</span>
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#20cfff]' : isPast ? 'bg-[#23e6b1]' : 'bg-[#8996b8]'}`}></span>
                  </div>
                  <span className="text-[10px] text-[#8996b8] font-mono">{pt.date}</span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#1e2f57]/80 flex justify-between items-baseline text-[10px]">
                  <span className="text-[#8996b8]">定植率:</span>
                  <span className="font-mono font-bold text-[#20cfff]">{pt.donorEngraftmentRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Four Core Monitoring Tracks: Diversity | Engraftment | Inflammation | Mayo Score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Track 1: Shannon Diversity */}
        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
          <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
            <span>轨道一: 菌群多样性 (Shannon)</span>
            <span className="text-[10px] text-[#23e6b1] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +110%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-[#eef4ff]">
              {activePoint.shannonDiversity.toFixed(2)}
            </span>
            <span className="text-xs text-[#8996b8]">基线: 2.15 ➔ 目标: 4.5+</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#397cff] to-[#20cfff]"
              style={{ width: `${(activePoint.shannonDiversity / 5.0) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Track 2: Donor Engraftment Rate */}
        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
          <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
            <span>轨道二: 供体菌定植率 (Engraftment)</span>
            <span className="text-[10px] text-[#20cfff]">超级供体D-0102</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-[#20cfff]">
              {activePoint.donorEngraftmentRate}%
            </span>
            <span className="text-xs text-[#23e6b1]">稳态高效定植</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#20cfff]"
              style={{ width: `${activePoint.donorEngraftmentRate}%` }}
            ></div>
          </div>
        </div>

        {/* Track 3: Fecal Calprotectin */}
        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
          <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
            <span>轨道三: 粪便钙卫蛋白 (FC)</span>
            <span className="text-[10px] text-[#23e6b1] flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -74% 骤降
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-[#ffb84d]">
              {activePoint.fecalCalprotectin} <span className="text-xs text-[#8996b8] font-normal">μg/g</span>
            </span>
            <span className="text-xs text-[#8996b8]">基线: 632 μg/g</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#ffb84d]"
              style={{ width: `${Math.min(100, (activePoint.fecalCalprotectin / 650) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Track 4: Clinical Mayo Score */}
        <div className="p-3.5 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg">
          <div className="flex justify-between items-center text-[#8996b8] text-xs mb-1">
            <span>轨道四: 临床 Mayo 症状评分</span>
            <span className="text-[10px] text-[#23e6b1]">临床缓解</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-[#23e6b1]">
              {activePoint.mayoScore} <span className="text-xs text-[#8996b8] font-normal">/ 12分</span>
            </span>
            <span className="text-xs text-[#23e6b1]">无便血，便次恢复</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0c1429] mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#23e6b1]"
              style={{ width: `${(activePoint.mayoScore / 12) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. Deep Analysis Grid: Taxonomic Succession Stacked Trends | Functional Recovery | Re-Decision Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Taxonomic Shift & Multi-phase Trends */}
        <div className="lg:col-span-7 space-y-4">
          {/* Taxonomic Phylum / Genus Progression */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2f57]">
              <h3 className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#20cfff]" />
                门/属水平菌群重构演替与对比
              </h3>
              <span className="text-[10px] text-[#8996b8]">全阶段宏基因组相对丰度变化</span>
            </div>

            {/* Visual comparative bar representing phylum shifts */}
            <div className="space-y-3">
              {mockLongitudinalPoints.map((pt, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] text-[#8996b8]">
                    <span className={`font-medium ${idx === selectedStageIndex ? 'text-[#20cfff] font-bold' : 'text-[#eef4ff]'}`}>
                      {pt.label}
                    </span>
                    <span className="font-mono text-[10px]">
                      有益菌: {pt.dominantBeneficialRatio}% | 钙卫蛋白: {pt.fecalCalprotectin} μg/g
                    </span>
                  </div>

                  {/* Multi-segment stacked bar */}
                  <div className="w-full h-3 rounded bg-[#0c1429] flex overflow-hidden border border-[#1e2f57]/50">
                    {/* Firmicutes / Beneficial (Cyan) */}
                    <div 
                      className="h-full bg-[#20cfff] transition-all"
                      style={{ width: `${pt.dominantBeneficialRatio * 0.7}%` }}
                      title={`厚壁菌门 (产丁酸): ${(pt.dominantBeneficialRatio * 0.7).toFixed(1)}%`}
                    />
                    {/* Bacteroidetes (Purple) */}
                    <div 
                      className="h-full bg-[#815cff] transition-all"
                      style={{ width: `${Math.max(15, 40 - idx * 3)}%` }}
                      title="拟杆菌门"
                    />
                    {/* Actinobacteria / Bifido (Green) */}
                    <div 
                      className="h-full bg-[#23e6b1] transition-all"
                      style={{ width: `${10 + idx * 3}%` }}
                      title="双歧杆菌等"
                    />
                    {/* Proteobacteria / Pathogen (Red) */}
                    <div 
                      className="h-full bg-[#ff536c] transition-all"
                      style={{ width: `${Math.max(3, 42 - idx * 7)}%` }}
                      title={`变形菌门 (致病/炎症): ${Math.max(3, 42 - idx * 7)}%`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-2.5 border-t border-[#1e2f57] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#8996b8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#20cfff]"></span> 厚壁菌门 (普氏菌/AKK)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#815cff]"></span> 拟杆菌门
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#23e6b1]"></span> 放线菌门 (双歧杆菌)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#ff536c]"></span> 变形菌门 (大肠埃希菌等)
              </span>
            </div>
          </div>

          {/* Functional Recovery Trends */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs">
            <h3 className="font-semibold text-[#eef4ff] pb-2 mb-3 border-b border-[#1e2f57] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#20cfff]" />
              微生态功能恢复与炎症下调趋势
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">SCFA短链脂肪酸合成</span>
                <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+160%</span>
                <span className="text-[10px] text-[#8996b8]">结肠上皮供能恢复</span>
              </div>

              <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">次级胆汁酸生成</span>
                <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+138%</span>
                <span className="text-[10px] text-[#8996b8]">定植抗力重建</span>
              </div>

              <div className="p-2.5 rounded bg-[#0c1429] border border-[#2b4170]/40 text-center">
                <span className="text-[#8996b8] text-[10px] block">黏膜物理屏障</span>
                <span className="font-mono font-bold text-sm text-[#23e6b1] block my-1">+114%</span>
                <span className="text-[10px] text-[#8996b8]">Claudin-1紧密连接</span>
              </div>

              <div className="p-2.5 rounded bg-[#0c1429] border border-[#ff536c]/40 text-center bg-[#241121]/40">
                <span className="text-[#ff536c] text-[10px] block font-semibold">炎症相关LPS通路</span>
                <span className="font-mono font-bold text-sm text-[#ff536c] block my-1">-72%</span>
                <span className="text-[10px] text-[#ff536c]">内毒素负荷消退</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Decision & Alert Re-Evaluation Engine */}
        <div className="lg:col-span-5 space-y-4">
          {/* Re-decision Core Engine Box */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2f57]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#20cfff]" />
                <h3 className="font-bold text-[#eef4ff] text-sm">临床再决策引擎 (Re-Decision)</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#23e6b1]/20 text-[#23e6b1] font-bold text-[10px]">
                稳态达标
              </span>
            </div>

            <p className="text-[#8996b8] text-[11px] leading-relaxed">
              基于菌群定植率、粪便钙卫蛋白变化与患者排便频率，系统自动计算下一步临床干预路径：
            </p>

            {/* Decision Pathways */}
            <div className="space-y-2">
              {/* Option 1: Continue Maintenance Follow-up (Selected) */}
              <div className="p-3 rounded-lg bg-[#0c1e38] border border-[#20cfff] shadow-[0_0_12px_rgba(32,207,255,0.2)]">
                <div className="flex items-center justify-between font-bold text-xs text-[#20cfff] mb-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#23e6b1]" />
                    决策建议 A：维持定期随访与益生元巩固
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#20cfff]/20 text-[#20cfff]">推荐</span>
                </div>
                <p className="text-[#eef4ff] text-[11px] leading-relaxed">
                  患者第4周已达到临床缓解 (FC降至165，多样性指数提升至4.10)，定植率达到74%。无需立即追加FMT，继续维持口服高纤维抗性淀粉与低剂量美沙拉嗪。
                </p>
              </div>

              {/* Option 2: Booster FMT trigger rules */}
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 opacity-80">
                <div className="flex items-center justify-between text-[#8996b8] font-semibold text-[11px] mb-0.5">
                  <span>决策触发 B：追加单剂强化 FMT 规则门槛</span>
                  <span className="text-[10px] text-[#8996b8]">未触发</span>
                </div>
                <p className="text-[10px] text-[#8996b8]">
                  触发条件：随访期定植率连续2次下降 &gt;15%，或 FC 再次反弹超过 250 μg/g。
                </p>
              </div>

              {/* Option 3: Non-microbial exploration */}
              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 opacity-80">
                <div className="flex items-center justify-between text-[#8996b8] font-semibold text-[11px] mb-0.5">
                  <span>决策提示 C：排查非菌群驱动因素</span>
                  <span className="text-[10px] text-[#8996b8]">未触发</span>
                </div>
                <p className="text-[10px] text-[#8996b8]">
                  若菌群重构达标但腹痛无缓解，提示评估肠易激内脏敏感或纤维狭窄等非微生态因素。
                </p>
              </div>
            </div>
          </div>

          {/* Adverse Events & Tolerance Log */}
          <div className="p-4 rounded-xl bg-[#101a33] border border-[#2b4170]/60 shadow-lg text-xs space-y-2">
            <h3 className="font-semibold text-[#eef4ff] pb-1.5 border-b border-[#1e2f57] flex items-center justify-between">
              <span>不良事件与患者耐受性记录 (Safety Log)</span>
              <span className="text-[#23e6b1] text-[10px] font-bold">无严重不良事件 (SAE: 0)</span>
            </h3>

            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
                <div>
                  <span className="font-medium text-[#eef4ff]">轻微腹胀 (排气增多)</span>
                  <span className="text-[10px] text-[#8996b8] block">FMT #1 次日出现，持续18小时自行消退</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/15 text-[#23e6b1]">轻度 / 已缓解</span>
              </div>

              <div className="p-2 rounded bg-[#0c1429] border border-[#2b4170]/40 flex justify-between items-center">
                <div>
                  <span className="font-medium text-[#eef4ff]">一过性低热 (37.4°C)</span>
                  <span className="text-[10px] text-[#8996b8] block">多饮水后正常，血培养阴性</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#23e6b1]/15 text-[#23e6b1]">轻度 / 已恢复</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
