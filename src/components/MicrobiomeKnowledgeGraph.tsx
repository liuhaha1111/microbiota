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
  Scan
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
  name: string;
  subName?: string;
  category: string;
  type: string;
  val: number;
  color: string;
  strokeColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 播种锚点：松弛时弱回拉，保证“按类别分扇区”的布局骨架不被拉散 */
  seedX: number;
  seedY: number;
  raw: any;
}

interface SimulatedLink {
  source: string;
  target: string;
  relation: string;
  type: 'synergy' | 'antagonism' | 'positive' | 'negative' | 'neutral' | 'commensal';
  weight: number;
}

/**
 * 图谱分层顺序：把 FMT 干预层置于顶层，向下依次为疾病表型、菌群靶点、代谢通路与免疫受体，
 * 使跨层连边尽可能短、走向一致，避免长线横穿整图。
 */
const LAYER_ORDER = [
  'therapy',
  'disease',
  'microbe',
  'metabolite',
  'immune',
  'beneficial',
  'commensal',
  'opportunistic',
  'pathogen'
];

/**
 * 轻量碰撞清理：以播种位置为强锚点，只负责把极少数重叠节点推开。
 * 不追求整体力导向收敛，保证分层骨架不被拉散；一次算完即冻结，页面无持续漂移。
 */
function relaxLayout(
  input: SimulatedNode[],
  links: SimulatedLink[],
  width: number,
  height: number,
  iterations = 30
): SimulatedNode[] {
  const nodes = input.map(n => ({ ...n }));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const pairs: Array<[SimulatedNode, SimulatedNode]> = [];
  for (const l of links) {
    const a = byId.get(l.source);
    const b = byId.get(l.target);
    if (a && b) pairs.push([a, b]);
  }

  const kSeed = 0.040;   // 强锚点回拉：牢牢锁住分层骨架
  const kSpring = 0.002; // 连边弹簧仅作极弱微调
  const targetDist = 150;

  for (let iter = 0; iter < iterations; iter++) {
    for (const n of nodes) {
      n.vx += (n.seedX - n.x) * kSeed;
      n.vy += (n.seedY - n.y) * kSeed;
    }

    // 碰撞消解（库仑斥力）
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);
        const minDist = (a.val + b.val) * 3.4;
        const force = Math.min(42, (minDist * minDist * 2.4) / distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // 连边弹簧（Hooke）
    for (const [a, b] of pairs) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - targetDist) * kSpring;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    for (const n of nodes) {
      n.vx *= 0.68;
      n.vy *= 0.68;
      n.x = Math.max(66, Math.min(width - 66, n.x + n.vx));
      n.y = Math.max(46, Math.min(height - 46, n.y + n.vy));
    }
  }

  return nodes;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<SimulatedNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Anti-occlusion controls: drawer collapse state & fullscreen mode
  // In compact mode, default drawer to collapsed so it does not occlude graph
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState<boolean>(compact);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const containerWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgContainerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isPanningRef = useRef(false);
  const startPanPosRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimulatedNode | null>(null);
  // 始终指向最新的 autoFitView，供布局收敛后的定时器调用
  const autoFitViewRef = useRef<(() => void) | null>(null);

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

  // Build initial nodes & links scaled to current canvas dimensions
  const { initialNodes, initialLinks } = useMemo(() => {
    const w = dimensions.width;
    const h = dimensions.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // 横向分层播种：每个实体类别占一条横向层带。
    // 相比环形/椭圆布局，分层能充分利用宽屏画布，节点与标签不会互相压盖。
    const seedLayout = (items: Array<{ id: string; category: string }>) => {
      const positions: Record<string, { x: number; y: number }> = {};

      // 分层顺序（未列出的类别按原有顺序追加）
      const cats = Array.from(new Set(items.map(i => i.category))).sort((a, b) => {
        const ia = LAYER_ORDER.indexOf(a);
        const ib = LAYER_ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });

      const padX = 74;
      const padY = 56;
      const usableW = Math.max(160, w - padX * 2);
      const usableH = Math.max(160, h - padY * 2);

      // 单行最多容纳的节点数：保证水平间距不低于 ~96px，避免标签互相压盖
      const perRow = Math.max(3, Math.min(9, Math.floor(usableW / 96)));

      const groups = cats.map(cat => items.filter(i => i.category === cat));
      const rowsPerGroup = groups.map(g => Math.max(1, Math.ceil(g.length / perRow)));
      const totalRows = rowsPerGroup.reduce((a, b) => a + b, 0) || 1;
      const rowPitch = usableH / totalRows;

      let rowCursor = 0;
      groups.forEach((group, gi) => {
        const rows = rowsPerGroup[gi];
        const perRowBalanced = Math.ceil(group.length / rows);
        for (let r = 0; r < rows; r++) {
          const rowNodes = group.slice(r * perRowBalanced, (r + 1) * perRowBalanced);
          const rowCenterY = padY + (rowCursor + r + 0.5) * rowPitch;
          const step = usableW / Math.max(1, rowNodes.length);
          rowNodes.forEach((item, k) => {
            positions[item.id] = {
              x: padX + (k + 0.5) * step,
              y: rowCenterY,
            };
          });
        }
        rowCursor += rows;
      });

      return positions;
    };

    if (graphMode === 'ecological') {
      // 菌群生态网络：患者个性化菌种按功能类别分扇区
      const draft = effectiveTaxa.map(t => {
        let color = '#20cfff'; // beneficial
        let stroke = '#23e6b1';
        if (t.category === 'pathogen') {
          color = '#ff536c';
          stroke = '#ffb84d';
        } else if (t.category === 'opportunistic') {
          color = '#ffb84d';
          stroke = '#ff536c';
        } else if (t.category === 'commensal') {
          color = '#815cff';
          stroke = '#397cff';
        }

        return {
          id: t.id,
          name: t.chineseName.split(' ')[0],
          subName: t.name,
          category: t.category,
          type: 'microbe',
          val: Math.max(14, Math.min(22, 11 + t.abundance * 1.1)),
          color,
          strokeColor: stroke,
          raw: t
        };
      });

      const seed = seedLayout(draft);
      const seeded: SimulatedNode[] = draft.map(n => {
        const sx = seed[n.id]?.x ?? centerX;
        const sy = seed[n.id]?.y ?? centerY;
        return { ...n, x: sx, y: sy, seedX: sx, seedY: sy, vx: 0, vy: 0 };
      });

      const links: SimulatedLink[] = effectiveEcoLinks.map(l => ({
        source: l.source,
        target: l.target,
        relation: l.description,
        type: l.type,
        weight: l.weight
      }));

      return { initialNodes: relaxLayout(seeded, links, w, h), initialLinks: links };
    }

    // Multi-domain Knowledge Graph
    const draft = mockKnowledgeNodes.map(n => {
      let color = '#20cfff';
      let stroke = '#397cff';
      if (n.type === 'disease') {
        color = '#ff536c';
        stroke = '#ffb84d';
      } else if (n.type === 'metabolite') {
        color = '#23e6b1';
        stroke = '#20cfff';
      } else if (n.type === 'immune') {
        color = '#815cff';
        stroke = '#b592ff';
      } else if (n.type === 'therapy') {
        color = '#397cff';
        stroke = '#20cfff';
      }

      return {
        id: n.id,
        name: n.name,
        subName: n.categoryLabel,
        category: n.type,
        type: n.type,
        val: Math.max(14, Math.min(22, Math.round((n.val || 20) * 0.8))),
        color,
        strokeColor: stroke,
        raw: n
      };
    });

    const seed = seedLayout(draft);
    const seeded: SimulatedNode[] = draft.map(n => {
      const sx = seed[n.id]?.x ?? centerX;
      const sy = seed[n.id]?.y ?? centerY;
      return { ...n, x: sx, y: sy, seedX: sx, seedY: sy, vx: 0, vy: 0 };
    });

    const links: SimulatedLink[] = mockKnowledgeLinks.map(l => ({
      source: typeof l.source === 'string' ? l.source : l.source.id,
      target: typeof l.target === 'string' ? l.target : l.target.id,
      relation: l.relation,
      type: l.effect,
      weight: 0.8
    }));

    return { initialNodes: relaxLayout(seeded, links, w, h), initialLinks: links };
  }, [graphMode, dimensions, effectiveTaxa, effectiveEcoLinks]);

  // Nodes state with dynamic force simulation
  const [nodes, setNodes] = useState<SimulatedNode[]>(initialNodes);
  const [links, setLinks] = useState<SimulatedLink[]>(initialLinks);

  // Sync when mode or patient changes
  useEffect(() => {
    setNodes(initialNodes);
    setLinks(initialLinks);
    if (initialNodes.length > 0) {
      const preferredId = initialSelectedId || (graphMode === 'multidomain' && patient?.targetDiseaseNodeId ? patient.targetDiseaseNodeId : undefined);
      const match = preferredId ? initialNodes.find(n => n.id === preferredId) : initialNodes[0];
      setSelectedNode(match || initialNodes[0]);
    }
  }, [initialNodes, initialLinks, initialSelectedId, patient?.id, graphMode]);

  // 布局已在 useMemo 中同步求解完毕，这里只需在数据/尺寸切换后自动适配视野
  useEffect(() => {
    const timer = window.setTimeout(() => {
      autoFitViewRef.current?.();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [graphMode, patient?.id, dimensions.width, dimensions.height]);

  // Filtering
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchSearch = searchQuery.trim() === '' || 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (n.subName && n.subName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchFilter = selectedFilter === 'all' || 
        n.category === selectedFilter || 
        n.type === selectedFilter;

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

  // Links to render
  const visibleLinks = useMemo(() => {
    return links.filter(l => filteredNodeIds.has(l.source) && filteredNodeIds.has(l.target));
  }, [links, filteredNodeIds]);

  // Auto-fit function: calculates bounding box and fits whole graph inside current viewport
  const autoFitView = useCallback(() => {
    if (nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x - n.val - 40);
      maxX = Math.max(maxX, n.x + n.val + 40);
      minY = Math.min(minY, n.y - n.val - 30);
      maxY = Math.max(maxY, n.y + n.val + 34);
    }

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const padding = 66;
    const scaleX = (dimensions.width - padding) / graphWidth;
    const scaleY = (dimensions.height - padding) / graphHeight;
    const optimalScale = Math.min(1.15, Math.max(0.7, Math.min(scaleX, scaleY)));

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;
    const targetPanX = dimensions.width / 2 - graphCenterX * optimalScale;
    const targetPanY = dimensions.height / 2 - graphCenterY * optimalScale;

    setZoomLevel(optimalScale);
    setPanOffset({ x: targetPanX, y: targetPanY });
  }, [nodes, dimensions]);

  autoFitViewRef.current = autoFitView;

  // Dragging interaction
  const handleNodeMouseDown = (e: React.MouseEvent, node: SimulatedNode) => {
    e.stopPropagation();
    draggedNodeRef.current = node;
    setSelectedNode(node);
    if (isDrawerCollapsed) {
      setIsDrawerCollapsed(false);
    }
    if (onSelectNode) onSelectNode(node.raw);
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      isPanningRef.current = true;
      startPanPosRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeRef.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleRatioX = dimensions.width / (rect.width || 1);
      const scaleRatioY = dimensions.height / (rect.height || 1);
      const rawX = ((e.clientX - rect.left) * scaleRatioX - panOffset.x) / zoomLevel;
      const rawY = ((e.clientY - rect.top) * scaleRatioY - panOffset.y) / zoomLevel;
      draggedNodeRef.current.x = rawX;
      draggedNodeRef.current.y = rawY;
      setNodes([...nodes]);
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
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

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
              {graphMode === 'ecological' ? '微生态菌群相互作用网络' : '全景微生态-代谢-免疫知识图谱'}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#20cfff]/20 text-[#20cfff] font-mono">
                {graphMode === 'ecological' ? 'Ecological Network' : 'Knowledge Graph'}
              </span>
              {isFullscreen && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#23e6b1]/20 text-[#23e6b1] font-medium">
                  全屏工作台
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#8996b8]">
              {graphMode === 'ecological' 
                ? '表达宿主优势菌群丰度、互养共生协同(青蓝线)与生态拮抗竞争(红虚线)'
                : '纵贯疾病表型、关键菌种靶点、短链脂肪酸代谢、免疫受体与 FMT 治疗干预拓扑'}
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

          {/* Zoom & Auto-Fit Toolbar */}
          <div className="flex items-center gap-0.5 bg-[#101a33] border border-[#2b4170]/60 p-0.5 rounded-lg text-[#8996b8]">
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
              placeholder={graphMode === 'ecological' ? '搜索菌种 (如: Akkermansia, 普氏栖粪杆菌...)' : '搜索知识靶点 (如: 丁酸, UC, LPS, FMT...)'}
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

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {graphMode === 'ecological' ? (
            <>
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  selectedFilter === 'all' ? 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                全部菌种
              </button>
              <button
                onClick={() => setSelectedFilter('beneficial')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === 'beneficial' ? 'bg-[#23e6b1]/20 text-[#23e6b1] border border-[#23e6b1]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#23e6b1]"></span>
                有益菌
              </button>
              <button
                onClick={() => setSelectedFilter('commensal')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === 'commensal' ? 'bg-[#815cff]/20 text-[#815cff] border border-[#815cff]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#815cff]"></span>
                共生菌
              </button>
              <button
                onClick={() => setSelectedFilter('opportunistic')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === 'opportunistic' ? 'bg-[#ffb84d]/20 text-[#ffb84d] border border-[#ffb84d]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb84d]"></span>
                条件致病菌
              </button>
              <button
                onClick={() => setSelectedFilter('pathogen')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedFilter === 'pathogen' ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff536c]"></span>
                致病菌
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  selectedFilter === 'all' ? 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40' : 'text-[#8996b8] hover:text-[#eef4ff]'
                }`}
              >
                全节点 {nodes.length}
              </button>
              <button
                onClick={() => setSelectedFilter('disease')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium text-[#ff536c] hover:bg-[#ff536c]/10 flex items-center gap-1 ${
                  selectedFilter === 'disease' ? 'bg-[#ff536c]/20 border border-[#ff536c]/40' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff536c]"></span>
                疾病表型 {categoryCounts['disease'] || 0}
              </button>
              <button
                onClick={() => setSelectedFilter('microbe')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium text-[#20cfff] hover:bg-[#20cfff]/10 flex items-center gap-1 ${
                  selectedFilter === 'microbe' ? 'bg-[#20cfff]/20 border border-[#20cfff]/40' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#20cfff]"></span>
                菌群靶点 {categoryCounts['microbe'] || 0}
              </button>
              <button
                onClick={() => setSelectedFilter('metabolite')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium text-[#23e6b1] hover:bg-[#23e6b1]/10 flex items-center gap-1 ${
                  selectedFilter === 'metabolite' ? 'bg-[#23e6b1]/20 border border-[#23e6b1]/40' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#23e6b1]"></span>
                代谢通路 {categoryCounts['metabolite'] || 0}
              </button>
              <button
                onClick={() => setSelectedFilter('immune')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium text-[#815cff] hover:bg-[#815cff]/10 flex items-center gap-1 ${
                  selectedFilter === 'immune' ? 'bg-[#815cff]/20 border border-[#815cff]/40' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#815cff]"></span>
                免疫受体 {categoryCounts['immune'] || 0}
              </button>
              <button
                onClick={() => setSelectedFilter('therapy')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium text-[#397cff] hover:bg-[#397cff]/10 flex items-center gap-1 ${
                  selectedFilter === 'therapy' ? 'bg-[#397cff]/20 border border-[#397cff]/40' : ''
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#397cff]"></span>
                FMT方案 {categoryCounts['therapy'] || 0}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Main Graph Canvas & Intelligent Non-Occluding Detail Panel Layout */}
      <div 
        ref={containerWrapperRef}
        className="relative flex-1 w-full min-h-0 overflow-hidden flex"
        style={{ minHeight: compact ? '400px' : '500px' }}
      >
        {/* SVG Graph Viewport */}
        <div 
          ref={svgContainerRef}
          className="flex-1 relative w-full h-full min-h-0 overflow-hidden"
        >
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
              onWheel={(e) => {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
                setZoomLevel(z => Math.min(2.5, Math.max(0.4, z * zoomFactor)));
              }}
            >
            <defs>
              {/* Directed Markers */}
              <marker
                id="arrow-positive"
                viewBox="0 0 10 10"
                refX="24"
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
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff536c" />
              </marker>
            </defs>

            {/* Background click catcher */}
            <rect width="100%" height="100%" fill="transparent" />

            {/* Transform Group with Pan & Zoom */}
            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
              {/* Subtle background tech grid */}
              <g opacity="0.06" stroke="#397cff" strokeWidth="0.5">
                {Array.from({ length: 32 }).map((_, i) => (
                  <line key={`grid-v-${i}`} x1={i * 60 - 400} y1="-400" x2={i * 60 - 400} y2="1400" />
                ))}
                {Array.from({ length: 28 }).map((_, i) => (
                  <line key={`grid-h-${i}`} x1="-400" y1={i * 60 - 400} x2="1800" y2={i * 60 - 400} />
                ))}
              </g>

              {/* 1. Links Layer: Drawn before nodes so lines pass under nodes */}
              <g className="links-group">
                {visibleLinks.map((link, idx) => {
                  const sNode = nodes.find(n => n.id === link.source);
                  const tNode = nodes.find(n => n.id === link.target);
                  if (!sNode || !tNode) return null;

                  const isAntagonism = link.type === 'antagonism' || link.type === 'negative';
                  const isSelected = selectedNode && (selectedNode.id === sNode.id || selectedNode.id === tNode.id);

                  return (
                    <g key={`link-${idx}`} className="link-item">
                      <line
                        x1={sNode.x}
                        y1={sNode.y}
                        x2={tNode.x}
                        y2={tNode.y}
                        stroke={isAntagonism ? '#ff536c' : '#20cfff'}
                        strokeWidth={isSelected ? 2.8 : isAntagonism ? 1.6 : 1.3}
                        strokeDasharray={isAntagonism ? '5,4' : 'none'}
                        opacity={isSelected ? 0.95 : isAntagonism ? 0.65 : 0.45}
                        markerEnd={graphMode === 'multidomain' ? (isAntagonism ? 'url(#arrow-negative)' : 'url(#arrow-positive)') : undefined}
                      />
                    </g>
                  );
                })}
              </g>

              {/* 2. Link Labels Layer with crisp background rect (eliminates text clash!) */}
              <g className="link-labels-group">
                {visibleLinks.map((link, idx) => {
                  const sNode = nodes.find(n => n.id === link.source);
                  const tNode = nodes.find(n => n.id === link.target);
                  if (!sNode || !tNode) return null;

                  const isSelected = selectedNode && (selectedNode.id === sNode.id || selectedNode.id === tNode.id);
                  if (!isSelected) return null;

                  const isAntagonism = link.type === 'antagonism' || link.type === 'negative';
                  const midX = (sNode.x + tNode.x) / 2;
                  const midY = (sNode.y + tNode.y) / 2;
                  const labelText = link.relation.length > 18 ? link.relation.slice(0, 18) + '...' : link.relation;
                  const badgeWidth = Math.min(140, labelText.length * 9.5 + 14);

                  return (
                    <g key={`link-label-${idx}`} transform={`translate(${midX}, ${midY})`}>
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

              {/* 3. 节点层：单次绘制。选中节点不再额外叠一层，避免出现“双层光圈” */}
              <g className="nodes-group">
                {filteredNodes.map(node => {
                  const isSelected = selectedNode?.id === node.id;
                  const isConnected = connectedNodeIds.has(node.id);
                  const isHovered = hoveredNodeId === node.id;
                  const isMatchSearch = searchQuery.trim() !== '' && 
                    (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                     (node.subName && node.subName.toLowerCase().includes(searchQuery.toLowerCase())));

                  // Dim non-connected nodes when a node is selected
                  const nodeOpacity = (selectedNode && !isConnected && !isMatchSearch) ? 0.3 : 1.0;
                  // 标签降噪：仅选中/悬停/邻接/命中搜索时展示副标签，避免全图文字互相压盖
                  const showSubLabel = isSelected || isHovered || isConnected || isMatchSearch;
                  const isHighlighted = isSelected || isMatchSearch;

                  return (
                    <g
                      key={`node-${node.id}`}
                      id={`graph-node-${node.id}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer transition-opacity duration-150"
                      opacity={nodeOpacity}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* 选中/命中搜索：单层静态高亮环（不自转、不重复叠加） */}
                      {isHighlighted && (
                        <circle
                          r={node.val + 12}
                          fill="none"
                          stroke={node.color}
                          strokeWidth="2.5"
                          opacity="0.92"
                          style={{
                            filter: `drop-shadow(0 0 8px ${node.color})`
                          }}
                        />
                      )}

                      {/* Halo background */}
                      <circle
                        r={node.val + 6}
                        fill={node.color}
                        opacity={isSelected ? 0.42 : isHovered ? 0.26 : 0.12}
                      />

                      {/* Main Node Body */}
                      <circle
                        r={node.val}
                        fill="#0c1836"
                        stroke={node.color}
                        strokeWidth={isSelected ? 3.4 : isHovered ? 2.6 : 1.8}
                      />

                      {/* Inner Core */}
                      <circle
                        r={Math.max(4, node.val * 0.42)}
                        fill={node.color}
                        opacity={isSelected ? 1.0 : 0.78}
                      />

                      {/* Node Primary Label with Anti-Occlusion Text Halo */}
                      <text
                        y={node.val + 15}
                        fill="#eef4ff"
                        fontSize={isSelected ? '11.5' : '10.5'}
                        fontWeight={isSelected ? 'bold' : '500'}
                        textAnchor="middle"
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

                      {/* Node Secondary Latin / Subtype Tag with Text Halo */}
                      {node.subName && showSubLabel && (
                        <text
                          y={node.val + 27}
                          fill={isSelected ? '#20cfff' : '#8fa0c7'}
                          fontSize="9.5"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                          className="pointer-events-none select-none font-mono"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: '#081024',
                            strokeWidth: '3px',
                            strokeLinejoin: 'round'
                          }}
                        >
                          {node.subName.length > 20 ? node.subName.slice(0, 18) + '..' : node.subName}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

          {/* Bottom Floating Hint (Collapsible & Non-blocking) */}
          {showHint && (
            <div className="absolute bottom-3 left-3 pointer-events-auto text-[11px] text-[#8996b8] flex items-center gap-1.5 bg-[#091127]/90 px-2.5 py-1.5 rounded-lg border border-[#2b4170]/60 backdrop-blur-md shadow-lg z-10">
              <Info className="w-3.5 h-3.5 text-[#20cfff] shrink-0" /> 
              <span>点击节点查看生物学机制并高亮邻接网络，拖拽节点可改变拓扑，滚轮缩放</span>
              <button 
                onClick={() => setShowHint(false)} 
                className="ml-1 text-[#8996b8] hover:text-[#eef4ff] p-0.5 rounded"
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
              <span>当前靶点: <strong>{selectedNode.name}</strong></span>
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
                      <span className="font-mono font-bold text-sm text-[#eef4ff]">
                        {selectedNode.raw.abundance}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#8996b8]">
                      <span>健康人群参考区间:</span>
                      <span className="font-mono text-[#23e6b1]">
                        {selectedNode.raw.normalRange[0]}% - {selectedNode.raw.normalRange[1]}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#8996b8] mt-1 pt-1 border-t border-[#1e2f57]">
                      <span>相对失衡偏差:</span>
                      <span className={`font-mono font-bold flex items-center gap-0.5 ${
                        selectedNode.raw.relativeChange < 0 ? 'text-[#ff536c]' : 'text-[#ffb84d]'
                      }`}>
                        {selectedNode.raw.relativeChange < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {selectedNode.raw.relativeChange > 0 ? `+${selectedNode.raw.relativeChange}%` : `${selectedNode.raw.relativeChange}%`}
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
                    <span className="font-semibold text-[#eef4ff] text-sm">{selectedNode.subName || selectedNode.type}</span>
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
                      {visibleLinks
                        .filter(l => l.source === selectedNode.id || l.target === selectedNode.id)
                        .map((l, i) => {
                          const otherId = l.source === selectedNode.id ? l.target : l.source;
                          const otherNode = nodes.find(n => n.id === otherId);
                          const isAntag = l.type === 'antagonism' || l.type === 'negative';
                          return (
                            <div key={i} className="p-1.5 rounded bg-[#101a33] border border-[#1e2f57] flex items-center justify-between text-[11px]">
                              <span className="text-[#eef4ff] font-medium">{otherNode?.name || otherId}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isAntag ? 'text-[#ff536c] bg-[#ff536c]/15 border border-[#ff536c]/30' : 'text-[#20cfff] bg-[#20cfff]/15 border border-[#20cfff]/30'
                              }`}>
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
                onClick={() => {
                  setSearchQuery(selectedNode.name);
                }}
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
