import React from 'react';
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { HistoricalSample, SimilarityResult, SimilarityWeights } from '../../types';
import { DIMENSION_LABEL, normalizeWeights } from '../../utils/similarity';
import { MiniRadar3, ScoreGauge, SectionCard, toneColor, UI } from './historyUi';

interface SimilarityScoreCardProps {
  sample: HistoricalSample;
  similarity: SimilarityResult;
  weights: SimilarityWeights;
  compact?: boolean;
}

const DIMENSION_ORDER: Array<'clinical' | 'physical' | 'microbiome'> = ['clinical', 'physical', 'microbiome'];

/**
 * 相似度打分 + 相似点／差异点说明。
 * 必须让医生看清「为什么判定相似」以及「哪些维度差异很大」，
 * 避免只看一个百分比就下判断。
 */
export const SimilarityScoreCard: React.FC<SimilarityScoreCardProps> = ({
  sample,
  similarity,
  weights,
  compact = false
}) => {
  const w = normalizeWeights(weights);
  const color = toneColor(similarity.overall);

  return (
    <SectionCard
      title="相似度构成与差异解释"
      icon={<Info className="w-3.5 h-3.5 text-accent" />}
      right={<span className="text-[length:var(--fs-10)] text-ink-muted">对比对象 {sample.id}</span>}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <ScoreGauge value={similarity.overall} size={compact ? 78 : 92} strokeWidth={6} color={color} label="综合相似度" />
          <span className="text-[length:var(--fs-9)] text-ink-muted text-center leading-tight">
            加权：临床 {Math.round(w.clinical * 100)}% · 身体 {Math.round(w.physical * 100)}% · 菌群{' '}
            {Math.round(w.microbiome * 100)}%
          </span>
        </div>

        <MiniRadar3
          values={[similarity.dimensions.clinical, similarity.dimensions.physical, similarity.dimensions.microbiome]}
          size={compact ? 92 : 108}
          color={color}
        />

        <div className="flex-1 space-y-2 min-w-0">
          {DIMENSION_ORDER.map(key => {
            const value = similarity.dimensions[key];
            const dimColor = toneColor(value);
            const weightShare = Math.round(w[key] * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-[length:var(--fs-10)] mb-1">
                  <span className="text-ink-muted">
                    {DIMENSION_LABEL[key]}
                    <span className="text-ink-subtle ml-1">权重 {weightShare}%</span>
                  </span>
                  <span className="font-mono font-bold" style={{ color: dimColor }}>
                    {value.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-track overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${value}%`, background: dimColor, transition: 'width 400ms ease' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 相似点 / 差异点 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5">
        <div className="p-2.5 rounded-lg border border-ok/35 bg-surface-2">
          <h4 className="text-[length:var(--fs-11)] font-semibold text-ok flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            相似点（{similarity.matchedPoints.length}）
          </h4>
          <div className="space-y-1.5">
            {similarity.matchedPoints.length === 0 && (
              <p className="text-[length:var(--fs-10)] text-ink-muted">未识别到显著匹配维度，建议谨慎参考。</p>
            )}
            {similarity.matchedPoints.map(p => (
              <div key={p.label} className="text-[length:var(--fs-10)] leading-relaxed">
                <span className="text-ink font-medium">{p.label}</span>
                <span className="text-ok font-mono ml-1">{Math.round(p.score * 100)}%</span>
                <div className="text-ink-muted">{p.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="p-2.5 rounded-lg border bg-surface-2"
          style={{ borderColor: similarity.diffPoints.length ? 'rgba(255,184,77,0.4)' : 'rgba(43,65,112,0.5)' }}
        >
          <h4 className="text-[length:var(--fs-11)] font-semibold text-warn flex items-center gap-1.5 mb-2">
            <TriangleAlert className="w-3.5 h-3.5" />
            关键差异（{similarity.diffPoints.length}）
          </h4>
          <div className="space-y-1.5">
            {similarity.diffPoints.length === 0 && (
              <p className="text-[length:var(--fs-10)] text-ink-muted">各维度差异均在可接受范围内。</p>
            )}
            {similarity.diffPoints.map(p => (
              <div key={p.label} className="text-[length:var(--fs-10)] leading-relaxed">
                <span className="text-ink font-medium">{p.label}</span>
                <span className="text-warn font-mono ml-1">{Math.round(p.score * 100)}%</span>
                <div className="text-ink-muted">{p.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 差异小结：防止医生只看到相似度、忽略两个患者的本质不同 */}
      <div className="mt-3 p-2.5 rounded-lg bg-surface-2 border border-line/50">
        <h4 className="text-[length:var(--fs-11)] font-semibold text-ink mb-1.5">可视化差异小结</h4>
        <p className="text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
          <span className="text-ok">主要相似点：</span>
          {similarity.matchedPoints.length
            ? similarity.matchedPoints.slice(0, 3).map(p => p.label).join('、')
            : '未识别到高度匹配维度'}
          ；
          <span className="text-warn"> 关键差异提醒：</span>
          {similarity.diffPoints.length
            ? similarity.diffPoints
                .slice(0, 3)
                .map(p => `${p.label}（${p.detail}）`)
                .join('；')
            : '暂未发现需要特别警惕的差异项'}
          。
        </p>
        <p className="text-[length:var(--fs-10)] text-ink-subtle mt-1.5">
          注：相似度仅为召回排序依据，不构成预后判断。请结合下方完整诊疗档案综合研判。
        </p>
        <span className="hidden" style={{ color: UI.cyan }} />
      </div>
    </SectionCard>
  );
};
