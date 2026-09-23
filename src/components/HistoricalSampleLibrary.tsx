import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Database,
  Filter,
  FlaskConical,
  Layers,
  Library,
  Lock,
  RotateCcw,
  Scale,
  Search,
  Sliders,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import {
  ClinicalPatient,
  DiseaseCategory,
  HistoricalSample,
  SampleOutcome,
  SimilarityWeights
} from '../types';
import { historicalSamples, SAMPLE_OUTCOME_META } from '../data/historicalSamples';
import { getPatientDataPackage } from '../data/mockMicroFmtData';
import {
  buildPatientFeatureVector,
  buildSampleFeatureVector,
  DEFAULT_WEIGHTS,
  normalizeWeights,
  rankSamples
} from '../utils/similarity';
import { HistorySampleCard } from './history/HistorySampleCard';
import { HistorySampleDetail } from './history/HistorySampleDetail';
import { HistoryCompareView } from './history/HistoryCompareView';
import { SampleLibraryAdmin, SampleOverride } from './history/SampleLibraryAdmin';
import { CopyConfirmModal, GlobalRefBanner } from './history/SampleRefWarning';
import { MiniRadar3, SectionCard, Tag, toneColor, UI } from './history/historyUi';
import { ContextBar, SecondaryNav, SecondaryNavItem, ScreenSlotBadge } from './ui';

type ViewMode = 'search' | 'compare' | 'admin';
type SortMode = 'similarity' | 'risk';

/**
 * 二级导航按「任务」切分：检索召回 → 对比研判 → 库管理。
 * 三者是医生使用本库的三种不同工作模式，互相不需要对照，适合互斥切面。
 */
const LIBRARY_TABS: ReadonlyArray<SecondaryNavItem<ViewMode>> = [
  { id: 'search', label: '样本检索', icon: Search, hint: '以当前患者为输入召回相似历史病例' },
  { id: 'compare', label: '对比分屏视图', icon: Scale, hint: '当前患者与历史样本的逐维度对照' },
  { id: 'admin', label: '样本库管理', icon: Database, hint: '入库校验、标签与临床参考开关' }
];

const OUTCOME_OPTIONS: SampleOutcome[] = ['remission', 'partial', 'no_response', 'relapse'];
const ROUTE_OPTIONS = ['肠溶胶囊', '结肠镜', '鼻肠管', '保留灌肠'] as const;
const CATEGORY_OPTIONS: Array<{ key: DiseaseCategory; label: string }> = [
  { key: 'UC', label: '溃疡性结肠炎' },
  { key: 'CD', label: '克罗恩病' },
  { key: 'rCDI', label: '复发性艰难梭菌' },
  { key: 'IBS-D', label: '腹泻型肠易激' }
];

interface HistoricalSampleLibraryProps {
  patient: ClinicalPatient;
}

export const HistoricalSampleLibrary: React.FC<HistoricalSampleLibraryProps> = ({ patient }) => {
  const pkg = getPatientDataPackage(patient.id);
  const patientVector = useMemo(() => buildPatientFeatureVector(patient, pkg), [patient, pkg]);

  /* ---------------------------- 状态 ---------------------------- */
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [weights, setWeights] = useState<SimilarityWeights>({ ...DEFAULT_WEIGHTS });
  const [queryMode, setQueryMode] = useState<'patient' | 'manual'>('patient');

  // 手动设定查询条件（以当前患者档案为底，仅改写下列关键项）
  const [manual, setManual] = useState({
    category: patientVector.diagnosisCategory,
    activity: patientVector.diseaseActivity,
    age: patientVector.age,
    dysbiosis: patientVector.dysbiosisScore,
    immunosuppressed: patientVector.immunosuppressed
  });

  const [outcomeFilter, setOutcomeFilter] = useState<SampleOutcome[]>([]);
  const [routeFilter, setRouteFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<DiseaseCategory[]>([]);
  const [mdtOnly, setMdtOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('similarity');

  const [selectedId, setSelectedId] = useState<string>(historicalSamples[0]?.id ?? '');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, SampleOverride>>({});
  const [searching, setSearching] = useState(false);
  const [searchTick, setSearchTick] = useState(0);
  const [copyTarget, setCopyTarget] = useState<HistoricalSample | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /**
   * 屏内参考标记。
   * 分屏约束下本库不再向「供受体智能匹配」屏传参，原先跨模块的「方案草稿」
   * 语义随之收敛为「本屏内标记参考对象」——医生在并排的配型屏上人工对照录入，
   * 本库只负责把「哪条样本被选为参考」固定在当前屏内。
   */
  const [markedRefId, setMarkedRefId] = useState<string | null>(null);

  // 换患者时同步重置查询条件
  useEffect(() => {
    setManual({
      category: patientVector.diagnosisCategory,
      activity: patientVector.diseaseActivity,
      age: patientVector.age,
      dysbiosis: patientVector.dysbiosisScore,
      immunosuppressed: patientVector.immunosuppressed
    });
    setQueryMode('patient');
  }, [patient.id]);

  // 检索动效：菌群粒子流动，检索完成即停止
  useEffect(() => {
    setSearching(true);
    const timer = setTimeout(() => setSearching(false), 620);
    return () => clearTimeout(timer);
  }, [searchTick, patient.id, weights.clinical, weights.physical, weights.microbiome, queryMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ---------------------------- 查询向量 ---------------------------- */
  const queryVector = useMemo(() => {
    if (queryMode === 'patient') return patientVector;
    return {
      ...patientVector,
      diagnosisCategory: manual.category,
      diseaseActivity: manual.activity,
      age: manual.age,
      dysbiosisScore: manual.dysbiosis,
      shannonDiversity: Math.round((1 + ((100 - manual.dysbiosis) / 100) * 4) * 100) / 100,
      beneficialRatio: Math.round((100 - manual.dysbiosis) * 0.55 * 10) / 10,
      immunosuppressed: manual.immunosuppressed
    };
  }, [queryMode, patientVector, manual]);

  /* ---------------------------- 召回 ---------------------------- */
  const ranked = useMemo(() => rankSamples(queryVector, historicalSamples, weights), [queryVector, weights, searchTick]);

  const filtered = useMemo(() => {
    const list = ranked.filter(({ sample }) => {
      const override = overrides[sample.id];
      if ((override?.libraryStatus ?? sample.libraryStatus) === 'blocked') return false;
      if (outcomeFilter.length && !outcomeFilter.includes(sample.outcome)) return false;
      if (categoryFilter.length && !categoryFilter.includes(sample.diagnosisCategory)) return false;
      if (mdtOnly && !sample.mdtDiscussed) return false;
      if (routeFilter.length) {
        const routes = sample.protocolVersions.map(v => v.protocol.administrationRoute).join(' ');
        if (!routeFilter.some(r => routes.includes(r))) return false;
      }
      return true;
    });

    if (sortMode === 'risk') {
      const riskRank: Record<SampleOutcome, number> = { no_response: 0, relapse: 1, partial: 2, remission: 3 };
      return [...list].sort((a, b) => {
        const r = riskRank[a.sample.outcome] - riskRank[b.sample.outcome];
        return r !== 0 ? r : b.similarity.overall - a.similarity.overall;
      });
    }
    return list;
  }, [ranked, overrides, outcomeFilter, categoryFilter, mdtOnly, routeFilter, sortMode]);

  const selected = useMemo(() => {
    const hit = filtered.find(item => item.sample.id === selectedId);
    if (hit) return hit;
    return filtered[0] ?? ranked[0];
  }, [filtered, ranked, selectedId]);

  useEffect(() => {
    if (selected && selected.sample.id !== selectedId) setSelectedId(selected.sample.id);
  }, [selected?.sample.id]);

  const selectedSimilarity = selected?.similarity;

  const isFavorited = (id: string) => favorites.includes(id);
  const toggleFavorite = (id: string) =>
    setFavorites(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const updateOverride = (id: string, patch: SampleOverride) =>
    setOverrides(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const runSearch = () => setSearchTick(t => t + 1);

  const resetFilters = () => {
    setOutcomeFilter([]);
    setRouteFilter([]);
    setCategoryFilter([]);
    setMdtOnly(false);
    setSortMode('similarity');
    setWeights({ ...DEFAULT_WEIGHTS });
    setQueryMode('patient');
    runSearch();
  };

  /* ------------------------ 屏内参考标记 ------------------------ */
  const copyParams = useMemo(() => {
    if (!copyTarget) return [];
    const v = copyTarget.protocolVersions[copyTarget.protocolVersions.length - 1];
    const p = v.protocol;
    return [
      { label: '移植路径', value: p.administrationRoute },
      { label: '参考剂量', value: p.recommendedDose },
      { label: '给药频次', value: p.frequency },
      { label: '疗程', value: p.treatmentDuration },
      { label: '肠道准备', value: p.bowelPreparation },
      { label: '预处理', value: p.preTreatment },
      { label: '联合用药', value: p.combinedTherapy },
      { label: '营养干预', value: p.nutritionalIntervention },
      { label: '复评节点', value: p.reviewMilestones.join(' / ') }
    ];
  }, [copyTarget]);

  const copyBlocked = copyTarget
    ? !(overrides[copyTarget.id]?.allowClinicalReference ?? copyTarget.allowClinicalReference)
    : false;

  const confirmMarkReference = () => {
    if (!copyTarget) return;
    const markedId = copyTarget.id;
    setMarkedRefId(markedId);
    setCopyTarget(null);
    setToast(
      `已将 ${markedId} 标记为当前患者（${patient.name}）的参考样本。本库不向其他屏传参，` +
        `请对照该样本参数人工重新评估，并在「供受体智能匹配」屏重新执行全部门控校验。`
    );
  };

  const weightMax = Math.max(weights.clinical, weights.physical, weights.microbiome, 1);
  const weightRadarValues: [number, number, number] = [
    (weights.clinical / weightMax) * 100,
    (weights.physical / weightMax) * 100,
    (weights.microbiome / weightMax) * 100
  ];
  const w = normalizeWeights(weights);

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  return (
    <div id="historical-sample-library" className="space-y-3.5">
      <GlobalRefBanner />

      {/* 常驻上下文栏：查询主体 + 参考标记状态。
          分屏后本屏不向外跳转，「以谁为查询输入」「当前标记了哪条参考样本」
          这两件事必须常驻，否则切到任一 Tab 都失去判断依据。 */}
      <ContextBar
        icon={Library}
        title="历史治疗样本参考库"
        subtitle={`以当前接诊患者 ${patient.name} 为查询输入，在已闭环 FMT 样本库做多维度相似度召回 · 只读参考，不替代医生决策`}
        badges={
          <>
            <ScreenSlotBadge slot={5} />
            <span className="text-xs px-2 py-0.5 rounded bg-[#151f3d] text-[#8996b8] border border-[#2b4170]/40 font-mono">
              {patient.gender} · {patient.age}岁 · {patientVector.diagnosisCategory}
            </span>
            {markedRefId && (
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-[#23e6b1]/15 text-[#23e6b1] border border-[#23e6b1]/40 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 参考标记 {markedRefId}
              </span>
            )}
          </>
        }
        metrics={[
          { label: '库内样本', value: historicalSamples.length, tone: 'default' },
          { label: '本次召回', value: filtered.length, tone: 'info' },
          { label: '已收藏', value: favorites.length, tone: 'warn' }
        ]}
        status={
          <>
            相似度权重 临床{weights.clinical} / 体质{weights.physical} / 菌群{weights.microbiome}
          </>
        }
      />

      <SecondaryNav
        items={LIBRARY_TABS}
        active={viewMode}
        onChange={setViewMode}
        trailing={`召回结果按${sortMode === 'similarity' ? '相似度' : '风险等级'}排序`}
      />

      {viewMode === 'admin' ? (
        <div className="history-fade-in">
          <SampleLibraryAdmin samples={historicalSamples} overrides={overrides} onChange={updateOverride} />
        </div>
      ) : viewMode === 'compare' ? (
        <div className="history-fade-in space-y-3.5">
          {/* 对比模式下的样本切换条 */}
          <SectionCard
            title="选择对比样本"
            icon={<Scale className="w-3.5 h-3.5 text-[#815cff]" />}
            right={<span className="text-[10px] text-[#8996b8]">共 {filtered.length} 条召回结果，点击切换右侧对比对象</span>}
          >
            <div className="flex items-center gap-2 overflow-x-auto history-scroll pb-1">
              {filtered.map(({ sample, similarity }) => {
                const active = sample.id === selected?.sample.id;
                const color = toneColor(similarity.overall);
                return (
                  <button
                    key={sample.id}
                    onClick={() => setSelectedId(sample.id)}
                    className={`shrink-0 px-2.5 py-2 rounded-lg border text-left transition-all ${
                      active ? 'bg-[#152347]' : 'bg-[#0c1429] hover:bg-[#101a33]'
                    }`}
                    style={{ borderColor: active ? color : 'rgba(43,65,112,0.6)', minWidth: 148 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[11px] text-[#eef4ff]">{sample.id}</span>
                      <span className="font-mono text-[11px] font-bold" style={{ color }}>
                        {similarity.overall.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-[9px] text-[#8996b8] mt-0.5 truncate">{sample.diagnosisCategory} · {sample.age}岁</div>
                    <div className="text-[9px] mt-0.5" style={{ color: SAMPLE_OUTCOME_META[sample.outcome].color }}>
                      {SAMPLE_OUTCOME_META[sample.outcome].label}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && <span className="text-[11px] text-[#8996b8]">当前筛选条件下无召回样本。</span>}
            </div>
          </SectionCard>

          {selected && selectedSimilarity && (
            <HistoryCompareView
              patient={patient}
              patientVector={patientVector}
              sample={selected.sample}
              sampleVector={buildSampleFeatureVector(selected.sample)}
              similarity={selectedSimilarity}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 history-fade-in">
          {/* ================= A 区：查询 & 相似度配置 ================= */}
          <div className="xl:col-span-3 space-y-3.5">
            {/* 当前参考对象 */}
            <SectionCard
              title="当前参考对象"
              icon={<Users className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<Tag text={queryMode === 'patient' ? '带入当前患者' : '手动设定'} color={queryMode === 'patient' ? UI.cyan : UI.amber} />}
            >
              <div className="flex items-center gap-1.5 mb-2.5 p-1 rounded-lg bg-[#0c1429] border border-[#2b4170]/50">
                <button
                  onClick={() => setQueryMode('patient')}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    queryMode === 'patient' ? 'bg-[#20cfff] text-[#090d18]' : 'text-[#8996b8] hover:text-[#eef4ff]'
                  }`}
                >
                  当前患者
                </button>
                <button
                  onClick={() => setQueryMode('manual')}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    queryMode === 'manual' ? 'bg-[#ffb84d] text-[#090d18]' : 'text-[#8996b8] hover:text-[#eef4ff]'
                  }`}
                >
                  手动设定
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0c1429] border border-[#20cfff]/30">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-[#20cfff]/15 border border-[#20cfff]/40 flex items-center justify-center text-[#20cfff] font-bold text-sm shrink-0">
                    {patient.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#eef4ff]">{patient.name}</div>
                    <div className="text-[10px] text-[#8996b8] font-mono truncate">{patient.id} · {patient.mrn}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-2.5 text-[10px]">
                  {[
                    ['适应症', queryVector.diagnosisCategory],
                    ['年龄', `${queryVector.age} 岁`],
                    ['活动度', `${queryVector.diseaseActivity}`],
                    ['Shannon', queryVector.shannonDiversity.toFixed(2)],
                    ['失衡评分', `${queryVector.dysbiosisScore}`],
                    ['FC', `${Math.round(queryVector.fecalCalprotectin)} μg/g`]
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-1">
                      <span className="text-[#8996b8]">{k}</span>
                      <span className="text-[#eef4ff] font-mono">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Tag text={queryVector.immunosuppressed ? '存在免疫抑制' : '免疫正常'} color={queryVector.immunosuppressed ? UI.red : UI.green} />
                  <Tag text={`白蛋白 ${queryVector.albumin.toFixed(1)} g/L`} color={queryVector.albumin < 30 ? UI.amber : UI.green} />
                </div>
              </div>

              {queryMode === 'manual' && (
                <div className="mt-2.5 space-y-2.5 history-fade-in">
                  <div className="p-2 rounded-lg bg-[#0c1429] border border-[#ffb84d]/35 text-[10px] text-[#ffd9a3] leading-relaxed">
                    手动设定以当前患者档案为底，仅改写下列关键项，其余维度仍沿用当前患者真实数据。
                  </div>

                  <div>
                    <label className="text-[10px] text-[#8996b8] block mb-1">适应症大类</label>
                    <div className="flex flex-wrap gap-1">
                      {CATEGORY_OPTIONS.map(c => (
                        <button
                          key={c.key}
                          onClick={() => setManual(m => ({ ...m, category: c.key }))}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                            manual.category === c.key
                              ? 'text-[#20cfff] border-[#20cfff]/60 bg-[#20cfff]/12'
                              : 'text-[#8996b8] border-[#2b4170]/50 hover:text-[#eef4ff]'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {[
                    { label: '疾病活动度', key: 'activity' as const, min: 0, max: 100, step: 1 },
                    { label: '年龄', key: 'age' as const, min: 1, max: 95, step: 1 },
                    { label: '菌群失衡评分', key: 'dysbiosis' as const, min: 0, max: 100, step: 1 }
                  ].map(item => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-[#8996b8]">{item.label}</span>
                        <span className="font-mono text-[#eef4ff]">{manual[item.key]}</span>
                      </div>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step}
                        value={manual[item.key]}
                        onChange={e => setManual(m => ({ ...m, [item.key]: Number(e.target.value) }))}
                        className="w-full accent-[#20cfff]"
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => setManual(m => ({ ...m, immunosuppressed: !m.immunosuppressed }))}
                    className={`w-full px-2 py-1.5 rounded text-[10px] font-semibold border transition-all ${
                      manual.immunosuppressed
                        ? 'text-[#ff536c] border-[#ff536c]/50 bg-[#ff536c]/12'
                        : 'text-[#23e6b1] border-[#23e6b1]/50 bg-[#23e6b1]/12'
                    }`}
                  >
                    {manual.immunosuppressed ? '宿主存在免疫抑制' : '宿主免疫正常'}
                  </button>
                </div>
              )}
            </SectionCard>

            {/* 相似度权重 */}
            <SectionCard
              title="相似度权重调节"
              icon={<Sliders className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={<span className="text-[10px] text-[#8996b8]">三项之和自动归一化</span>}
            >
              <div className="flex items-center justify-center mb-2">
                <MiniRadar3
                  values={weightRadarValues}
                  size={132}
                  labels={['临床病情', '身体状态', '菌群微生态']}
                  color={UI.cyan}
                />
              </div>

              <div className="space-y-3">
                {([
                  { key: 'clinical' as const, label: '临床病情权重', color: UI.cyan },
                  { key: 'physical' as const, label: '身体基线状态权重', color: UI.blue },
                  { key: 'microbiome' as const, label: '菌群微生态权重', color: UI.purple }
                ]).map(item => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-[#8996b8]">{item.label}</span>
                      <span className="font-mono font-bold" style={{ color: item.color }}>
                        {weights[item.key]}% <span className="text-[#2b4170] font-normal">→ 实际 {Math.round(w[item.key] * 100)}%</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={weights[item.key]}
                      onChange={e => setWeights(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                      className="w-full"
                      style={{ accentColor: item.color }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-2.5 p-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/40 text-[10px] text-[#8996b8] leading-relaxed">
                当前检索优先侧重
                <span className="text-[#20cfff] font-semibold mx-1">
                  {w.microbiome >= w.clinical && w.microbiome >= w.physical
                    ? '菌群微生态匹配'
                    : w.clinical >= w.physical
                    ? '临床病情匹配'
                    : '身体状态匹配'}
                </span>
                。权重调整会实时重算全库相似度。
              </div>
            </SectionCard>

            {/* 过滤筛选 */}
            <SectionCard title="过滤筛选项" icon={<Filter className="w-3.5 h-3.5 text-[#20cfff]" />}>
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-[#8996b8] block mb-1">历史病例结局标签</span>
                  <div className="flex flex-wrap gap-1">
                    {OUTCOME_OPTIONS.map(o => {
                      const meta = SAMPLE_OUTCOME_META[o];
                      const on = outcomeFilter.includes(o);
                      return (
                        <button
                          key={o}
                          onClick={() => setOutcomeFilter(prev => toggleIn(prev, o))}
                          className="px-1.5 py-0.5 rounded text-[10px] border transition-all"
                          style={{
                            color: meta.color,
                            borderColor: on ? meta.color : `${meta.color}55`,
                            background: on ? meta.bg : 'transparent'
                          }}
                        >
                          {on ? '✓ ' : ''}
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8996b8] block mb-1">FMT 移植路径</span>
                  <div className="flex flex-wrap gap-1">
                    {ROUTE_OPTIONS.map(r => {
                      const on = routeFilter.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => setRouteFilter(prev => toggleIn(prev, r))}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                            on ? 'text-[#815cff] border-[#815cff]/60 bg-[#815cff]/12' : 'text-[#8996b8] border-[#2b4170]/50 hover:text-[#eef4ff]'
                          }`}
                        >
                          {on ? '✓ ' : ''}{r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8996b8] block mb-1">适应症</span>
                  <div className="flex flex-wrap gap-1">
                    {CATEGORY_OPTIONS.map(c => {
                      const on = categoryFilter.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          onClick={() => setCategoryFilter(prev => toggleIn(prev, c.key))}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-all ${
                            on ? 'text-[#20cfff] border-[#20cfff]/60 bg-[#20cfff]/12' : 'text-[#8996b8] border-[#2b4170]/50 hover:text-[#eef4ff]'
                          }`}
                        >
                          {on ? '✓ ' : ''}{c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setMdtOnly(v => !v)}
                  className={`w-full px-2 py-1.5 rounded text-[10px] font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    mdtOnly ? 'text-[#20cfff] border-[#20cfff]/55 bg-[#20cfff]/12' : 'text-[#8996b8] border-[#2b4170]/50 hover:text-[#eef4ff]'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  {mdtOnly ? '✓ 仅看 MDT 讨论病例' : '仅看 MDT 讨论病例'}
                </button>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={runSearch}
                    className="flex-1 px-2 py-2 rounded-lg bg-[#20cfff] text-[#090d18] text-[11px] font-bold hover:brightness-110 shadow-[0_0_12px_rgba(32,207,255,0.3)] transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    执行相似样本检索
                  </button>
                  <button
                    onClick={resetFilters}
                    title="重置全部条件"
                    className="px-2 py-2 rounded-lg bg-[#0c1429] border border-[#2b4170]/60 text-[#8996b8] hover:text-[#eef4ff] transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ================= B 区：相似样本结果列表 ================= */}
          <div className="xl:col-span-3">
            <SectionCard
              title="相似历史样本召回结果"
              icon={<Search className="w-3.5 h-3.5 text-[#20cfff]" />}
              right={
                <button
                  onClick={() => setSortMode(prev => (prev === 'similarity' ? 'risk' : 'similarity'))}
                  className="text-[10px] text-[#20cfff] hover:underline flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {sortMode === 'similarity' ? '按综合相似度' : '按结局风险优先'}
                </button>
              }
              bodyClassName="px-2.5 py-2.5"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8996b8] mb-2 px-1">
                <span>
                  命中 <span className="text-[#20cfff] font-mono font-bold">{filtered.length}</span> / {historicalSamples.length} 条
                </span>
                <span>默认相似度降序，上限 20 条</span>
              </div>

              {searching ? (
                <div className="h-[420px] flex flex-col items-center justify-center gap-3">
                  <div className="flex items-end gap-1 h-10">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={i}
                        className="history-particle w-1 rounded-full bg-[#20cfff]"
                        style={{
                          height: `${10 + ((i * 7) % 26)}px`,
                          animationDelay: `${i * 0.09}s`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#20cfff]">正在计算样本库多维度相似度…</span>
                  <span className="text-[10px] text-[#8996b8]">临床病情 · 身体状态 · 菌群微生态</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto history-scroll pr-1">
                  {filtered.map(({ sample, similarity }) => (
                    <HistorySampleCard
                      key={sample.id}
                      sample={sample}
                      similarity={similarity}
                      selected={sample.id === selected?.sample.id}
                      favorited={isFavorited(sample.id)}
                      onSelect={() => setSelectedId(sample.id)}
                    />
                  ))}

                  {filtered.length === 0 && (
                    <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center px-4">
                      <AlertTriangle className="w-6 h-6 text-[#ffb84d]" />
                      <span className="text-[11px] text-[#eef4ff]">当前筛选条件下没有召回样本</span>
                      <span className="text-[10px] text-[#8996b8]">
                        请放宽结局标签或移植路径筛选；也可调整相似度权重后重新检索。
                      </span>
                      <button
                        onClick={resetFilters}
                        className="mt-1 px-3 py-1.5 rounded-lg bg-[#20cfff]/15 border border-[#20cfff]/45 text-[#20cfff] text-[10px] font-semibold"
                      >
                        重置筛选条件
                      </button>
                    </div>
                  )}

                  {favorites.length > 0 && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#0c1429] border border-[#ffb84d]/35">
                      <span className="text-[10px] text-[#ffb84d] font-semibold block mb-1.5">
                        我的收藏案例夹（{favorites.length}）
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {favorites.map(id => (
                          <button
                            key={id}
                            onClick={() => setSelectedId(id)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-[#ffb84d]/45 text-[#ffb84d] hover:bg-[#ffb84d]/12 transition-all"
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ================= C 区：样本详情预览 ================= */}
          <div className="xl:col-span-6">
            {selected && selectedSimilarity ? (
              <div className="history-fade-in">
                {markedRefId === selected.sample.id && (
                  <div className="mb-2.5 px-3 py-2 rounded-lg border text-[10px] flex items-center gap-2"
                    style={{ background: 'rgba(35,230,177,0.10)', borderColor: 'rgba(35,230,177,0.4)', color: UI.green }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    该样本已标记为当前患者的参考对象（屏内标记，不向其他屏传参）。请对照其方案参数人工重新评估，并在「供受体智能匹配」屏重新完成全部门控校验。
                  </div>
                )}
                <HistorySampleDetail
                  sample={selected.sample}
                  similarity={selectedSimilarity}
                  weights={weights}
                  patient={patient}
                  patientVector={patientVector}
                  compareMode={false}
                  favorited={isFavorited(selected.sample.id)}
                  onToggleFavorite={() => toggleFavorite(selected.sample.id)}
                  onRequestCopy={() => setCopyTarget(selected.sample)}
                />
              </div>
            ) : (
              <div className="rounded-xl bg-[#101a33] border border-[#2b4170]/60 p-8 flex flex-col items-center justify-center gap-2 min-h-[420px]">
                <FlaskConical className="w-8 h-8 text-[#2b4170]" />
                <span className="text-xs text-[#8996b8]">请从左侧召回结果中选择一条历史样本</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标记参考确认模态框 */}
      <CopyConfirmModal
        open={!!copyTarget}
        sampleId={copyTarget?.id ?? ''}
        outcomeLabel={copyTarget ? copyTarget.outcomeLabel : ''}
        params={copyParams}
        blocked={copyBlocked}
        blockedReason={
          copyTarget && !copyTarget.allowClinicalReference
            ? `样本 ${copyTarget.id} 被标记为「仅作风险借鉴」（${copyTarget.outcomeLabel}），系统已禁止将其标记为参考。`
            : undefined
        }
        onCancel={() => setCopyTarget(null)}
        onConfirm={confirmMarkReference}
      />

      {/* 轻提示 */}
      {toast && (
        <div className="fixed bottom-12 right-5 z-50 max-w-md px-3.5 py-2.5 rounded-xl bg-[#101a33] border border-[#23e6b1]/50 shadow-2xl history-fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#23e6b1] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#eef4ff] leading-relaxed flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-[#8996b8] hover:text-[#eef4ff]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1.5 flex items-start gap-1 text-[10px] text-[#ffb84d]">
            <Lock className="w-3 h-3 shrink-0 mt-0.5" />
            <span>
              本库只做屏内标记，不向其他屏传参；请对照该样本参数人工重新评估，并在「供受体智能匹配」屏重新执行全部门控校验。
            </span>
          </div>
        </div>
      )}

      {/* 底部数据流说明 */}
      <div className="p-3 rounded-xl bg-[#0c1429] border border-[#2b4170]/50 text-[10px] text-[#8996b8] leading-relaxed flex items-start gap-2">
        <Layers className="w-3.5 h-3.5 text-[#20cfff] shrink-0 mt-0.5" />
        <div>
          <span className="text-[#eef4ff] font-semibold">数据流：</span>
          历史已闭环 FMT 患者数据（患者中心档案 + 菌群分析 + 供受体匹配记录 + 治疗执行 + 疗效随访）→ 知识规则中心样本库管理（脱敏 / 标签 / 入库校验）→
          本参考库 → 以当前患者为查询输入执行相似度检索 → 返回相似样本列表 → 加载完整历史诊疗方案样本包 →
          <span className="text-[#20cfff]"> 屏内标记参考对象（不向其他屏传参）</span> → 医生在本屏或供受体配型屏人工对照录入 →
          重新执行风险门控校验 → MDT / 医师审核 → 治疗执行。
          <span className="text-[#ffb84d] ml-1">
            本模块不替代 AI 自动生成方案，也不替代医生最终决策。
          </span>
        </div>
      </div>
    </div>
  );
};
