import React, { useMemo } from 'react';
import { Boxes, FlaskConical, Filter, AlertTriangle } from 'lucide-react';
import { mockBatches, mockDonors } from '../../data/mockMicroFmtData';
import {
  DONOR_SCREENING_FUNNEL,
  summarizeBatches,
  summarizeDonorPool
} from '../../data/platformOps';
import {
  DonutArc,
  KpiTile,
  OpsEmpty,
  OpsPanel,
  Pill,
  StackedBar,
  OPS_INNER
} from './opsUi';

/** 把 '超级供体(Super Donor)' / '合格(有效期待定)' 这类带括注的枚举值压成短名 */
const shortKey = (k: string) => k.replace(/[（(][^)）]*[)）]/g, '').trim();

/* ============================== A1 供体池结构 ============================== */

export const DonorPoolPanel: React.FC = () => {
  const pool = useMemo(() => summarizeDonorPool(mockDonors), []);
  const qualified = pool.byScreening.find(b => b.key.startsWith('合格'))?.count ?? 0;

  return (
    <OpsPanel
      title="供体池结构"
      icon={Boxes}
      right={
        <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
          全库 {pool.total} 位 · 合格 {qualified} 位
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <DonutArc
          segments={pool.byRating}
          centerValue={pool.total}
          centerLabel="在册供体"
          centerTone="var(--color-accent)"
        />
        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
          <KpiTile
            label="平均 Shannon"
            value={pool.avgShannon.toFixed(2)}
            note="全库多样性基线"
            tone="info"
          />
          <KpiTile
            label="平均临床成功率"
            value={`${pool.avgSuccessRate.toFixed(1)}%`}
            note="按历史移植例次加权"
            tone="ok"
          />
          <KpiTile
            label="累计捐献"
            value={pool.totalDonations}
            unit="次"
            note="菌源供给总量"
            tone="purple"
          />
          <KpiTile
            label="极低耐药风险"
            value={`${pool.lowAmrCount}/${pool.total}`}
            note="无高危耐药基因"
            tone="ok"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <div className="text-[length:var(--fs-10)] text-ink-muted mb-1.5">评级构成</div>
          <StackedBar segments={pool.byRating} />
        </div>
        <div>
          <div className="text-[length:var(--fs-10)] text-ink-muted mb-1.5">供体类型</div>
          <StackedBar segments={pool.byType} labelOf={shortKey} />
        </div>
        <div>
          <div className="text-[length:var(--fs-10)] text-ink-muted mb-1.5">筛查状态</div>
          <StackedBar segments={pool.byScreening} labelOf={shortKey} />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-line-2">
        <div className="flex items-center gap-1.5 text-[length:var(--fs-10)] text-warn mb-2">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          复筛到期提醒（60 天内）
        </div>
        {pool.rescreenDue.length === 0 ? (
          <OpsEmpty text="暂无供体进入复筛窗口" />
        ) : (
          <div className="space-y-1.5">
            {pool.rescreenDue.map(d => (
              <div
                key={d.code}
                className={`${OPS_INNER} flex items-center justify-between gap-2 text-[length:var(--fs-11)]`}
              >
                <span className="font-mono text-ink">{d.code}</span>
                <span className="text-[length:var(--fs-10)] text-ink-muted">{d.status}</span>
                <Pill color={d.daysLeft <= 30 ? 'var(--color-danger)' : 'var(--color-warn)'}>
                  {d.daysLeft < 0 ? `已逾期 ${-d.daysLeft} 天` : `剩 ${d.daysLeft} 天`}
                </Pill>
              </div>
            ))}
          </div>
        )}
      </div>
    </OpsPanel>
  );
};

/* ============================== A2 批次质控 ============================== */

export const BatchQualityPanel: React.FC = () => {
  const batch = useMemo(() => summarizeBatches(mockBatches), []);

  return (
    <OpsPanel
      title="菌液批次质控"
      icon={FlaskConical}
      right={
        <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
          共 {batch.total} 批 · 可用 {batch.released} 批
        </span>
      }
    >
      <div className="flex items-center gap-3">
        <DonutArc
          segments={batch.byStatus}
          centerValue={batch.total}
          centerLabel="在库批次"
          centerTone="var(--color-ok)"
        />
        <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
          <KpiTile
            label="平均活菌率"
            value={`${batch.avgViability.toFixed(1)}%`}
            note="放行标准 ≥ 70%"
            tone={batch.avgViability >= 70 ? 'ok' : 'warn'}
          />
          <KpiTile
            label="平均活菌数"
            value={batch.avgCellCount.toFixed(2)}
            unit="×10¹¹"
            note="CFU/g"
            tone="info"
          />
          <KpiTile label="检测中" value={batch.inTesting} unit="批" note="待放行" tone="info" />
          <KpiTile
            label="质量分级"
            value={batch.byGrade.find(g => g.key.startsWith('特级'))?.count ?? 0}
            unit="批特级"
            note="临床级最高档"
            tone="purple"
          />
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <div>
          <div className="text-[length:var(--fs-10)] text-ink-muted mb-1.5">批次状态</div>
          <StackedBar segments={batch.byStatus} labelOf={shortKey} />
        </div>
        <div>
          <div className="text-[length:var(--fs-10)] text-ink-muted mb-1.5">质量分级</div>
          <StackedBar segments={batch.byGrade} labelOf={shortKey} />
        </div>
      </div>

      <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        批次状态与分级全部取自菌库批次档案；活菌率低于 70% 的批次不得放行，
        已临期批次须在投放前重新核验活菌回收率。
      </p>
    </OpsPanel>
  );
};

/* ========================== A4 供体筛查通过漏斗 ========================== */

// 令牌化：原 #815cff 作 10px 文字在面板底上只有 4.03:1，不达标（同 CohortPanels.FLOW_COLORS）
const FUNNEL_COLORS = [
  'var(--color-info)',
  'var(--color-accent)',
  'var(--color-violet)',
  'var(--color-warn)',
  'var(--color-ok)'
];

export const DonorScreeningPanel: React.FC = () => {
  const head = DONOR_SCREENING_FUNNEL[0].count;
  const final = DONOR_SCREENING_FUNNEL[DONOR_SCREENING_FUNNEL.length - 1].count;

  return (
    <OpsPanel
      title="供体筛查通过漏斗"
      icon={Filter}
      right={
        <span className="text-[length:var(--fs-10)] text-ink-muted font-mono">
          总通过率 {((final / head) * 100).toFixed(1)}%
        </span>
      }
    >
      <div className="space-y-3">
        {DONOR_SCREENING_FUNNEL.map((s, i) => {
          const prev = i === 0 ? null : DONOR_SCREENING_FUNNEL[i - 1].count;
          const conv = prev ? (s.count / prev) * 100 : 100;
          const cumulative = (s.count / head) * 100;
          const color = FUNNEL_COLORS[i] ?? 'var(--color-accent)';

          return (
            <div key={s.stage} className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-[length:var(--fs-11)] mb-1">
                <span className="text-ink truncate">{s.stage}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-ink">{s.count}</span>
                  <span className="text-[length:var(--fs-10)] font-mono" style={{ color }}>
                    {i === 0 ? '基准' : `环比 ${conv.toFixed(1)}%`}
                  </span>
                </span>
              </div>
              <div className="w-full h-2 bg-track rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(1.5, cumulative)}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 pt-2.5 border-t border-line-2 text-[length:var(--fs-10)] text-ink-muted leading-relaxed">
        四道筛查逐级淘汰：耐药基因组筛查是最大卡点，{head} 名报名者最终仅 {final} 位入库。
        这是菌源安全的源头质控，不涉及任何受体个体。
      </p>
    </OpsPanel>
  );
};
