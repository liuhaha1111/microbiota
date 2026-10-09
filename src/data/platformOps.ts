import type { DonorProfile, MicrobiotaBatch } from '../types';

/* ============================================================================
 * 平台运行与体系治理数据（工作台驾驶舱 · 屏 1）
 *
 * 本文件只承载两类东西：
 *   ① 既有 mock 里**没有**的体系级聚合数（供体筛查漏斗、月度流转漏斗、阶段 TAT…）；
 *   ② 从既有权威字段**派生**的聚合函数（供体池结构、批次质控、库存效期、知识资产…）。
 *
 * 刻意不做的两件事：
 *   - 不把 mockDonors / mockBatches / mockKnowledgeNodes 里已有的值抄成快照。
 *     抄一份必然漂移：批次改了活菌率，这里还显示旧数。
 *   - 不把「单个患者」的数据塞进来。屏 1 讲的是体系，不是某位患者。
 *
 * 屏 1 只保留「数字孪生」「患者队列」两个切面，因此本文件也只留这两处真正用到的东西：
 *   数字孪生侧栏 ← 知识资产、审计日志（供跨屏调度显示最近活动）
 *   患者队列     ← 队列结构、运营效率、菌源供应链
 * 之前为「体系运行」切面造的引擎状态 / 门控吞吐 / 合规覆盖率 / 数据接入 / RWS 资产等
 * 已随该切面一并删除——它们与历史样本库、供受体匹配两屏的内容重复。
 * ========================================================================== */

/**
 * 演示数据基准日。
 *
 * 刻意写死而不用 Date.now()：一旦取真实时间，界面上的「剩余效期」「距复筛」
 * 会随查看日期漂移，同一个演示在不同日期打开会得到互相矛盾的结论。
 */
export const PLATFORM_DATA_BASELINE = '2026-10-04';

/** 基准日当天（UTC 零点）的毫秒数，供效期/复筛倒计时复用 */
const BASELINE_MS = Date.parse(`${PLATFORM_DATA_BASELINE}T00:00:00Z`);

/** 距基准日的天数，负数表示已过期 */
export function daysUntilBaseline(dateStr: string): number {
  return Math.round((Date.parse(`${dateStr}T00:00:00Z`) - BASELINE_MS) / 86400000);
}

/* ---------------------------------------------------------------------------
 * 队列结构（原写死在 WorkbenchCockpit 里，上移为唯一来源）
 * ------------------------------------------------------------------------- */

export interface PathwayStage {
  stage: string;
  count: number;
  percent: string;
  color: string;
}

/**
 * 全流程患者路径的**当期分布**。
 *
 * 注意语义：这是某一时刻各阶段的在管人数快照，**不是漏斗**——
 * 各阶段并存（有人在评估、有人在随访），因此数字不是单调递减的，
 * 相邻两段相除得到的「转化率」没有意义。真正的流转漏斗见 MONTHLY_FLOW_FUNNEL。
 */
export const PATHWAY_STAGES: ReadonlyArray<PathwayStage> = [
  { stage: '1. 临床评估', count: 28, percent: '14%', color: 'border-info text-info' },
  { stage: '2. 菌群测序', count: 19, percent: '10%', color: 'border-accent text-accent' },
  { stage: '3. 供体匹配', count: 14, percent: '7%', color: 'border-violet text-violet' },
  { stage: '4. FMT执行', count: 36, percent: '18%', color: 'border-ok text-ok' },
  { stage: '5. 定植随访', count: 52, percent: '26%', color: 'border-warn text-warn' },
  { stage: '6. 疗效评价', count: 48, percent: '25%', color: 'border-accent text-ink' }
];

export interface CohortBucket {
  name: string;
  count: number;
  share: number;
  color: string;
}

export const COHORTS: ReadonlyArray<CohortBucket> = [
  { name: '溃疡性结肠炎 (UC)', count: 83, share: 42, color: 'bg-accent' },
  { name: '复发性艰难梭菌感染 (rCDI)', count: 47, share: 24, color: 'bg-danger' },
  { name: '肠易激综合征 (IBS-D/C)', count: 35, share: 18, color: 'bg-violet' },
  { name: '克罗恩病与未定型IBD', count: 22, share: 11, color: 'bg-warn' },
  { name: '神经微生态队列 (ASD/PD)', count: 10, share: 5, color: 'bg-ok' }
];

/** 在管队列总数——由 PATHWAY_STAGES 求和得出，不另存 */
export const MANAGED_COHORT_TOTAL = PATHWAY_STAGES.reduce((sum, s) => sum + s.count, 0);

/* ---------------------------------------------------------------------------
 * 全流程运营效率
 * ------------------------------------------------------------------------- */

/**
 * 本月阶段流转漏斗。
 *
 * 与 PATHWAY_STAGES 的区别：这里是**同一批患者的顺序流转**（34 人本月入组，
 * 其中 29 人已完成测序…），数字单调递减，相邻相除才是真实的阶段转化率。
 */
export const MONTHLY_FLOW_FUNNEL: ReadonlyArray<{ stage: string; short: string; count: number }> = [
  { stage: '本月新入组', short: '入组', count: 34 },
  { stage: '完成菌群测序', short: '测序', count: 29 },
  { stage: '完成供体匹配', short: '匹配', count: 24 },
  { stage: '完成首次移植', short: '移植', count: 21 },
  { stage: '完成 4 周随访', short: '随访', count: 17 },
  { stage: '完成疗效评价', short: '评价', count: 13 }
];

/** 各阶段平均停留时长（天）与院内基准值，用于识别瓶颈 */
export const STAGE_TAT: ReadonlyArray<{ stage: string; days: number; benchmark: number }> = [
  { stage: '临床评估', days: 3.2, benchmark: 3.0 },
  { stage: '菌群测序', days: 9.4, benchmark: 7.0 },
  { stage: '供体匹配', days: 4.6, benchmark: 5.0 },
  { stage: 'FMT 执行', days: 2.1, benchmark: 2.0 },
  { stage: '定植随访', days: 42.0, benchmark: 42.0 },
  { stage: '疗效评价', days: 14.8, benchmark: 14.0 }
];

/** 近 12 周入组 / 结项趋势 */
export const FLOW_TREND: ReadonlyArray<{ week: string; enrolled: number; closed: number }> = [
  { week: 'W29', enrolled: 5, closed: 3 },
  { week: 'W30', enrolled: 7, closed: 4 },
  { week: 'W31', enrolled: 6, closed: 5 },
  { week: 'W32', enrolled: 9, closed: 6 },
  { week: 'W33', enrolled: 8, closed: 7 },
  { week: 'W34', enrolled: 11, closed: 6 },
  { week: 'W35', enrolled: 7, closed: 9 },
  { week: 'W36', enrolled: 12, closed: 8 },
  { week: 'W37', enrolled: 10, closed: 9 },
  { week: 'W38', enrolled: 9, closed: 11 },
  { week: 'W39', enrolled: 13, closed: 10 },
  { week: 'W40', enrolled: 11, closed: 12 }
];

/** 医师负荷分布（团队级，非单患者视图） */
export const PHYSICIAN_LOAD: ReadonlyArray<{
  name: string;
  role: string;
  active: number;
  capacity: number;
}> = [
  { name: '陈建国', role: '主任医师 / MDT 首席', active: 58, capacity: 60 },
  { name: '林素云', role: '主任医师 / 感染科', active: 44, capacity: 55 },
  { name: '赵宏波', role: '副主任医师', active: 39, capacity: 50 },
  { name: '周敏', role: '临床药师 / MDT', active: 22, capacity: 40 },
  { name: '吴晓岚', role: '主治医师', active: 34, capacity: 45 }
];

/* ---------------------------------------------------------------------------
 * 菌源供应链（派生）
 * ------------------------------------------------------------------------- */

const SCREEN_DEADLINE_RE = /(?:有效期至|需在)\s*(\d{4}-\d{2}-\d{2})/;
const CELL_COUNT_RE = /([\d.]+)\s*×\s*10¹¹/;
const VIABILITY_RE = /活菌率\s*([\d.]+)\s*%/;

/** 从 lastScreenedDate 的自由文本里取复筛截止日；「临近复检周期」这类无日期者返回 null */
export function donorScreenDeadline(donor: DonorProfile): string | null {
  return donor.lastScreenedDate.match(SCREEN_DEADLINE_RE)?.[1] ?? null;
}

export function parseCellCount(text: string): number | null {
  const m = text.match(CELL_COUNT_RE);
  return m ? Number(m[1]) : null;
}

export function parseViability(text: string): number | null {
  const m = text.match(VIABILITY_RE);
  return m ? Number(m[1]) : null;
}

export interface CountedBucket {
  key: string;
  count: number;
  color: string;
}

export interface DonorPoolSummary {
  total: number;
  byRating: CountedBucket[];
  byType: CountedBucket[];
  byScreening: CountedBucket[];
  avgShannon: number;
  avgSuccessRate: number;
  totalDonations: number;
  lowAmrCount: number;
  /** 需要在 60 天内复筛的供体（含已过期） */
  rescreenDue: Array<{ code: string; deadline: string; daysLeft: number; status: string }>;
}

const RATING_COLOR: Record<string, string> = {
  'A+': 'var(--color-ok)',
  A: 'var(--color-accent)',
  B: 'var(--color-warn)',
  C: 'var(--color-danger)'
};

const TYPE_COLOR: Record<string, string> = {
  '超级供体(Super Donor)': 'var(--color-violet)',
  健康志愿者: 'var(--color-info)',
  亲属供体: 'var(--color-warn)'
};

const SCREENING_COLOR: Record<string, string> = {
  '合格(有效期待定)': 'var(--color-ok)',
  复筛中: 'var(--color-accent)',
  临近过期: 'var(--color-warn)',
  不可用: 'var(--color-danger)'
};

/** 供体池结构。所有分组计数都从 donors 现算，不缓存 */
export function summarizeDonorPool(donors: ReadonlyArray<DonorProfile>): DonorPoolSummary {
  const tally = <K extends string>(
    keys: ReadonlyArray<K>,
    pick: (d: DonorProfile) => K,
    colors: Record<string, string>
  ) =>
    keys.map(key => ({
      key,
      count: donors.filter(d => pick(d) === key).length,
      color: colors[key] ?? 'var(--color-ink-muted)'
    }));

  const rescreenDue = donors
    .map(d => {
      const deadline = donorScreenDeadline(d);
      if (!deadline) return null;
      const daysLeft = daysUntilBaseline(deadline);
      if (daysLeft > 60) return null;
      return { code: d.code, deadline, daysLeft, status: d.screeningStatus };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const avg = (nums: number[]) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0);

  return {
    total: donors.length,
    byRating: tally(['A+', 'A', 'B', 'C'] as const, d => d.rating, RATING_COLOR),
    byType: tally(
      ['超级供体(Super Donor)', '健康志愿者', '亲属供体'] as const,
      d => d.donorType,
      TYPE_COLOR
    ),
    byScreening: tally(
      ['合格(有效期待定)', '复筛中', '临近过期', '不可用'] as const,
      d => d.screeningStatus,
      SCREENING_COLOR
    ),
    avgShannon: avg(donors.map(d => d.shannonDiversity)),
    avgSuccessRate: avg(donors.map(d => d.clinicalSuccessRate)),
    totalDonations: donors.reduce((s, d) => s + d.totalDonations, 0),
    lowAmrCount: donors.filter(d => d.amrGeneRisk.startsWith('极低')).length,
    rescreenDue
  };
}

/**
 * 菌液效期窗口（天）。
 *
 * mock 里每个批次的 expiryDate 都等于 prepDate + 6 个月，窗口因此固定为 182 天。
 * 用「剩余效期 / 窗口」而不是绝对天数来判断临期——绝对天数会随基准日漂移，
 * 而这个比值对同一批数据永远给出同一个结论。
 */
export const BATCH_SHELF_LIFE_DAYS = 182;

/**
 * 剩余效期低于窗口的 60%（≈109 天）视为临期，与 status 字段的判读一致。
 * 屏 1 的效期面板已删除，当前无视图消费；保留理由同 BatchSummary.shelfLife。
 */
export const BATCH_NEAR_EXPIRY_RATIO = 0.6;

const STATUS_COLOR: Record<string, string> = {
  '已释放(可使用)': 'var(--color-ok)',
  检测中: 'var(--color-accent)',
  已使用: 'var(--color-ink-muted)',
  已临期: 'var(--color-warn)'
};

const GRADE_COLOR: Record<string, string> = {
  '特级 (临床级)': 'var(--color-violet)',
  优级: 'var(--color-info)',
  待评定: 'var(--color-ink-muted)'
};

export interface BatchSummary {
  total: number;
  byStatus: CountedBucket[];
  byGrade: CountedBucket[];
  avgViability: number;
  /** 平均活菌数（× 10¹¹ CFU/g） */
  avgCellCount: number;
  released: number;
  inTesting: number;
  /**
   * 按剩余效期升序；daysLeft 为负表示已过期。
   *
   * 屏 1 的「库存水位与剩余效期」面板已删除，本字段当前**无视图消费**。
   * 保留而非一并删除的理由：它描述的是批次档案的客观属性，不是某个面板的
   * 专属口径；删掉会让「效期窗口 182 天」这个判读基准失去落脚点。
   */
  shelfLife: Array<{
    batchNumber: string;
    donorCode: string;
    expiryDate: string;
    daysLeft: number;
    status: MicrobiotaBatch['status'];
    grade: MicrobiotaBatch['qualityGrade'];
    viability: number | null;
    cellCount: number | null;
  }>;
}

/** 批次质控与库存效期。效期倒计时以 PLATFORM_DATA_BASELINE 为基准 */
export function summarizeBatches(batches: ReadonlyArray<MicrobiotaBatch>): BatchSummary {
  const tally = (
    keys: ReadonlyArray<string>,
    pick: (b: MicrobiotaBatch) => string,
    colors: Record<string, string>
  ) => keys.map(key => ({ key, count: batches.filter(b => pick(b) === key).length, color: colors[key] }));

  const viabilities = batches
    .map(b => parseViability(b.viableCellCount))
    .filter((v): v is number => v !== null);
  const cellCounts = batches
    .map(b => parseCellCount(b.viableCellCount))
    .filter((v): v is number => v !== null);

  const shelfLife = batches
    .map(b => ({
      batchNumber: b.batchNumber,
      donorCode: b.donorCode,
      expiryDate: b.expiryDate,
      daysLeft: daysUntilBaseline(b.expiryDate),
      status: b.status,
      grade: b.qualityGrade,
      viability: parseViability(b.viableCellCount),
      cellCount: parseCellCount(b.viableCellCount)
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const avg = (nums: number[]) => (nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0);

  return {
    total: batches.length,
    byStatus: tally(['已释放(可使用)', '检测中', '已使用', '已临期'], b => b.status, STATUS_COLOR),
    byGrade: tally(['特级 (临床级)', '优级', '待评定'], b => b.qualityGrade, GRADE_COLOR),
    avgViability: avg(viabilities),
    avgCellCount: avg(cellCounts),
    released: batches.filter(b => b.status === '已释放(可使用)').length,
    inTesting: batches.filter(b => b.status === '检测中').length,
    shelfLife
  };
}

/**
 * 供体筛查漏斗。
 *
 * 这是**新造的体系级数据**：mock 里只有 6 位最终合格供体，
 * 看不到从报名到入库的淘汰过程。四道筛查的通过率是 FMT 中心的核心质控指标。
 */
export const DONOR_SCREENING_FUNNEL: ReadonlyArray<{ stage: string; count: number }> = [
  { stage: '报名与生活方式初筛', count: 128 },
  { stage: '血清学与感染标志物', count: 86 },
  { stage: '粪便病原 38 项', count: 41 },
  { stage: '耐药基因组筛查', count: 34 },
  { stage: '合格入库供体', count: 6 }
];
