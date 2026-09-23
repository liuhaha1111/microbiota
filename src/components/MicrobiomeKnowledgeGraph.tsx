import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Network,
  Search,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  X,
  Info,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Scan,
  Play,
  Layers
} from 'lucide-react';
import { MicrobialTaxon, EcologicalLink, ClinicalPatient } from '../types';
import {
  mockTaxa,
  mockEcologicalLinks,
  mockKnowledgeNodes,
  mockKnowledgeLinks,
  getPatientTaxa,
  getPatientEcologicalLinks
} from '../data/mockMicroFmtData';

export interface MicrobiomeKnowledgeGraphProps {
  mode?: 'ecological' | 'multidomain';
  initialSelectedId?: string;
  className?: string;
  compact?: boolean;
  onSelectNode?: (node: any) => void;
  patient?: ClinicalPatient;
  taxa?: MicrobialTaxon[];
  ecologicalLinks?: EcologicalLink[];
}

interface SimulatedNode {
  id: string;
  /** 画布上的短标签 */
  name: string;
  /** 完整名称 / 拉丁学名，仅在选中与悬停时展示 */
  subName?: string;
  category: string;
  type: string;
  val: number;
  color: string;
  strokeColor: string;
  x: number;
  y: number;
  /**
   * 纵深感。稳定取值于 [-1, 1]，越大越靠近观察者。
   * 由「节点度数 + 稳定哈希抖动」导出 —— 拓扑枢纽浮到前面、边缘节点退到后面，
   * 于是景深本身携带「谁是网络中心」的信息，而不只是一层装饰。
   */
  z: number;
  /**
   * 标签相对节点的偏移与对齐方式。
   * 自由网络里统一挂在节点正下方；保留这三个字段是为了让「需要单独避让」的
   * 节点（例如与相邻节点标签对撞）能在布局阶段就地覆盖，而不必改渲染分支。
   */
  labelDx: number;
  labelDy: number;
  labelAnchor: 'start' | 'middle' | 'end';
  raw: any;
}

interface SimulatedLink {
  source: string;
  target: string;
  relation: string;
  type: 'synergy' | 'antagonism' | 'positive' | 'negative' | 'neutral' | 'commensal';
  weight: number;
}

/** 连边的预计算几何：曲线路径、弧长（描边入场用）、标签锚点 */
interface LinkGeometry {
  d: string;
  len: number;
  mid: { x: number; y: number };
}

interface CategoryMeta {
  label: string;
  /** 节点主色，与筛选按钮色点保持同一口径 */
  color: string;
  /** 描边色，用于制造同色系层次 */
  stroke: string;
}

const ECO_META: Record<string, CategoryMeta> = {
  beneficial: { label: '有益菌', color: '#23e6b1', stroke: '#20cfff' },
  commensal: { label: '共生菌', color: '#815cff', stroke: '#397cff' },
  opportunistic: { label: '条件致病菌', color: '#ffb84d', stroke: '#ff536c' },
  pathogen: { label: '致病菌', color: '#ff536c', stroke: '#ffb84d' }
};

const DOMAIN_META: Record<string, CategoryMeta> = {
  disease: { label: '疾病表型', color: '#ff536c', stroke: '#ffb84d' },
  microbe: { label: '菌群靶点', color: '#20cfff', stroke: '#397cff' },
  metabolite: { label: '代谢通路', color: '#23e6b1', stroke: '#20cfff' },
  immune: { label: '免疫屏障', color: '#815cff', stroke: '#b592ff' },
  therapy: { label: 'FMT 干预', color: '#397cff', stroke: '#20cfff' }
};

/**
 * 生态网络的播种层序。四类自上而下排列，使「有益 — 致病」在初始骨架上就分居上下两端；
 * 松弛阶段会把整齐的行列揉散，但这个初始张力决定了拮抗连边大致横穿图心。
 */
const ECO_ORDER = ['beneficial', 'commensal', 'opportunistic', 'pathogen'];

/** 全景图谱的播种层序：干预 → 疾病 → 菌群 → 代谢 → 免疫，与临床推理链一致 */
const DOMAIN_ORDER = ['therapy', 'disease', 'microbe', 'metabolite', 'immune'];

/**
 * 点击传播动效每深入一层拓扑的延迟。
 * 110ms 是实测下来「看得出是一层层传出去的」与「不至于等到失去耐心」之间的折中：
 * 六层拓扑刚好铺满 0.66s，配合 1.15s 的单层动画，整段在 1.8s 内收束。
 */
const PULSE_STEP_MS = 110;

/**
 * 图内动效样式表。
 *
 * 为什么全部走 CSS 而不开 requestAnimationFrame：这些图谱在历史样本页会同时挂载两份，
 * 常驻 rAF 循环会把主线程吃满；CSS 动画交给合成器，且节点位置是静态求解的，
 * 不需要每帧重算，页面不会持续漂移。
 */
const GRAPH_ANIM_CSS = `
@keyframes kbNodeIn { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: scale(1); } }
@keyframes kbLinkDraw {
  /* 必须同时给出 dasharray 与 dashoffset：只有 dashoffset 时，浏览器在
     stroke-dasharray: none 下会直接忽略它，描边生长动画等于没写。
     动画收尾用 backwards 而非 both —— 结束后必须把 dasharray 交还给元素自身，
     否则会永久钉在入场那一刻的弧长上；用户拖拽节点把边拉长后，
     旧弧长盖不住新路径，线尾就会缺一截。 */
  from { stroke-dasharray: var(--kb-len); stroke-dashoffset: var(--kb-len); }
  to { stroke-dasharray: var(--kb-len); stroke-dashoffset: 0; }
}
@keyframes kbLinkSlide {
  /* 虚线连边不能碰 dasharray，否则会覆盖元素上的 5,4 属性把虚线变成实线；
     只滑动 dashoffset 并淡入即可。fill 用 backwards 而非 both ——
     动画结束后必须把 opacity 交还给内联样式，否则选中节点时的"淡化非邻接边"
     会被 forwards 冻结的旧透明度挡住。 */
  from { stroke-dashoffset: 24px; opacity: 0; }
  to { stroke-dashoffset: 0px; opacity: var(--kb-op); }
}
@keyframes kbHalo {
  0%, 100% { opacity: var(--kb-halo-lo); }
  50% { opacity: var(--kb-halo-hi); }
}
@keyframes kbRipple {
  0% { transform: scale(1); opacity: .8; }
  75% { transform: scale(1.9); opacity: 0; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes kbFlow { to { stroke-dashoffset: -16px; } }
@keyframes kbGridDrift { to { transform: translate(60px, 60px); } }

/* 点击传播：脉冲环从被点节点向外炸开一圈 */
@keyframes kbPulseRing {
  0%   { transform: scale(.5); opacity: 0; }
  22%  { opacity: .95; }
  100% { transform: scale(2.4); opacity: 0; }
}
/* 点击传播：一道亮光沿连边从上游滑到下游。
   dasharray 由内联样式给出「一段 22px 的实线 + 一整条弧长的空白」，
   只滑动 dashoffset 就等于让这段实线走完全程。 */
@keyframes kbEdgeSweep {
  0%   { stroke-dashoffset: var(--kb-from); opacity: 0; }
  12%  { opacity: 1; }
  78%  { opacity: 1; }
  100% { stroke-dashoffset: var(--kb-to); opacity: 0; }
}

.kb-node-in { animation: kbNodeIn .55s cubic-bezier(.34,1.56,.64,1) backwards; }
.kb-halo { animation: kbHalo 5.5s ease-in-out infinite; }
.kb-ripple { animation: kbRipple 2.6s ease-out infinite; }
.kb-flow { animation: kbFlow .9s linear infinite; }
.kb-grid { animation: kbGridDrift 26s linear infinite; }
/* 脉冲环与扫描光的元素自身 opacity 为 0，动画用 backwards 收尾后自动回到不可见，
   不会在播完后留下一圈僵在画布上的轮廓 */
.kb-pulse-ring {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: kbPulseRing 1.15s cubic-bezier(.22,.9,.3,1) backwards;
}
.kb-edge-sweep {
  opacity: 0;
  animation: kbEdgeSweep 1s cubic-bezier(.35,.1,.3,1) backwards;
}
.kb-dot { transition: transform .22s cubic-bezier(.34,1.4,.64,1); }
.kb-dot[data-hover="true"] { transform: scale(1.16); }
.kb-pos { transition: transform .45s cubic-bezier(.4,0,.2,1); }
.kb-pos[data-dragging="true"] { transition: none; }
.kb-link { transition: opacity .22s ease, stroke-width .22s ease; }
.kb-node { transition: opacity .22s ease; }

@media (prefers-reduced-motion: reduce) {
  /* 只关掉动画即可：关掉后 stroke-dashoffset 回到默认 0，
     而 dasharray 仍由元素自身的属性提供（拮抗边的 5,4 虚线得以保留）。
     这里若再写 stroke-dasharray 覆盖，反而会把虚线压成实线。 */
  .kb-node-in, .kb-halo, .kb-ripple, .kb-flow, .kb-grid,
  .kb-pulse-ring, .kb-edge-sweep {
    animation: none !important;
  }
}
`;

/**
 * 基于字符串的稳定哈希（0~1）。用于打破规则布局的机械感。
 * 全程不使用 Math.random：同一份数据每次渲染必须得到完全一致的位置，
 * 否则刷新一次图就变一次，在医疗演示场景是硬伤。
 */
function hashUnit(seed: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * 二次贝塞尔连边。
 *
 * 直线在密集图谱里会大量重合、穿过节点，读不出「谁连谁」；给每条边一个
 * 垂直于弦的稳定弯曲量后，反向边不再叠在一起，交叉点也更容易被眼睛拆开。
 */
function buildLinkGeometry(s: SimulatedNode, t: SimulatedNode): LinkGeometry {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const dist = Math.hypot(dx, dy) || 1;
  const dir = hashUnit(s.id + '>' + t.id) > 0.5 ? 1 : -1;
  const bend = Math.min(34, dist * 0.13) * dir;
  const cx = (s.x + t.x) / 2 - (dy / dist) * bend;
  const cy = (s.y + t.y) / 2 + (dx / dist) * bend;

  // 采样求弧长：描边入场动画需要 dasharray 等于真实弧长，否则会画出半截线
  let len = 0;
  let px = s.x;
  let py = s.y;
  const N = 14;
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const iu = 1 - u;
    const x = iu * iu * s.x + 2 * iu * u * cx + u * u * t.x;
    const y = iu * iu * s.y + 2 * iu * u * cy + u * u * t.y;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }

  return {
    d: `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}`,
    len,
    // B(0.5) = 0.25·P0 + 0.5·P1 + 0.25·P2
    mid: {
      x: 0.25 * s.x + 0.5 * cx + 0.25 * t.x,
      y: 0.25 * s.y + 0.5 * cy + 0.25 * t.y
    }
  };
}

/**
 * 分层播种：按类别把节点排成横向层带，作为力导向松弛的初始骨架。
 *
 * 注意这只是「起手式」——真正决定观感的是随后的 `relaxLayout`。分层播种的价值在于
 * 保证同类别节点一开始就聚在一起，避免纯随机撒点收敛到某个局部最优、
 * 把「有益菌」和「致病菌」搅成一团。
 */
function seedPositions(
  groups: Array<{ key: string; nodes: SimulatedNode[] }>,
  w: number,
  h: number
): void {
  const padX = 74;
  const padY = 56;
  const usableW = Math.max(160, w - padX * 2);
  const usableH = Math.max(160, h - padY * 2);

  // 单行最多容纳的节点数：保证水平间距不低于 ~96px，避免标签互相压盖
  const perRow = Math.max(3, Math.min(9, Math.floor(usableW / 96)));
  const rowsPerGroup = groups.map(g => Math.max(1, Math.ceil(g.nodes.length / perRow)));
  const totalRows = rowsPerGroup.reduce((a, b) => a + b, 0) || 1;
  const rowPitch = usableH / totalRows;

  let rowCursor = 0;
  groups.forEach((g, gi) => {
    const rows = rowsPerGroup[gi];
    const perRowBalanced = Math.ceil(g.nodes.length / rows);
    for (let r = 0; r < rows; r++) {
      const rowNodes = g.nodes.slice(r * perRowBalanced, (r + 1) * perRowBalanced);
      const rowCenterY = padY + (rowCursor + r + 0.5) * rowPitch;
      const step = usableW / Math.max(1, rowNodes.length);
      rowNodes.forEach((nd, k) => {
        nd.x = padX + (k + 0.5) * step;
        nd.y = rowCenterY;
      });
    }
    rowCursor += rows;
  });
}

/**
 * 力导向松弛：库仑斥力负责「揉散」，弱弹簧负责「把有连边的节点拉近」，
 * 锚点回拉负责「别跑太远」。
 *
 * 与原实现的关键差别是**不追求收敛**：锚点系数取得很大（kSeed）、只跑 30 轮就停。
 * 于是节点从整齐的行列被揉开、但类别骨架仍然可辨 —— 这正是想要的有机网络感。
 * 若把 kSeed 调小让它收敛，整张图会缩成一团毛球，反而读不出结构。
 *
 * 全程不用 Math.random：初值来自确定性播种，迭代也是确定性的，
 * 同一份数据每次渲染必然得到完全一致的位置。
 */
function relaxLayout(
  nodes: SimulatedNode[],
  links: SimulatedLink[],
  w: number,
  h: number,
  iterations = 30
): void {
  const indexById = new Map<string, number>();
  nodes.forEach((nd, i) => indexById.set(nd.id, i));

  const pairs: Array<[number, number]> = [];
  for (const l of links) {
    const ai = indexById.get(l.source);
    const bi = indexById.get(l.target);
    if (ai !== undefined && bi !== undefined) pairs.push([ai, bi]);
  }

  const kSeed = 0.04;    // 强锚点回拉：牢牢锁住分层骨架
  const kSpring = 0.002; // 连边弹簧仅作极弱微调
  const targetDist = 150;
  const marginX = 72;
  const marginY = 50;
  // 斥力基准距离随节点数收缩。画布面积是固定的，节点数翻倍就必须让每个节点的
  // 领地减半，否则斥力会把整张图顶到边界上、贴着四周糊成一圈。
  // 以 8 个节点为基准 1.0；下限 0.55 是为了不让节点数很多时压到互相重叠。
  const minDistScale = 3.4 * Math.max(0.55, Math.sqrt(8 / Math.max(8, nodes.length)));

  const n = nodes.length;
  const vx = new Float64Array(n);
  const vy = new Float64Array(n);
  const seedX = nodes.map(nd => nd.x);
  const seedY = nodes.map(nd => nd.y);

  for (let iter = 0; iter < iterations; iter++) {
    vx.fill(0);
    vy.fill(0);

    for (let i = 0; i < n; i++) {
      vx[i] += (seedX[i] - nodes[i].x) * kSeed;
      vy[i] += (seedY[i] - nodes[i].y) * kSeed;
    }

    // 库仑斥力：保证节点不叠，同时把行列揉散
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);
        const minDist = (nodes[i].val + nodes[j].val) * minDistScale;
        const force = Math.min(42, (minDist * minDist * 2.4) / distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        vx[i] -= fx; vy[i] -= fy;
        vx[j] += fx; vy[j] += fy;
      }
    }

    // Hooke 弹簧
    for (const [ai, bi] of pairs) {
      const dx = nodes[bi].x - nodes[ai].x;
      const dy = nodes[bi].y - nodes[ai].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - targetDist) * kSpring;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      vx[ai] += fx; vy[ai] += fy;
      vx[bi] -= fx; vy[bi] -= fy;
    }

    for (let i = 0; i < n; i++) {
      vx[i] *= 0.68;
      vy[i] *= 0.68;
      nodes[i].x = Math.max(marginX, Math.min(w - marginX, nodes[i].x + vx[i]));
      nodes[i].y = Math.max(marginY, Math.min(h - marginY, nodes[i].y + vy[i]));
    }
  }
}

/**
 * 纵深感：为每个节点求一个稳定取值于 [-1, 1] 的 z，越大越靠近观察者。
 *
 * 七分靠拓扑、三分靠抖动 —— 纯按度数排会让同度数的节点全部落在同一层，
 * 看着像贴纸；纯随机又会让景深失去语义。混合之后，网络枢纽自然浮到前面。
 */
function computeDepth(nodes: SimulatedNode[], links: SimulatedLink[]): void {
  const deg = new Map<string, number>();
  for (const l of links) {
    deg.set(l.source, (deg.get(l.source) || 0) + 1);
    deg.set(l.target, (deg.get(l.target) || 0) + 1);
  }
  const maxDeg = Math.max(1, ...Array.from(deg.values()));
  for (const nd of nodes) {
    const norm = (deg.get(nd.id) || 0) / maxDeg;
    const jitter = hashUnit(nd.id, 23) * 2 - 1;
    nd.z = Math.max(-1, Math.min(1, norm * 0.72 + jitter * 0.28));
  }
}

/**
 * 点击传播的层级深度：以被点节点为源做 BFS，得到每个节点距源的最短跳数。
 * 渲染时把深度乘以 PULSE_STEP_MS 作为 animation-delay，脉冲便沿拓扑一层层传出去。
 */
function buildPulseDepths(
  originId: string,
  links: SimulatedLink[],
  maxDepth = 6
): Map<string, number> {
  const adj = new Map<string, string[]>();
  for (const l of links) {
    if (!adj.has(l.source)) adj.set(l.source, []);
    if (!adj.has(l.target)) adj.set(l.target, []);
    adj.get(l.source)!.push(l.target);
    adj.get(l.target)!.push(l.source);
  }

  const depth = new Map<string, number>([[originId, 0]]);
  const queue: string[] = [originId];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = depth.get(cur)!;
    if (d >= maxDepth) continue;
    for (const nb of adj.get(cur) || []) {
      if (!depth.has(nb)) {
        depth.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return depth;
}

/**
 * 十六进制颜色混合，用于按主色派生球体渐变的三档色阶（高光 / 本体 / 暗面）。
 * 手写三档色值会随配色调整而漂移，程序派生能保证「换个主色整套渐变跟着变」。
 */
function mixHex(hex: string, target: string, t: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(target.slice(1), 16);
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t);
  const g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t);
  const bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

export const MicrobiomeKnowledgeGraph: React.FC<MicrobiomeKnowledgeGraphProps> = ({
  mode: initialGraphMode = 'ecological',
  initialSelectedId,
  className = '',
  compact = false,
  onSelectNode,
  patient,
  taxa,
  ecologicalLinks
}) => {
  const [graphMode, setGraphMode] = useState<'ecological' | 'multidomain'>(initialGraphMode);
  const [density, setDensity] = useState<'core' | 'extended'>('core');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<SimulatedNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Anti-occlusion controls: drawer collapse state & fullscreen mode
  // In compact mode, default drawer to collapsed so it does not occlude graph
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(compact);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [replayNonce, setReplayNonce] = useState(0);
  /**
   * 点击传播：originId 是被点的节点，nonce 每次点击都递增。
   * 必须带 nonce —— 只靠 originId 的话，重复点击同一节点时 React 认为 key 没变、
   * 元素不会重建，动画也就不会重播。
   */
  const [pulse, setPulse] = useState<{ originId: string; nonce: number } | null>(null);

  const containerWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isPanningRef = useRef(false);
  const startPanPosRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimulatedNode | null>(null);
  const panOffsetRef = useRef(panOffset);
  const zoomLevelRef = useRef(zoomLevel);
  const nodesRef = useRef<SimulatedNode[]>([]);
  // 始终指向最新的 autoFitView，供布局收敛后的定时器调用
  const autoFitViewRef = useRef<(() => void) | null>(null);

  panOffsetRef.current = panOffset;
  zoomLevelRef.current = zoomLevel;

  // Dynamic canvas dimensions via ResizeObserver
  const [dimensions, setDimensions] = useState({ width: 800, height: 520 });

  // Effective data sources based on selected patient
  const effectiveTaxa = useMemo(() => {
    return taxa || (patient ? getPatientTaxa(patient.id) : mockTaxa);
  }, [taxa, patient?.id]);

  const effectiveEcoLinks = useMemo(() => {
    return ecologicalLinks || (patient ? getPatientEcologicalLinks(patient.id) : mockEcologicalLinks);
  }, [ecologicalLinks, patient?.id]);

  // Update container dimensions accurately with ResizeObserver
  useEffect(() => {
    const el = svgContainerRef.current || containerWrapperRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const target = svgContainerRef.current || containerWrapperRef.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        const w = rect.width || 800;
        const h = rect.height || (compact ? 440 : 520);
        if (w > 50 && h > 50) {
          setDimensions({ width: Math.round(w), height: Math.round(h) });
        }
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isDrawerCollapsed, isFullscreen, compact]);

  /** 全景图谱在全量密度下的节点规模，用于密度切换按钮上的计数 */
  const extendedNodeCount = mockKnowledgeNodes.length;

  // Build initial nodes & links scaled to current canvas dimensions
  const { initialNodes, initialLinks, layoutScale } = useMemo(() => {
    const w = dimensions.width;
    const h = dimensions.height;
    const isEco = graphMode === 'ecological';
    const meta = isEco ? ECO_META : DOMAIN_META;
    const order = isEco ? ECO_ORDER : DOMAIN_ORDER;

    // ---- 1. 草稿节点（只带语义信息，尺寸与坐标稍后按画布求解）----
    type Draft = Omit<SimulatedNode, 'x' | 'y' | 'z' | 'val' | 'labelDx' | 'labelDy' | 'labelAnchor'> & {
      rawVal: number;
    };
    let draft: Draft[];

    if (isEco) {
      draft = effectiveTaxa.map(t => {
        const m = ECO_META[t.category] || ECO_META.beneficial;
        return {
          id: t.id,
          name: t.chineseName.split(' ')[0],
          subName: t.name,
          category: t.category,
          type: 'microbe',
          color: m.color,
          strokeColor: m.stroke,
          raw: t,
          // 丰度跨两个数量级（0.18% ~ 14.8%），线性映射会把低丰度菌全压成同一个点
          rawVal: 17 + Math.min(9, Math.sqrt(Math.max(0, t.abundance)) * 2.4)
        };
      });
    } else {
      const pool = density === 'core'
        ? mockKnowledgeNodes.filter(n => (n.tier ?? 'core') === 'core')
        : mockKnowledgeNodes;
      draft = pool.map(n => {
        const m = DOMAIN_META[n.type] || DOMAIN_META.microbe;
        return {
          id: n.id,
          name: n.shortName || n.name,
          subName: n.name,
          category: n.type,
          type: n.type,
          color: m.color,
          strokeColor: m.stroke,
          raw: n,
          rawVal: 14 + (n.val - 16) * 0.7
        };
      });
    }

    // ---- 2. 分组（保持语义顺序，未在 order 中列出的类别按原顺序追加）----
    const cats = Array.from(new Set(draft.map(d => d.category))).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    const grouped = cats.map(cat => ({
      key: cat,
      meta: meta[cat] || { label: cat, color: '#20cfff', stroke: '#397cff' },
      nodes: draft.filter(d => d.category === cat)
    }));

    // ---- 3. 尺度：节点半径随可用空间收缩，避免紧凑画布上直接叠死 ----
    const usableW = Math.max(120, w - 84);
    const usableH = Math.max(90, h - 72);
    // 自由网络里真正的约束是「画布能摊开多大」：节点一多，斥力再怎么推也挤不下，
    // 只能整体缩小节点直径，否则整张图会被顶到边界上糊成一圈。
    const layoutScale = Math.max(0.42, Math.min(1.15, Math.min(usableW / 620, usableH / 360)));

    const nodes: SimulatedNode[] = grouped.flatMap(g =>
      g.nodes.map(d => {
        const { rawVal, ...rest } = d;
        return {
          ...rest,
          val: Math.round(Math.max(8, Math.min(26, rawVal * layoutScale))),
          x: 0,
          y: 0,
          z: 0,
          labelDx: 0,
          labelDy: 0,
          labelAnchor: 'middle' as const
        };
      })
    );

    // ---- 4. 连边：必须在松弛之前构造出来，弹簧项要用拓扑 ----
    const presentIds = new Set(nodes.map(n => n.id));
    const rawLinks: SimulatedLink[] = isEco
      ? effectiveEcoLinks.map(l => ({
          source: l.source,
          target: l.target,
          relation: l.description,
          type: l.type,
          weight: l.weight
        }))
      : mockKnowledgeLinks.map(l => ({
          source: typeof l.source === 'string' ? l.source : l.source.id,
          target: typeof l.target === 'string' ? l.target : l.target.id,
          relation: l.relation,
          type: l.effect,
          weight: 0.8
        }));
    const links = rawLinks.filter(l => presentIds.has(l.source) && presentIds.has(l.target));

    // ---- 5. 坐标求解：分层播种 -> 力导向松弛 -> 深度赋值 ----
    const positioned = grouped.map(g => ({
      ...g,
      nodes: g.nodes.map(d => nodes.find(n => n.id === d.id)!) as SimulatedNode[]
    }));
    seedPositions(positioned, w, h);
    relaxLayout(nodes, links, w, h);
    computeDepth(nodes, links);
    // 标签统一挂在节点正下方。节点半径已由 layoutScale 收过，这里只需保证
    // 不压到节点本身、并给下沿留出一行字高。
    for (const nd of nodes) {
      nd.labelDy = nd.val + 14;
    }

    return { initialNodes: nodes, initialLinks: links, layoutScale };
  }, [graphMode, density, dimensions, effectiveTaxa, effectiveEcoLinks]);

  // Nodes state with dynamic force simulation
  const [nodes, setNodes] = useState<SimulatedNode[]>(initialNodes);
  const [links, setLinks] = useState<SimulatedLink[]>(initialLinks);

  nodesRef.current = nodes;

  // Sync when mode / density / patient changes
  useEffect(() => {
    setNodes(initialNodes);
    setLinks(initialLinks);
    if (initialNodes.length > 0) {
      // 保留当前选中项：切密度时若原节点仍在图内就不该跳走
      const keep = selectedNode ? initialNodes.find(n => n.id === selectedNode.id) : undefined;
      const preferredId =
        initialSelectedId ||
        (graphMode === 'multidomain' && patient?.targetDiseaseNodeId ? patient.targetDiseaseNodeId : undefined);
      const match = keep || (preferredId ? initialNodes.find(n => n.id === preferredId) : undefined) || initialNodes[0];
      setSelectedNode(match || null);
    } else {
      setSelectedNode(null);
    }
    // selectedNode 刻意不进依赖：它只用于「尽量保留选中」，进依赖会造成切密度时的循环更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialLinks, initialSelectedId, patient?.id, graphMode]);

  // 布局已在 useMemo 中同步求解完毕，这里只需在数据/尺寸切换后自动适配视野
  useEffect(() => {
    const timer = window.setTimeout(() => {
      autoFitViewRef.current?.();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [graphMode, density, patient?.id, dimensions.width, dimensions.height]);

  // Filtering
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchSearch =
        searchQuery.trim() === '' ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.subName && n.subName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        selectedFilter === 'all' || n.category === selectedFilter || n.type === selectedFilter;

      return matchSearch && matchFilter;
    });
  }, [nodes, searchQuery, selectedFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // 各类别节点计数，供筛选按钮兼作图例
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of nodes) {
      counts[n.category] = (counts[n.category] || 0) + 1;
    }
    return counts;
  }, [nodes]);

  /**
   * 连边 + 预计算几何。几何随节点坐标变化（拖拽）而重算，
   * 弧长采样只有 14 段，40 条边的开销可以忽略。
   */
  const visibleLinks = useMemo(() => {
    const byId = new Map<string, SimulatedNode>(nodes.map(n => [n.id, n] as [string, SimulatedNode]));
    const out: Array<{ key: string; link: SimulatedLink; geo: LinkGeometry; z: number }> = [];
    links.forEach((l, i) => {
      if (!filteredNodeIds.has(l.source) || !filteredNodeIds.has(l.target)) return;
      const s = byId.get(l.source);
      const t = byId.get(l.target);
      if (!s || !t) return;
      out.push({
        key: `${l.source}-${l.target}-${i}`,
        link: l,
        geo: buildLinkGeometry(s, t),
        // 两端深度的均值。连边的粗细与明暗跟着它走 —— 这是纵深感里最省成本的一层，
        // 不需要任何 filter，却能让远处的边自然退到背景里去。
        z: (s.z + t.z) / 2
      });
    });
    return out;
  }, [links, nodes, filteredNodeIds]);

  // Connected node IDs for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const set = new Set<string>();
    set.add(selectedNode.id);
    for (const link of links) {
      if (link.source === selectedNode.id) set.add(link.target);
      if (link.target === selectedNode.id) set.add(link.source);
    }
    return set;
  }, [selectedNode, links]);

  /**
   * 点击传播的层级表：节点 id -> 距被点节点的最短跳数。
   * 渲染时深度 × PULSE_STEP_MS 即得 animation-delay，脉冲便沿拓扑逐层外扩。
   */
  const pulseDepths = useMemo(
    () => (pulse ? buildPulseDepths(pulse.originId, links) : null),
    [pulse, links]
  );

  const focusNodeId = hoveredNodeId || selectedNode?.id || null;

  /**
   * 自适应视野：仅在内容确实溢出画布时才缩放。
   *
   * 原实现无条件按包围盒 fit（实测把内容缩到 0.835），而布局本身已经把节点
   * 排在 viewBox 之内，这一刀纯属自伤 —— 标签被压到 9px 读不清。
   */
  const autoFitView = useCallback(() => {
    if (nodes.length === 0) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const n of nodes) {
      // 标签宽度按短名估算（CJK 字宽约等于字号），否则长标签会被裁掉
      const half = (n.name?.length ?? 4) * 5.6 + 6;
      const lx = n.x + n.labelDx;
      const ly = n.y + n.labelDy;
      const labelLeft = n.labelAnchor === 'start' ? lx : lx - half;
      const labelRight = n.labelAnchor === 'end' ? lx : lx + half;
      minX = Math.min(minX, n.x - n.val - 6, labelLeft);
      maxX = Math.max(maxX, n.x + n.val + 6, labelRight);
      minY = Math.min(minY, n.y - n.val - 8, ly - 12);
      maxY = Math.max(maxY, n.y + n.val + 8, ly + 16);
    }

    // 松弛本身已经把节点约束在 marginX/marginY 之内，内容天然落在 viewBox 里。
    // 此时若无脑按包围盒重新居中，反而会把整体平移一点点、让留白看着歪 ——
    // 所以先判断是否真的溢出，不溢出就保持 1:1。
    const overflow =
      minX < -2 || maxX > dimensions.width + 2 || minY < -2 || maxY > dimensions.height + 2;
    if (!overflow) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const needW = (maxX - minX) + 20;
    const needH = (maxY - minY) + 20;
    const fit = Math.min(1, Math.min(dimensions.width / needW, dimensions.height / needH));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoomLevel(fit);
    setPanOffset({
      x: dimensions.width / 2 - centerX * fit,
      y: dimensions.height / 2 - centerY * fit
    });
  }, [nodes, dimensions]);

  autoFitViewRef.current = autoFitView;

  // Dragging interaction
  const handleNodeMouseDown = (e: React.MouseEvent, node: SimulatedNode) => {
    e.stopPropagation();
    draggedNodeRef.current = node;
    setDraggingId(node.id);
    setSelectedNode(node);
    if (isDrawerCollapsed) {
      setIsDrawerCollapsed(false);
    }
    if (onSelectNode) onSelectNode(node.raw);
    // 点击即从该节点沿拓扑向外广播一圈脉冲。放在 mousedown 而不是 click，
    // 是为了和「拖拽改拓扑」共用同一次手势 —— 拖起来时脉冲正好当反馈。
    setPulse(prev => ({ originId: node.id, nonce: (prev?.nonce ?? 0) + 1 }));
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      isPanningRef.current = true;
      startPanPosRef.current = { x: e.clientX - panOffsetRef.current.x, y: e.clientY - panOffsetRef.current.y };
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    // 视差：鼠标相对画布中心的位置映射成 ±7px 的偏移，写进 CSS 变量由节点自行取用。
    // 走 CSS 变量而不是 React state —— 后者会让 50 个节点 + 90 条边每次 mousemove 全量重渲染。
    const stage = svgContainerRef.current;
    if (stage) {
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / (r.width || 1) - 0.5) * 2;
      const ny = ((e.clientY - r.top) / (r.height || 1) - 0.5) * 2;
      stage.style.setProperty('--kb-px', `${(nx * 7).toFixed(2)}px`);
      stage.style.setProperty('--kb-py', `${(ny * 7).toFixed(2)}px`);
    }

    const dragged = draggedNodeRef.current;
    if (dragged && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleRatioX = dimensions.width / (rect.width || 1);
      const scaleRatioY = dimensions.height / (rect.height || 1);
      const pan = panOffsetRef.current;
      const zoom = zoomLevelRef.current;
      dragged.x = ((e.clientX - rect.left) * scaleRatioX - pan.x) / zoom;
      dragged.y = ((e.clientY - rect.top) * scaleRatioY - pan.y) / zoom;
      // 就地改坐标后浅拷贝一份触发重渲染，避免每次拖拽都深拷贝整张图
      setNodes(nodesRef.current.map(n => (n.id === dragged.id ? { ...n, x: dragged.x, y: dragged.y } : n)));
    } else if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - startPanPosRef.current.x,
        y: e.clientY - startPanPosRef.current.y
      });
    }
  };

  const handleSvgMouseUp = () => {
    draggedNodeRef.current = null;
    isPanningRef.current = false;
    setDraggingId(null);
  };

  /** 鼠标离开画布时把视差归零，否则节点会僵在最后一次的偏移上 */
  const resetParallax = () => {
    const stage = svgContainerRef.current;
    if (!stage) return;
    stage.style.setProperty('--kb-px', '0px');
    stage.style.setProperty('--kb-py', '0px');
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // 入场动画的重播键：只在模式/密度/患者/手动重播时变化，窗口缩放不重播
  const animKey = `${graphMode}|${density}|${patient?.id ?? 'default'}|${replayNonce}`;
  const isEco = graphMode === 'ecological';

  // 标签字号跟随布局尺度，紧凑画布上不强行塞大字号
  const labelSize = (10.4 * Math.max(0.86, Math.min(1.1, layoutScale))).toFixed(1);

  // 标签是否放得下。泳道模式看节距（全量密度下菌群层只有 ~42px），
  // 生态网络看画布宽度（历史样本对比页里每张图只有 ~330px 宽，
  // 环形簇内 4 个节点各挂一个标签必然互压）。放不下时退化为
  // 「悬停/命中搜索才出名字」的概览模式。
  // 标签是否放得下。自由网络里标签统一挂在节点正下方，判据就一条：画布够不够大。
  // 历史样本对比页每张图只有约 330px 宽，16 个节点的标签必然糊成一片，
  // 此时退化为「悬停 / 命中搜索才出名字」的概览模式。
  const labelRoom = dimensions.width >= 420 && dimensions.height >= 300;
  // 副标签（全称 / 拉丁学名）要多占一行，需要额外的高度余量
  const roomForSublabel = dimensions.width >= 560 && dimensions.height >= 380;

  return (
    <div
      id="microbiome-knowledge-graph-wrapper"
      className={`relative rounded-xl border border-[#1e2f57] bg-[#0c1429] flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen' : className
      }`}
      style={{ minHeight: compact ? '460px' : '560px' }}
    >
      {/* 1. Top Header & Primary Toolbar */}
      <div id="graph-toolbar" className="shrink-0 p-3 border-b border-[#1e2f57] flex flex-wrap items-center justify-between gap-3 bg-[#091127]/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#20cfff]/15 text-[#20cfff]">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#eef4ff] flex items-center gap-2">
              {isEco ? '微生态菌群相互作用网络' : '全景微生态-代谢-免疫知识图谱'}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#20cfff]/20 text-[#20cfff] font-mono">
                {isEco ? 'Ecological Network' : 'Knowledge Graph'}
              </span>
              {isFullscreen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#23e6b1]/20 text-[#23e6b1] font-medium">
                  全屏工作台
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#8996b8]">
              {isEco
                ? '按功能群着色，青蓝实线＝互养协同，红色虚线＝拮抗竞争；球体大小与前后层次反映丰度与网络地位'
                : '按实体类型着色，箭头表示作用方向；球体大小与前后层次反映权重与网络地位'}
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Mode Switch Button */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#101a33] border border-[#2b4170]/60 text-xs">
            <button
              id="graph-mode-ecological"
              onClick={() => {
                setGraphMode('ecological');
                setSelectedFilter('all');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                graphMode === 'ecological'
                  ? 'bg-[#20cfff] text-[#090d18] font-semibold shadow-sm'
                  : 'text-[#8996b8] hover:text-[#eef4ff]'
              }`}
            >
              菌群生态网络
            </button>
            <button
              id="graph-mode-multidomain"
              onClick={() => {
                setGraphMode('multidomain');
                setSelectedFilter('all');
              }}
              className={`px-2.5 py-1 rounded-md transition-all ${
                graphMode === 'multidomain'
                  ? 'bg-[#815cff] text-white font-semibold shadow-sm'
                  : 'text-[#8996b8] hover:text-[#eef4ff]'
              }`}
            >
              全景知识图谱
            </button>
          </div>

          {/* 密度切换：只在全景图谱下出现 */}
          {!isEco && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#101a33] border border-[#2b4170]/60 text-xs">
              <button
                id="graph-density-core"
                onClick={() => setDensity('core')}
                title="只渲染知识主干实体，节点更大、标签不重叠"
                className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                  density === 'core'
                    ? 'bg-[#23e6b1]/20 text-[#23e6b1] font-semibold'
                    : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <Layers className="w-3 h-3" />
                核心子图
              </button>
              <button
                id="graph-density-extended"
                onClick={() => setDensity('extended')}
                title="展开适应症外延与补充知识实体"
                className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                  density === 'extended'
                    ? 'bg-[#815cff]/20 text-[#815cff] font-semibold'
                    : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                全量 {extendedNodeCount}
              </button>
            </div>
          )}

          {/* Zoom & Auto-Fit Toolbar */}
          <div className="flex items-center gap-0.5 bg-[#101a33] border border-[#2b4170]/60 p-0.5 rounded-lg text-[#8996b8]">
            <button
              onClick={() => setReplayNonce(n => n + 1)}
              className="p-1 hover:text-[#23e6b1] hover:bg-[#152347] rounded flex items-center gap-1 text-[11px] px-1.5"
              title="重播拓扑入场动效"
            >
              <Play className="w-3.5 h-3.5 text-[#23e6b1]" />
              <span className="hidden sm:inline">重播</span>
            </button>
            <button
              onClick={autoFitView}
              className="p-1 hover:text-[#20cfff] hover:bg-[#152347] rounded flex items-center gap-1 text-[11px] px-1.5"
              title="自适应全局视野 (防遮挡最佳视角)"
            >
              <Scan className="w-3.5 h-3.5 text-[#20cfff]" />
              <span className="hidden sm:inline">自适应</span>
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.15))}
              className="p-1 hover:text-[#eef4ff] hover:bg-[#152347] rounded"
              title="放大视野"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.15))}
              className="p-1 hover:text-[#eef4ff] hover:bg-[#152347] rounded"
              title="缩小视野"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:text-[#eef4ff] hover:bg-[#152347] rounded"
              title="复位默认缩放"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Expand / Collapse Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg border transition-all ${
              isFullscreen
                ? 'bg-[#20cfff] text-[#090d18] border-[#20cfff]'
                : 'bg-[#101a33] border-[#2b4170]/60 text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
            title={isFullscreen ? '退出全屏' : '全屏展开知识拓扑 (消除一切遮挡)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Sub-bar: Search & Multi-category Filters */}
      <div className="shrink-0 px-3 py-2 border-b border-[#1e2f57]/80 flex flex-wrap items-center justify-between gap-2 bg-[#0a1329]/80 text-xs z-10">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#8996b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isEco ? '搜索菌种 (如: Akkermansia, 普氏栖粪杆菌...)' : '搜索知识靶点 (如: 丁酸, UC, LPS, FMT...)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 rounded-md bg-[#101a33] border border-[#2b4170]/70 text-[#eef4ff] placeholder-[#8996b8]/60 text-xs focus:outline-none focus:border-[#20cfff]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8996b8] hover:text-[#eef4ff]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters（同时充当图例，色点与节点主色同一口径） */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40'
                : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            {isEco ? `全部菌种 ${nodes.length}` : `全节点 ${nodes.length}`}
          </button>
          {(isEco ? ECO_ORDER : DOMAIN_ORDER).map(cat => {
            const m = (isEco ? ECO_META : DOMAIN_META)[cat];
            if (!m || !categoryCounts[cat]) return null;
            const active = selectedFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className="px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 shrink-0"
                style={{
                  color: m.color,
                  backgroundColor: active ? `${m.color}22` : 'transparent',
                  border: `1px solid ${active ? `${m.color}66` : 'transparent'}`
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label} {categoryCounts[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Graph Canvas & Intelligent Non-Occluding Detail Panel Layout */}
      <div
        ref={containerWrapperRef}
        className="relative flex-1 w-full min-h-0 overflow-hidden flex"
        style={{ minHeight: compact ? '400px' : '500px' }}
      >
        {/* SVG Graph Viewport */}
        <div ref={svgContainerRef} className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <svg
              ref={svgRef}
              id="knowledge-graph-svg"
              width="100%"
              height="100%"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full h-full block cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleSvgMouseDown}
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={() => {
                handleSvgMouseUp();
                resetParallax();
              }}
              onWheel={(e) => {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
                setZoomLevel(z => Math.min(2.5, Math.max(0.4, z * zoomFactor)));
              }}
            >
              <style>{GRAPH_ANIM_CSS}</style>
              <defs>
                <marker
                  id="arrow-positive"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#20cfff" />
                </marker>
                <marker
                  id="arrow-negative"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff536c" />
                </marker>
                {/* 中心柔光：给整幅图一个视觉焦点，避免节点散在纯黑底上失焦 */}
                <radialGradient id="graph-vignette" cx="50%" cy="50%" r="62%">
                  <stop offset="0%" stopColor="#20cfff" stopOpacity="0.075" />
                  <stop offset="60%" stopColor="#397cff" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#090d18" stopOpacity="0" />
                </radialGradient>
                {/* 球体渐变：按类别主色程序派生三档色阶（高光 → 本体 → 暗面）。
                    手写色值表会在调色时漂移，派生则保证「换个主色整套渐变跟着变」。
                    光源固定在左上（cx=34% cy=28%），整幅图才有一致的光向。 */}
                {Object.entries(isEco ? ECO_META : DOMAIN_META).map(([key, m]) => (
                  <radialGradient key={`sphere-${key}`} id={`sphere-${key}`} cx="34%" cy="28%" r="76%">
                    <stop offset="0%" stopColor={mixHex(m.color, '#ffffff', 0.66)} />
                    <stop offset="38%" stopColor={m.color} />
                    <stop offset="100%" stopColor={mixHex(m.color, '#04060f', 0.74)} />
                  </radialGradient>
                ))}
                {/* 球面高光点用的白色柔光（边缘完全透明，否则会看到一圈硬边） */}
                <radialGradient id="kb-specular">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background click catcher */}
              <rect width="100%" height="100%" fill="transparent" />

              {/* Transform Group with Pan & Zoom */}
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
                <rect width={dimensions.width} height={dimensions.height} fill="url(#graph-vignette)" pointerEvents="none" />

                {/* Subtle background tech grid（缓慢漂移，制造"活体"底噪） */}
                <g opacity="0.07" stroke="#397cff" strokeWidth="0.5" pointerEvents="none">
                  <g className="kb-grid">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <line key={`grid-v-${i}`} x1={i * 60 - 400} y1="-400" x2={i * 60 - 400} y2="1400" />
                    ))}
                    {Array.from({ length: 28 }).map((_, i) => (
                      <line key={`grid-h-${i}`} x1="-400" y1={i * 60 - 400} x2="1800" y2={i * 60 - 400} />
                    ))}
                  </g>
                </g>

                <g key={animKey}>
                  {/* ---- A. 连边层：先画线，让线从节点下方穿过 ---- */}
                  <g className="links-group">
                    {visibleLinks.map(({ key, link, geo, z }, idx) => {
                      const isAntagonism = link.type === 'antagonism' || link.type === 'negative';
                      const touchesFocus =
                        !!focusNodeId && (focusNodeId === link.source || focusNodeId === link.target);
                      const dimmed = !!focusNodeId && !touchesFocus;
                      // z 归一化到 0~1 后映射成明暗与粗细：远处的边退到背景，近处的浮出来
                      const near = (z + 1) / 2;
                      const opacity =
                        (dimmed ? 0.1 : touchesFocus ? 0.95 : isAntagonism ? 0.6 : 0.42) *
                        (0.6 + near * 0.4);
                      const strokeWidth =
                        (touchesFocus ? 2.6 : isAntagonism ? 1.5 : 1.2) * (0.76 + near * 0.42);

                      return (
                        <path
                          key={`link-${key}`}
                          className="kb-link"
                          d={geo.d}
                          fill="none"
                          stroke={isAntagonism ? '#ff536c' : '#20cfff'}
                          strokeWidth={strokeWidth}
                          strokeLinecap="round"
                          strokeDasharray={isAntagonism ? '5,4' : undefined}
                          markerEnd={
                            !isEco ? (isAntagonism ? 'url(#arrow-negative)' : 'url(#arrow-positive)') : undefined
                          }
                          style={
                            {
                              '--kb-len': geo.len.toFixed(1),
                              '--kb-op': opacity,
                              opacity,
                              animation: isAntagonism
                                ? `kbLinkSlide .7s ease-out ${420 + idx * 16}ms backwards`
                                : `kbLinkDraw .75s ease-out ${420 + idx * 16}ms backwards`
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </g>

                  {/* ---- B. 点击传播层：从被点节点沿拓扑逐层向外扩散 ----
                      扫描光铺在连边之上、节点之下，这样光"穿过"节点时会从节点背后掠过，
                      而不是盖在节点正面。 */}
                  {pulseDepths && pulse && (
                    <g className="pulse-group" pointerEvents="none" key={`pulse-${pulse.nonce}`}>
                      {visibleLinks.map(({ key, geo, link }) => {
                        const ds = pulseDepths.get(link.source);
                        const dt = pulseDepths.get(link.target);
                        // 两端都不在传播树上就跳过；用较小的深度作为延迟，光便顺着
                        // 「离源更近 -> 离源更远」的方向滑出去
                        if (ds === undefined && dt === undefined) return null;
                        const d = Math.min(ds ?? 99, dt ?? 99);
                        return (
                          <path
                            key={`sweep-${key}`}
                            className="kb-edge-sweep"
                            d={geo.d}
                            fill="none"
                            stroke="#8ff0ff"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            // 一段 22px 的实线 + 一整条弧长的空白；只滑动 dashoffset
                            // 就等于让这段实线从起点走完全程
                            strokeDasharray={`22 ${geo.len.toFixed(1)}`}
                            style={
                              {
                                '--kb-from': geo.len.toFixed(1),
                                '--kb-to': '-22',
                                animationDelay: `${d * PULSE_STEP_MS}ms`
                              } as React.CSSProperties
                            }
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* ---- C. 选中/悬停邻接边的流光：把"当前在看哪条通路"变成可追踪的动线 ---- */}
                  <g className="link-flow-group" pointerEvents="none">
                    {visibleLinks.map(({ key, link, geo }) =>
                      focusNodeId && (focusNodeId === link.source || focusNodeId === link.target) ? (
                        <path
                          key={`flow-${key}`}
                          className="kb-flow"
                          d={geo.d}
                          fill="none"
                          stroke={link.type === 'antagonism' || link.type === 'negative' ? '#ffb84d' : '#8ff0ff'}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeDasharray="3,13"
                          opacity="0.9"
                        />
                      ) : null
                    )}
                  </g>

                  {/* ---- D. 连边标签层：仅在焦点连边上出现，避免全图文字互压 ---- */}
                  <g className="link-labels-group" pointerEvents="none">
                    {visibleLinks.map(({ key, link, geo }) => {
                      // 关系徽标只在「悬停某个节点」时出现，不给默认选中态。
                      // 原因：选中态是常驻的（父组件初始化就选中第一个节点），
                      // 徽标会永久压在节点标签上；悬停是瞬时意图，此时铺开关系才不干扰阅读。
                      const isHoverEdge =
                        !!hoveredNodeId && (hoveredNodeId === link.source || hoveredNodeId === link.target);
                      // 短边中点必然落在节点标签堆里，标了也读不出来。生物学关系在右侧
                      // 详情抽屉的「邻接网络」里逐条列着，画布上只标足够长的跨层连边。
                      const minLen = isEco ? 118 : 150;
                      if (!isHoverEdge || geo.len < minLen) return null;

                      const isAntagonism = link.type === 'antagonism' || link.type === 'negative';
                      const labelText = link.relation.length > 14 ? link.relation.slice(0, 14) + '…' : link.relation;
                      const badgeWidth = Math.min(134, labelText.length * 9.4 + 14);

                      return (
                        <g key={`link-label-${key}`} transform={`translate(${geo.mid.x}, ${geo.mid.y})`}>
                          <rect
                            x={-badgeWidth / 2}
                            y={-9}
                            width={badgeWidth}
                            height={18}
                            rx={4}
                            fill="#081024"
                            stroke={isAntagonism ? '#ff536c' : '#20cfff'}
                            strokeWidth={1}
                            opacity={0.96}
                          />
                          <text
                            y={3.5}
                            fill={isAntagonism ? '#ff94a5' : '#a2e8ff'}
                            fontSize="9.5"
                            fontFamily="monospace"
                            textAnchor="middle"
                            className="pointer-events-none select-none font-medium"
                          >
                            {labelText}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* ---- E. 节点层 ---- */}
                  <g className="nodes-group">
                    {filteredNodes.map((node, i) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isHovered = hoveredNodeId === node.id;
                      const isConnected = connectedNodeIds.has(node.id);
                      const isFocus = isSelected || isHovered;
                      const isMatchSearch =
                        searchQuery.trim() !== '' &&
                        (node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (node.subName && node.subName.toLowerCase().includes(searchQuery.toLowerCase())));

                      // 有焦点时非邻接节点退到背景层。0.24 那种压暗程度在默认选中场景下
                      // 会让半张图直接"消失"（父组件初始化时总会选中第一个菌种），
                      // 0.42 既保留层次又保证全图始终可读。
                      const nodeOpacity = focusNodeId && !isConnected && !isMatchSearch ? 0.42 : 1;
                      // 主标签是节点的身份，放得下就全显；放不下时只给悬停与命中搜索的节点
                      const showPrimaryLabel = labelRoom || isHovered || isMatchSearch;
                      // 副标签（全称/学名）只给当前焦点，且需要额外一行空间
                      const showSubLabel = (isFocus || isMatchSearch) && roomForSublabel;

                      // 纵深：z ∈ [-1,1] 归一化到 0~1，一份数据同时驱动半径、明暗、
                      // 描边粗细与视差系数 —— 四个通道一起变，眼睛才会读成"前后"而不是"大小不一"。
                      const near = (node.z + 1) / 2;
                      const r = node.val * (0.86 + near * 0.28);
                      const depthOpacity = 0.66 + near * 0.34;
                      // 视差系数：前景位移大、背景位移小。留 0.35 的底噪，保证背景也在动，
                      // 否则整张图会"分层断裂"成前后两片纸。
                      const parallaxK = (0.35 + near * 0.95).toFixed(2);

                      return (
                        <g
                          key={`node-${node.id}`}
                          id={`graph-node-${node.id}`}
                          className="kb-pos kb-node cursor-pointer"
                          data-dragging={draggingId === node.id ? 'true' : 'false'}
                          transform={`translate(${node.x}, ${node.y})`}
                          opacity={nodeOpacity * depthOpacity}
                          onMouseDown={(e) => handleNodeMouseDown(e, node)}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                        >
                          {/* 视差层：位移 = 容器的 --kb-px/--kb-py × 本节点深度系数。
                              走 CSS 变量意味着鼠标移动时由浏览器自己重算，
                              React 不必为 50 个节点 + 90 条边做全量重渲染。 */}
                          <g
                            className="kb-parallax"
                            style={{
                              transform: `translate3d(calc(var(--kb-px, 0px) * ${parallaxK}), calc(var(--kb-py, 0px) * ${parallaxK}), 0)`
                            }}
                          >
                            <g className="kb-node-in" style={{ animationDelay: `${140 + i * 26}ms` }}>
                              {/* 原生悬浮提示：短标签之外始终能拿到全称 */}
                              <title>{node.subName ? `${node.subName} — ${node.name}` : node.name}</title>

                              {/* 点击传播的脉冲环：按 BFS 深度依次炸开，形成沿拓扑外扩的波前 */}
                              {pulseDepths?.has(node.id) && (
                                <circle
                                  className="kb-pulse-ring"
                                  r={r + 6}
                                  fill="none"
                                  stroke={node.color}
                                  strokeWidth="2.4"
                                  style={{
                                    animationDelay: `${(pulseDepths.get(node.id) ?? 0) * PULSE_STEP_MS}ms`
                                  }}
                                />
                              )}

                              {/* 选中脉冲环：向外扩散的呼吸圈，把视线钉在当前靶点上 */}
                              {isSelected && (
                                <circle
                                  className="kb-ripple"
                                  r={r + 11}
                                  fill="none"
                                  stroke={node.color}
                                  strokeWidth="2"
                                />
                              )}

                              <g className="kb-dot" data-hover={isHovered ? 'true' : 'false'}>
                                {/* 光晕：常驻缓慢呼吸，营造"活菌群"的动感 */}
                                <circle
                                  className="kb-halo"
                                  r={r + 7}
                                  fill={node.color}
                                  style={
                                    {
                                      '--kb-halo-lo': isFocus ? 0.2 : 0.07,
                                      '--kb-halo-hi': isFocus ? 0.46 : 0.2,
                                      animationDelay: `${(i % 7) * 320}ms`
                                    } as React.CSSProperties
                                  }
                                />

                                {/* 选中态静态高亮环 */}
                                {(isSelected || isMatchSearch) && (
                                  <circle
                                    r={r + 12}
                                    fill="none"
                                    stroke={node.color}
                                    strokeWidth="2.2"
                                    opacity="0.9"
                                    style={{ filter: `drop-shadow(0 0 8px ${node.color})` }}
                                  />
                                )}

                                {/* 落地投影：往右下偏一点，让球体有"坐"在画布上的感觉。
                                    深色底上阴影几乎看不见，但它在边缘处压暗背景，
                                    正是这点压暗让球体从平面里浮起来。 */}
                                <ellipse
                                  cx={r * 0.14}
                                  cy={r * 0.22}
                                  rx={r * 0.96}
                                  ry={r * 0.92}
                                  fill="#02040a"
                                  opacity="0.55"
                                />

                                {/* 球体主体：径向渐变，光源固定在左上，与 defs 里的渐变同向 */}
                                <circle
                                  r={r}
                                  fill={`url(#sphere-${node.category})`}
                                  stroke={node.strokeColor}
                                  strokeWidth={isFocus ? 2.6 : 1.4}
                                />

                                {/* 球面高光点：偏左上的柔光斑，越靠前越亮 */}
                                <circle
                                  cx={-r * 0.32}
                                  cy={-r * 0.36}
                                  r={r * 0.42}
                                  fill="url(#kb-specular)"
                                  opacity={0.45 + near * 0.4}
                                />

                                {/* 内芯：保留一颗亮芯，让低丰度菌种在小半径下仍有识别度 */}
                                <circle
                                  r={Math.max(2.6, r * 0.24)}
                                  fill="#ffffff"
                                  opacity={isFocus ? 0.9 : 0.45}
                                />
                              </g>

                              {/* 主标签：挂在球体正下方。这里用 r 而不是布局期的 labelDy，
                                  因为球体半径还被深度缩放了一次，用固定偏移会让标签贴到球面上 */}
                              {showPrimaryLabel && (
                                <text
                                  x={node.labelDx}
                                  y={r + 15}
                                  fill="#eef4ff"
                                  fontSize={isSelected ? String(Number(labelSize) + 1) : labelSize}
                                  fontWeight={isSelected ? 'bold' : '500'}
                                  textAnchor={node.labelAnchor}
                                  className="pointer-events-none select-none font-sans"
                                  style={{
                                    paintOrder: 'stroke fill',
                                    stroke: '#081024',
                                    strokeWidth: '4px',
                                    strokeLinejoin: 'round'
                                  }}
                                >
                                  {node.name}
                                </text>
                              )}

                              {/* 副标签：全称 / 拉丁学名，排在主标签下一行 */}
                              {node.subName && showSubLabel && (
                                <text
                                  x={node.labelDx}
                                  y={r + 28}
                                  fill={isSelected ? '#20cfff' : '#8fa0c7'}
                                  fontSize="9.5"
                                  fontWeight={isSelected ? 'bold' : 'normal'}
                                  textAnchor={node.labelAnchor}
                                  className="pointer-events-none select-none font-mono"
                                  style={{
                                    paintOrder: 'stroke fill',
                                    stroke: '#081024',
                                    strokeWidth: '3px',
                                    strokeLinejoin: 'round'
                                  }}
                                >
                                  {node.subName.length > 16 ? node.subName.slice(0, 15) + '…' : node.subName}
                                </text>
                              )}
                            </g>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </g>
              </g>
            </svg>
          </div>

          {/* Bottom Floating Hint (Collapsible & Non-blocking) */}
          {showHint && (
            <div className="absolute bottom-3 left-3 pointer-events-auto text-[11px] text-[#8996b8] flex items-center gap-1.5 bg-[#091127]/90 px-2.5 py-1.5 rounded-lg border border-[#2b4170]/60 backdrop-blur-md shadow-lg z-10 max-w-[calc(100%-24px)]">
              <Info className="w-3.5 h-3.5 text-[#20cfff] shrink-0" />
              <span>点击任一节点：脉冲会沿相互作用一层层向外传播，同时展开生物学机制；拖拽可改拓扑，滚轮缩放</span>
              <button
                onClick={() => setShowHint(false)}
                className="ml-1 text-[#8996b8] hover:text-[#eef4ff] p-0.5 rounded shrink-0"
                title="隐藏提示"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Collapsed Inspector Mini-Pill (When drawer is collapsed, provides 1-click restore without obscuring the canvas!) */}
          {selectedNode && isDrawerCollapsed && (
            <button
              onClick={() => setIsDrawerCollapsed(false)}
              id="expand-inspector-pill"
              className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#091127]/95 border border-[#20cfff]/50 shadow-[0_0_15px_rgba(32,207,255,0.25)] text-xs text-[#eef4ff] hover:bg-[#152347] transition-all backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: selectedNode.color }} />
              <span>
                当前靶点: <strong>{selectedNode.name}</strong>
              </span>
              <span className="text-[10px] text-[#20cfff] flex items-center gap-0.5 font-medium">
                查看详情 <ChevronLeft className="w-3.5 h-3.5" />
              </span>
            </button>
          )}
        </div>

        {/* 4. Smart Non-Occluding Detail Inspection Drawer / Card */}
        {selectedNode && !isDrawerCollapsed && (
          <div
            id="node-inspector-drawer"
            className="w-80 md:w-84 shrink-0 border-l border-[#1e2f57] bg-[#091127]/95 backdrop-blur-md p-4 flex flex-col justify-between overflow-y-auto text-xs shadow-2xl z-20 transition-all duration-200"
          >
            <div>
              {/* Header with Close and Collapse actions */}
              <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#1e2f57]">
                <div>
                  <span
                    className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded font-bold"
                    style={{ backgroundColor: `${selectedNode.color}25`, color: selectedNode.color }}
                  >
                    {selectedNode.subName || selectedNode.category}
                  </span>
                  <h4 className="text-base font-bold text-[#eef4ff] mt-1.5 flex items-center gap-1.5">
                    {selectedNode.name}
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsDrawerCollapsed(true)}
                    className="text-[#8996b8] hover:text-[#20cfff] p-1 rounded hover:bg-[#152347]"
                    title="收起侧栏以完整展现拓扑网络"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-[#8996b8] hover:text-[#ff536c] p-1 rounded hover:bg-[#152347]"
                    title="取消选中"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Content based on node type */}
              {selectedNode.type === 'microbe' && selectedNode.raw?.abundance !== undefined ? (
                <div className="space-y-3">
                  {/* Abundance Card */}
                  <div className="p-2.5 rounded-lg bg-[#101a33] border border-[#2b4170]/60">
                    <div className="flex justify-between items-center text-[#8996b8] mb-1">
                      <span>患者当前丰度:</span>
                      <span className="font-mono font-bold text-sm text-[#eef4ff]">{selectedNode.raw.abundance}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[#8996b8]">
                      <span>健康人群参考区间:</span>
                      <span className="font-mono text-[#23e6b1]">
                        {selectedNode.raw.normalRange[0]}% - {selectedNode.raw.normalRange[1]}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#8996b8] mt-1 pt-1 border-t border-[#1e2f57]">
                      <span>相对失衡偏差:</span>
                      <span
                        className={`font-mono font-bold flex items-center gap-0.5 ${
                          selectedNode.raw.relativeChange < 0 ? 'text-[#ff536c]' : 'text-[#ffb84d]'
                        }`}
                      >
                        {selectedNode.raw.relativeChange < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {selectedNode.raw.relativeChange > 0
                          ? `+${selectedNode.raw.relativeChange}%`
                          : `${selectedNode.raw.relativeChange}%`}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Relevance */}
                  <div>
                    <h5 className="font-semibold text-[#20cfff] mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 临床病理与稳态机制
                    </h5>
                    <p className="text-[#eef4ff] leading-relaxed text-[11px] bg-[#101a33]/60 p-2 rounded border border-[#2b4170]/40">
                      {selectedNode.raw.clinicalRelevance}
                    </p>
                  </div>

                  {/* Primary Metabolites */}
                  {selectedNode.raw.primaryMetabolites && (
                    <div>
                      <h5 className="font-semibold text-[#8996b8] mb-1">主要产生代谢物:</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.raw.primaryMetabolites.map((m: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-[#20cfff]/15 text-[#20cfff] text-[10px] font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FMT Therapeutic Role */}
                  <div className="p-2.5 rounded-lg bg-[#0c1f3d] border border-[#20cfff]/40 text-[11px]">
                    <span className="font-semibold text-[#20cfff] block mb-1">FMT 定植与治疗目标:</span>
                    <p className="text-[#eef4ff]">{selectedNode.raw.therapeuticTarget}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#8996b8]">
                      <span>供体来源: {selectedNode.raw.isDonorDerived ? '✓ 供体重点回输菌' : '患者固有宿主菌'}</span>
                      <span className="text-[#23e6b1] font-medium">状态: {selectedNode.raw.engraftmentStatus}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Multi-domain Knowledge Node Detail */
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-[#101a33] border border-[#2b4170]/60">
                    <span className="text-[#8996b8] text-[10px] block mb-1">实体分类:</span>
                    <span className="font-semibold text-[#eef4ff] text-sm">
                      {selectedNode.raw?.categoryLabel || selectedNode.subName || selectedNode.type}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[#20cfff] mb-1">生物医学机制描述:</h5>
                    <p className="text-[#eef4ff] leading-relaxed text-[11px] bg-[#101a33]/60 p-2 rounded border border-[#2b4170]/40">
                      {selectedNode.raw?.description || '微生态多组学知识图谱实体。'}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-[#8996b8] mb-1">关联知识拓扑 (邻接网络):</h5>
                    <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                      {links
                        .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                        .map((l, i) => {
                          const otherId = l.source === selectedNode.id ? l.target : l.source;
                          const otherNode = nodes.find(n => n.id === otherId);
                          const isAntag = l.type === 'antagonism' || l.type === 'negative';
                          return (
                            <div
                              key={i}
                              className="p-1.5 rounded bg-[#101a33] border border-[#1e2f57] flex items-center justify-between text-[11px] gap-2"
                            >
                              <span className="text-[#eef4ff] font-medium truncate">{otherNode?.name || otherId}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                  isAntag
                                    ? 'text-[#ff536c] bg-[#ff536c]/15 border border-[#ff536c]/30'
                                    : 'text-[#20cfff] bg-[#20cfff]/15 border border-[#20cfff]/30'
                                }`}
                              >
                                {l.relation.length > 12 ? l.relation.slice(0, 12) + '..' : l.relation}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-[#1e2f57] flex gap-2">
              <button
                onClick={() => setSearchQuery(selectedNode.name)}
                className="flex-1 py-1.5 rounded-lg bg-[#20cfff]/20 text-[#20cfff] hover:bg-[#20cfff]/30 border border-[#20cfff]/50 text-center font-medium transition-all text-xs"
              >
                高亮全连接
              </button>
              <button
                onClick={() => setIsDrawerCollapsed(true)}
                className="px-3 py-1.5 rounded-lg bg-[#152347] text-[#8996b8] hover:text-[#eef4ff] text-xs transition-all"
                title="折叠以最大化拓扑视图"
              >
                收起
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
