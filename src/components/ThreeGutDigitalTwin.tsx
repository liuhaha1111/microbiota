import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Activity, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Sparkles,
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface ThreeGutDigitalTwinProps {
  stateMode?: 'dysbiosis' | 'reconstruction';
  onSegmentSelect?: (segmentName: string) => void;
  className?: string;
}

export const ThreeGutDigitalTwin: React.FC<ThreeGutDigitalTwinProps> = ({
  stateMode: initialMode = 'dysbiosis',
  onSegmentSelect,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<'dysbiosis' | 'reconstruction'>(initialMode);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeSegment, setActiveSegment] = useState<string>('全肠道全景');
  const [particleDensity, setParticleDensity] = useState<'high' | 'normal'>('high');
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const tubeMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);

  // Mouse drag rotation state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const modelGroupRef = useRef<THREE.Group | null>(null);

  // Segments definition
  const segments = [
    { id: 'all', name: '全肠道全景', t: 0.5, desc: '双侧结肠宏观微生态全景' },
    { id: 'cecum', name: '回盲部 / 盲肠', t: 0.08, desc: '菌群储藏库与耐药菌定植交界' },
    { id: 'ascending', name: '升结肠', t: 0.25, desc: '水分重吸收与短链脂肪酸高产区' },
    { id: 'transverse', name: '横结肠', t: 0.5, desc: '代谢中间体发酵转化核心段' },
    { id: 'descending', name: '降结肠', t: 0.75, desc: 'UC主要受累溃疡浸润高发区' },
    { id: 'sigmoid', name: '乙状结肠 & 直肠', t: 0.92, desc: '局部黏膜炎性充血与脓血便来源' },
  ];

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 42);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x101b38, 2.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x20cfff, 4.5, 100);
    pointLight1.position.set(20, 25, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x815cff, 3.5, 100);
    pointLight2.position.set(-20, -15, 20);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x23e6b1, 2.8, 80);
    pointLight3.position.set(0, 0, -25);
    scene.add(pointLight3);

    // 5. Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 6. Construct Realistic 3D Human Large Intestine Curve (Colon)
    // Points define Cecum -> Ascending -> Hepatic Flexure -> Transverse -> Splenic Flexure -> Descending -> Sigmoid -> Rectum
    const colonPoints: THREE.Vector3[] = [
      new THREE.Vector3(8.5, -9.0, 1.0),   // Cecum / Appendix area
      new THREE.Vector3(9.2, -4.5, 0.5),   // Ascending lower
      new THREE.Vector3(9.0, 2.0, 0.2),    // Ascending mid
      new THREE.Vector3(7.8, 8.5, -1.0),   // Hepatic flexure (right turn)
      new THREE.Vector3(4.0, 7.8, 2.0),    // Transverse right
      new THREE.Vector3(0.0, 6.5, 3.2),    // Transverse mid (slightly dips forward)
      new THREE.Vector3(-4.5, 7.5, 2.0),   // Transverse left
      new THREE.Vector3(-8.2, 9.2, -1.2),  // Splenic flexure (left high turn)
      new THREE.Vector3(-9.2, 3.0, 0.2),   // Descending upper
      new THREE.Vector3(-9.0, -3.5, 0.5),  // Descending lower
      new THREE.Vector3(-7.5, -7.5, 1.2),  // Transition to sigmoid
      new THREE.Vector3(-4.0, -9.8, 2.5),  // Sigmoid loop 1
      new THREE.Vector3(-1.0, -11.0, 1.5), // Sigmoid loop 2
      new THREE.Vector3(0.0, -13.0, 0.0),  // Rectum terminal
    ];

    const colonCurve = new THREE.CatmullRomCurve3(colonPoints, false, 'centripetal', 0.5);
    curveRef.current = colonCurve;

    // Outer Translucent Lumen Tube
    const tubeGeometry = new THREE.TubeGeometry(colonCurve, 160, 2.4, 28, false);
    const isDysbiosis = currentMode === 'dysbiosis';

    const tubeMaterial = new THREE.MeshPhysicalMaterial({
      color: isDysbiosis ? 0x22132e : 0x0c253d,
      emissive: isDysbiosis ? 0x3d0d21 : 0x07394c,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.38,
      roughness: 0.25,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMeshRef.current = tubeMesh;
    modelGroup.add(tubeMesh);

    // Anatomical Haustra (Colon ring ribs wireframe)
    const wireframeGeometry = new THREE.TubeGeometry(colonCurve, 80, 2.44, 16, false);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: isDysbiosis ? 0xff536c : 0x20cfff,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframeMeshRef.current = wireframeMesh;
    modelGroup.add(wireframeMesh);

    // 7. Dynamic Microbial Particle Flow along Colon Lumen
    const particleCount = 1800;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Custom attributes for animation
    const progressArray = new Float32Array(particleCount);
    const speedArray = new Float32Array(particleCount);
    const offsetRadiusArray = new Float32Array(particleCount);
    const offsetAngleArray = new Float32Array(particleCount);
    const particleTypeArray = new Float32Array(particleCount); // 0: beneficial, 1: commensal, 2: pathogen

    for (let i = 0; i < particleCount; i++) {
      const progress = Math.random();
      progressArray[i] = progress;
      
      // Speed varies slightly
      speedArray[i] = 0.0006 + Math.random() * 0.0014;
      offsetRadiusArray[i] = Math.random() * 1.8;
      offsetAngleArray[i] = Math.random() * Math.PI * 2;

      // Type probability depends on mode
      let pType = 0;
      if (isDysbiosis) {
        // High pathogens/dysbiosis (60% pathogen/opportunistic, 20% commensal, 20% beneficial)
        const rand = Math.random();
        if (rand < 0.55) pType = 2; // Pathogen (Red/Orange)
        else if (rand < 0.78) pType = 1; // Commensal (Purple)
        else pType = 0; // Beneficial (Cyan/Green)
      } else {
        // Post-FMT: 75% beneficial, 20% commensal, 5% low pathogen
        const rand = Math.random();
        if (rand < 0.72) pType = 0; // Beneficial (Cyan/Green)
        else if (rand < 0.92) pType = 1; // Commensal (Purple)
        else pType = 2; // Low residual pathogen
      }
      particleTypeArray[i] = pType;

      // Color mapping
      let col = new THREE.Color();
      if (pType === 0) {
        // Beneficial: Emerald to Bright Cyan
        col.set(Math.random() > 0.5 ? 0x20cfff : 0x23e6b1);
      } else if (pType === 1) {
        // Commensal: Violet/Lavender
        col.set(0x815cff);
      } else {
        // Pathogen/Inflammation: Coral Red to Amber Orange
        col.set(Math.random() > 0.4 ? 0xff536c : 0xffb84d);
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      sizes[i] = pType === 0 ? 1.6 : pType === 2 ? 2.1 : 1.3;

      // Initial Position from curve
      const pt = colonCurve.getPointAt(progress);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Particle Material
    const particleMaterial = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    modelGroup.add(particles);

    // Center the colon in view
    modelGroup.position.set(0, 1.2, 0);

    // 8. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Auto rotation
      if (autoRotate && !isDraggingRef.current && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += delta * 0.28;
      }

      // Update particles along colon tube
      if (colonCurve && particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const posArray = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          progressArray[i] += speedArray[i] * (currentMode === 'dysbiosis' ? 1.2 : 0.9);
          if (progressArray[i] > 1) {
            progressArray[i] = 0;
          }

          const point = colonCurve.getPointAt(progressArray[i]);
          const tangent = colonCurve.getTangentAt(progressArray[i]);

          // Create perpendicular offset to simulate lumen volume
          const normal = new THREE.Vector3(tangent.y, -tangent.x, tangent.z).normalize();
          const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
          
          const r = offsetRadiusArray[i];
          const theta = offsetAngleArray[i];
          
          posArray[i * 3] = point.x + (normal.x * Math.cos(theta) + binormal.x * Math.sin(theta)) * r;
          posArray[i * 3 + 1] = point.y + (normal.y * Math.cos(theta) + binormal.y * Math.sin(theta)) * r;
          posArray[i * 3 + 2] = point.z + (normal.z * Math.cos(theta) + binormal.z * Math.sin(theta)) * r;
        }

        posAttr.needsUpdate = true;
      }

      // Gentle pulsing of wireframe glow
      if (wireframeMeshRef.current) {
        const time = clock.getElapsedTime();
        const mat = wireframeMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.14 + Math.sin(time * 2.5) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Mouse interaction for 3D rotation & zooming
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modelGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      modelGroupRef.current.rotation.y += deltaX * 0.008;
      modelGroupRef.current.rotation.x += deltaY * 0.008;
      // Clamp vertical tilt
      modelGroupRef.current.rotation.x = Math.max(-0.8, Math.min(0.8, modelGroupRef.current.rotation.x));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const newZ = cameraRef.current.position.z + e.deltaY * 0.05;
      cameraRef.current.position.z = Math.max(22, Math.min(65, newZ));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);

      tubeGeometry.dispose();
      tubeMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [currentMode]);

  // Handle Mode Change (Smooth Theme & Particle Color Transition)
  const handleToggleMode = (mode: 'dysbiosis' | 'reconstruction') => {
    setCurrentMode(mode);
    if (tubeMeshRef.current && wireframeMeshRef.current) {
      const isDys = mode === 'dysbiosis';
      const tubeMat = tubeMeshRef.current.material as THREE.MeshPhysicalMaterial;
      tubeMat.color.set(isDys ? 0x22132e : 0x0c253d);
      tubeMat.emissive.set(isDys ? 0x3d0d21 : 0x07394c);

      const wireMat = wireframeMeshRef.current.material as THREE.MeshBasicMaterial;
      wireMat.color.set(isDys ? 0xff536c : 0x20cfff);
    }
  };

  // Focus on specific segment
  const handleSegmentClick = (seg: typeof segments[0]) => {
    setActiveSegment(seg.name);
    if (onSegmentSelect) onSegmentSelect(seg.name);
    
    // Animate rotation to present segment nicely
    if (modelGroupRef.current && curveRef.current) {
      if (seg.id === 'ascending' || seg.id === 'cecum') {
        modelGroupRef.current.rotation.y = -0.6;
        modelGroupRef.current.rotation.x = 0.1;
      } else if (seg.id === 'descending' || seg.id === 'sigmoid') {
        modelGroupRef.current.rotation.y = 0.6;
        modelGroupRef.current.rotation.x = 0.1;
      } else {
        modelGroupRef.current.rotation.y = 0;
        modelGroupRef.current.rotation.x = 0;
      }
    }
  };

  const resetView = () => {
    if (modelGroupRef.current && cameraRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 5, 42);
      setActiveSegment('全肠道全景');
    }
  };

  return (
    <div id="three-gut-container-card" className={`relative rounded-xl border border-[#1e2f57] bg-[#0c1429] overflow-hidden ${className}`}>
      {/* Top Controls & State Switcher */}
      <div id="three-gut-header-bar" className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* State Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#091127]/85 border border-[#2b4170]/60 backdrop-blur-md pointer-events-auto shadow-lg">
          <button
            id="state-btn-dysbiosis"
            onClick={() => handleToggleMode('dysbiosis')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentMode === 'dysbiosis'
                ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/50 shadow-[0_0_12px_rgba(255,83,108,0.3)]'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            治疗前失衡态 (Pre-FMT)
          </button>
          <button
            id="state-btn-reconstruction"
            onClick={() => handleToggleMode('reconstruction')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentMode === 'reconstruction'
                ? 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/50 shadow-[0_0_12px_rgba(32,207,255,0.3)]'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            FMT重构态 (Post-FMT)
          </button>
        </div>

        {/* View Tools */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#091127]/85 border border-[#2b4170]/60 backdrop-blur-md pointer-events-auto">
          <button
            id="auto-rotate-toggle"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? '暂停旋转' : '自动旋转'}
            className={`p-1.5 rounded text-xs transition-colors ${
              autoRotate ? 'text-[#20cfff] bg-[#20cfff]/15' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            id="reset-view-btn"
            onClick={resetView}
            title="重置3D视角"
            className="p-1.5 rounded text-xs text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Mounting Point */}
      <div 
        ref={containerRef} 
        id="webgl-gut-stage"
        className="w-full h-full min-h-[460px] cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Left: Regional Segment Fast Navigator */}
      <div id="gut-segment-selector" className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-[#091127]/85 border border-[#2b4170]/60 backdrop-blur-md max-w-sm sm:max-w-md">
        <span className="text-[11px] font-medium text-[#8996b8] px-1.5 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#20cfff]" /> 肠段巡检:
        </span>
        {segments.map((seg) => (
          <button
            key={seg.id}
            id={`seg-btn-${seg.id}`}
            onClick={() => handleSegmentClick(seg)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
              activeSegment === seg.name
                ? 'bg-[#20cfff] text-[#090d18] font-semibold shadow-[0_0_10px_rgba(32,207,255,0.4)]'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            {seg.name}
          </button>
        ))}
      </div>

      {/* Bottom Right: Collapsible Live Microbiome Digital Twin HUD Stats */}
      <div id="gut-hud-stats" className="absolute bottom-3 right-3 z-10 rounded-lg bg-[#091127]/95 border border-[#2b4170]/70 backdrop-blur-md text-xs shadow-2xl pointer-events-auto transition-all">
        {isHudCollapsed ? (
          <button
            onClick={() => setIsHudCollapsed(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#20cfff] hover:text-[#eef4ff] font-medium"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>实时参数</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="p-3 min-w-[210px]">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1e2f57]">
              <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#20cfff]" />
                数字孪生实时参数
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  currentMode === 'dysbiosis' ? 'bg-[#ff536c]/20 text-[#ff536c]' : 'bg-[#23e6b1]/20 text-[#23e6b1]'
                }`}>
                  {currentMode === 'dysbiosis' ? '重度失衡态' : '重构稳态'}
                </span>
                <button
                  onClick={() => setIsHudCollapsed(true)}
                  className="text-[#8996b8] hover:text-[#eef4ff] p-0.5 rounded hover:bg-[#152347]"
                  title="收起参数面板"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>多样性指数 (Shannon):</span>
                <span className="font-mono font-bold text-[#eef4ff]">
                  {currentMode === 'dysbiosis' ? '2.15 ↓' : '4.52 ↑'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>失衡度评分 (Dysbiosis):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis' ? '72 / 100' : '18 / 100'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>供体菌定植率 (Engraftment):</span>
                <span className="font-mono font-bold text-[#20cfff]">
                  {currentMode === 'dysbiosis' ? '0.0%' : '81.4%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>黏膜炎症负荷 (FC预测):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis' ? '632 μg/g (高)' : '42 μg/g (正常)'}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-2.5 pt-2 border-t border-[#1e2f57]/80 flex items-center justify-between text-[10px] text-[#8996b8]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#20cfff]"></span> 有益菌
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#815cff]"></span> 中性共生
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff536c]"></span> 致病/炎性
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive prompt */}
      <div className="absolute top-14 left-3 pointer-events-none text-[10px] text-[#8996b8]/70 flex items-center gap-1">
        <Info className="w-3 h-3" /> 按住鼠标左键可 360° 旋转肠道三维视角，滚轮缩放
      </div>
    </div>
  );
};
