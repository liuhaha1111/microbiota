import React from 'react';
import { AlertTriangle, Star, Stethoscope } from 'lucide-react';
import { HistoricalSample, SimilarityResult } from '../../types';
import { hasSafetyConcern } from '../../data/historicalSamples';
import { MiniRadar3, OutcomeBadge, RouteTag, ScoreGauge, Tag, toneColor, UI } from './historyUi';

interface HistorySampleCardProps {
  sample: HistoricalSample;
  similarity: SimilarityResult;
  selected: boolean;
  favorited?: boolean;
  onSelect: () => void;
}

/**
 * 列表卡片：不点开详情就能拿到关键信息。
 * 结局差的样本强制红描边 + 角标，避免医生只看成功案例。
 */
export const HistorySampleCard: React.FC<HistorySampleCardProps> = ({
  sample,
  similarity,
  selected,
  favorited = false,
  onSelect
}) => {
  const concern = hasSafetyConcern(sample);
  const badOutcome = sample.outcome === 'no_response' || sample.outcome === 'relapse';
  const color = toneColor(similarity.overall);
  const route = sample.protocolVersions[sample.protocolVersions.length - 1]?.protocol.administrationRoute ?? '';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-3 transition-all relative overflow-hidden ${
        selected ? 'bg-[#152347] border-[#20cfff] shadow-[0_0_14px_rgba(32,207,255,0.22)]' : 'bg-[#0c1429] hover:bg-[#101a33]'
      }`}
      style={!selected ? { borderColor: badOutcome ? 'rgba(255,83,108,0.5)' : 'rgba(43,65,112,0.6)' } : undefined}
    >
      {/* 风险角标 */}
      {concern && (
        <span
          className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl-lg text-[9px] font-bold flex items-center gap-0.5"
          style={{
            background: badOutcome ? 'rgba(255,83,108,0.22)' : 'rgba(255,184,77,0.2)',
            color: badOutcome ? UI.red : UI.amber
          }}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          {badOutcome ? '结局警示' : '有不良事件'}
        </span>
      )}

      <div className="flex items-start gap-3">
        <ScoreGauge value={similarity.overall} size={64} strokeWidth={5} color={color} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-xs text-[#eef4ff]">{sample.id}</span>
            <span className="text-[10px] text-[#8996b8] font-mono">{sample.anonymizedMrn}</span>
            {favorited && <Star className="w-3 h-3 text-[#ffb84d]" fill="#ffb84d" />}
            {sample.typicalCase && <Tag text="典型案例" color={UI.purple} />}
            {sample.mdtDiscussed && <Tag text="MDT 讨论" color={UI.cyan} />}
          </div>

          <div className="text-[11px] text-[#eef4ff] mt-1 truncate">{sample.diagnosisLabel}</div>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8996b8] flex-wrap">
            <span>{sample.gender} · {sample.age}岁</span>
            <span>BMI {sample.bmi}</span>
            <span className="font-mono">FC {sample.clinicalMarkers.fecalCalprotectin} μg/g</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <OutcomeBadge outcome={sample.outcome} />
            <RouteTag route={route} />
          </div>
        </div>

        <MiniRadar3
          values={[similarity.dimensions.clinical, similarity.dimensions.physical, similarity.dimensions.microbiome]}
          size={72}
          color={color}
        />
      </div>

      {/* 关键摘要标签 */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#1e2f57]/70 flex-wrap">
        {sample.caseTags.slice(0, 3).map(tag => (
          <Tag key={tag} text={tag} color={UI.blue} />
        ))}
        <span className="ml-auto text-[9px] text-[#8996b8] flex items-center gap-0.5">
          <Stethoscope className="w-2.5 h-2.5" />
          随访 {sample.followUpWeeks} 周 · 定植 {sample.finalEngraftmentRate}%
        </span>
      </div>
    </button>
  );
};
