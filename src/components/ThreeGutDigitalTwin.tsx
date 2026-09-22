import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Activity, 
  RotateCcw, 
  Play, 
  Pause, 
  AlertTriangle, 
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Target,
  Eye,
  Crosshair
} from 'lucide-react';

import { ClinicalPatient } from '../types';

export interface ColonSegmentConfig {
  id: string;
  name: string;
  latinName: string;
  baseColor: number;
  hexColor: string;
  glowColor: number;
  glowHex: string;
  radius: number;
  pouchCount: number;
  pouchAmplitude: number;
  points: THREE.Vector3[];
  pinPosition: { x: number; y: number; z: number };
  anatomyDesc: string;
  microbiomeDesc: string;
}

// 8 Anatomical Colon Segments strictly matching the reference diagram ("大肠解剖结构")
export const COLON_SEGMENTS: ColonSegmentConfig[] = [
  {
    id: 'transverse',
    name: '横结肠',
    latinName: 'Colon transversum',
    baseColor: 0x84cc16, // Fresh yellow-green
    hexColor: '#84cc16',
    glowColor: 0xa3e635,
    glowHex: '#a3e635',
    radius: 2.05,
    pouchCount: 8,
    pouchAmplitude: 0.18,
    points: [
      new THREE.Vector3(-6.2, 4.8, 0.0),  // Hepatic flexure
      new THREE.Vector3(-3.2, 4.5, 1.1),
      new THREE.Vector3(0.0, 3.8, 1.4),   // Anterior gentle downward curve
      new THREE.Vector3(3.2, 4.6, 1.1),
      new THREE.Vector3(6.2, 5.2, 0.0),   // Splenic flexure
    ],
    pinPosition: { x: 0.0, y: 4.6, z: 1.4 },
    anatomyDesc: '横跨上腹部凹形弯曲段，连接右结肠曲（肝曲）与左结肠曲（脾曲），具有宽大结肠袋与活跃运动度。',
    microbiomeDesc: '微生态深度多糖水解代谢中枢，富集拟杆菌属与普氏菌属，高效分解复合碳水化合物产丁酸。',
  },
  {
    id: 'ascending',
    name: '升结肠',
    latinName: 'Colon ascendens',
    baseColor: 0x3a86ff, // Sapphire blue
    hexColor: '#3a86ff',
    glowColor: 0x60a5fa,
    glowHex: '#60a5fa',
    radius: 2.1,
    pouchCount: 6,
    pouchAmplitude: 0.20,
    points: [
      new THREE.Vector3(-6.8, -4.2, 0.6), // From cecum junction
      new THREE.Vector3(-6.7, -1.5, 0.4),
      new THREE.Vector3(-6.6, 1.5, 0.2),
      new THREE.Vector3(-6.2, 4.8, 0.0),  // To hepatic flexure
    ],
    pinPosition: { x: -7.0, y: 0.8, z: 0.4 },
    anatomyDesc: '沿右腹壁垂直上行，长约15-20cm，回盲部至肝曲之间，结肠带与结肠袋清晰明显。',
    microbiomeDesc: '右半结肠主要水分重吸收与短链脂肪酸（SCFA）发酵起始区，富集厚壁菌门产丁酸优势菌。',
  },
  {
    id: 'cecum',
    name: '盲肠',
    latinName: 'Cecum',
    baseColor: 0xf2969d, // Soft pink
    hexColor: '#f2969d',
    glowColor: 0xfb7185,
    glowHex: '#fb7185',
    radius: 2.35,
    pouchCount: 3,
    pouchAmplitude: 0.16,
    points: [
      new THREE.Vector3(-6.8, -7.2, 0.6), // Appendix junction
      new THREE.Vector3(-7.2, -5.8, 0.8), // Broad pouch belly
      new THREE.Vector3(-6.8, -4.2, 0.6), // Ascending colon junction
    ],
    pinPosition: { x: -7.6, y: -5.8, z: 0.8 },
    anatomyDesc: '大肠起始盲端囊袋，位于右髂窝内，下端连附阑尾，内侧与末端回肠相连（回盲瓣）。',
    microbiomeDesc: '强厌氧菌天然储存库，富集双歧杆菌与真杆菌属，保护回盲瓣屏障防御逆行感染。',
  },
  {
    id: 'appendix',
    name: '阑尾',
    latinName: 'Appendix vermiformis',
    baseColor: 0xd90429, // Crimson red
    hexColor: '#d90429',
    glowColor: 0xff1e38,
    glowHex: '#ff1e38',
    radius: 0.75,
    pouchCount: 1,
    pouchAmplitude: 0.04,
    points: [
      new THREE.Vector3(-6.0, -9.8, 0.5), // Appendix tip pointing inward/downward
      new THREE.Vector3(-6.6, -8.6, 0.7),
      new THREE.Vector3(-6.8, -7.2, 0.6), // Appendiceal orifice entering cecum
    ],
    pinPosition: { x: -6.0, y: -9.8, z: 0.5 },
    anatomyDesc: '自盲肠后下内侧突出的细长弯曲盲管，长度约6-8cm，黏膜层内富集丰富淋巴滤泡与免疫细胞。',
    microbiomeDesc: '微生态核心“避难所（Safe House）”，高密度生物膜庇护共生菌，可在急性腹泻后重新接种全结肠。',
  },
  {
    id: 'descending',
    name: '降结肠',
    latinName: 'Colon descendens',
    baseColor: 0xff6b81, // Coral pink
    hexColor: '#ff6b81',
    glowColor: 0xf43f5e,
    glowHex: '#f43f5e',
    radius: 2.0,
    pouchCount: 6,
    pouchAmplitude: 0.20,
    points: [
      new THREE.Vector3(6.2, 5.2, 0.0),   // Splenic flexure
      new THREE.Vector3(6.6, 2.0, 0.2),
      new THREE.Vector3(6.6, -1.2, 0.4),
      new THREE.Vector3(6.2, -4.2, 0.6),  // To sigmoid
    ],
    pinPosition: { x: 7.0, y: 1.0, z: 0.3 },
    anatomyDesc: '从左结肠曲（脾曲）沿左腹侧壁垂直下降至左髂嵴，管径较升结肠略细，位置较深且固定。',
    microbiomeDesc: '左半结肠致病菌易感带，兼性厌氧菌与内毒素负荷监控区，溃疡性结肠炎（UC）常发病灶区。',
  },
  {
    id: 'sigmoid',
    name: '乙状结肠',
    latinName: 'Colon sigmoideum',
    baseColor: 0xfbbf24, // Warm golden yellow
    hexColor: '#fbbf24',
    glowColor: 0xfde047,
    glowHex: '#fde047',
    radius: 1.85,
    pouchCount: 4,
    pouchAmplitude: 0.18,
    points: [
      new THREE.Vector3(6.2, -4.2, 0.6),  // From descending
      new THREE.Vector3(5.0, -6.2, 1.2),  // Curved loop in pelvis
      new THREE.Vector3(2.5, -6.8, 1.4),
      new THREE.Vector3(0.0, -6.8, 0.8),  // Entering rectum
    ],
    pinPosition: { x: 4.2, y: -6.4, z: 1.3 },
    anatomyDesc: '盆腔内呈“S”形弯曲游离段，长约40cm，具有较长肠系膜，活动度大，终于第3骶椎平面。',
    microbiomeDesc: 'FMT下消化道保留灌肠的关键定植起点，富集产短链脂肪酸的拟杆菌纲与粪杆菌属。',
  },
  {
    id: 'rectum',
    name: '直肠',
    latinName: 'Rectum',
    baseColor: 0xe11d48, // Rose magenta
    hexColor: '#e11d48',
    glowColor: 0xf43f5e,
    glowHex: '#f43f5e',
    radius: 2.15,
    pouchCount: 2,
    pouchAmplitude: 0.10,
    points: [
      new THREE.Vector3(0.0, -6.8, 0.8),  // Rectosigmoid junction
      new THREE.Vector3(0.0, -8.4, 0.5),  // Rectal ampulla expansion
      new THREE.Vector3(0.0, -9.8, 0.2),  // Anorectal ring
    ],
    pinPosition: { x: 0.0, y: -8.4, z: 0.5 },
    anatomyDesc: '大肠盆腔终末段，全长12-15cm，下份扩张形成直肠壶腹，黏膜形成3个半月形横襞。',
    microbiomeDesc: '排便感受器与局部免疫交互区，分泌型IgA（sIgA）高分泌带，内镜下微生态精准喷洒直达段。',
  },
  {
    id: 'anal_canal',
    name: '肛管',
    latinName: 'Canalis analis',
    baseColor: 0x991b1b, // Dark red
    hexColor: '#991b1b',
    glowColor: 0xef4444,
    glowHex: '#ef4444',
    radius: 1.25,
    pouchCount: 1,
    pouchAmplitude: 0.04,
    points: [
      new THREE.Vector3(0.0, -9.8, 0.2),  // Upper anorectal boundary
      new THREE.Vector3(0.0, -11.0, 0.0), // Terminal sphincter exit
    ],
    pinPosition: { x: 0.0, y: -11.0, z: 0.0 },
    anatomyDesc: '大肠最末端短管，长约3-4cm，受内外括约肌调控，连接肛门缘与外部环境。',
    microbiomeDesc: '微需氧至兼性厌氧交界带，局部上皮紧密连接完整性保障FMT菌液长时程无渗漏保留。',
  }
];

/**
 * Creates custom 3D TubeGeometry with anatomically realistic Haustra pouches (结肠袋)
 */
function createHaustraTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  tubularSegments = 36,
  baseRadius = 2.0,
  radialSegments = 18,
  pouchCount = 6,
  pouchAmplitude = 0.18
): THREE.BufferGeometry {
  const points: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const frames = curve.computeFrenetFrames(tubularSegments, false);

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const pt = curve.getPointAt(u);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    // Smooth sinusoidal modulation along tube length for haustra coli
    const junctionTaper = Math.sin(u * Math.PI);
    const pouchWave = Math.sin(u * pouchCount * Math.PI * 2);
    const r = baseRadius * (1.0 + pouchAmplitude * pouchWave * Math.pow(Math.max(0, junctionTaper), 0.35));

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = v * Math.PI * 2;

      // Subtle non-circular triradiate profile for taenia coli (结肠带)
      const taeniaMod = 1.0 + 0.06 * Math.cos(theta * 3);
      const effRadius = r * taeniaMod;

      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const vx = pt.x + effRadius * (cosT * N.x + sinT * B.x);
      const vy = pt.y + effRadius * (cosT * N.y + sinT * B.y);
      const vz = pt.z + effRadius * (cosT * N.z + sinT * B.z);

      points.push(vx, vy, vz);

      const nx = cosT * N.x + sinT * B.x;
      const ny = cosT * N.y + sinT * B.y;
      const nz = cosT * N.z + sinT * B.z;
      normals.push(nx, ny, nz);

      uvs.push(u, v);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + (j + 1);
      const d = i * (radialSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Returns tailored clinical explanation for each patient case and segment
 * Allows consistent 3D anatomical visualization while presenting tailored clinical guidance.
 */
function getPatientSegmentClinicalNote(patient: ClinicalPatient | undefined, segmentId: string): {
  isLesionZone: boolean;
  statusTag: string;
  tagColor: 'red' | 'amber' | 'blue' | 'emerald';
  clinicalNote: string;
  fmtDeliveryTarget: string;
} {
  if (!patient) {
    return {
      isLesionZone: false,
      statusTag: '生理监测基准',
      tagColor: 'blue',
      clinicalNote: '标准大肠解剖生理段，微生态发酵与屏障维持基准。',
      fmtDeliveryTarget: '全结肠或节段性微生态灌注标准操作规程（SOP）。'
    };
  }

  const pid = patient.id || '';
  const isUC = pid === 'P-2026-0841' || patient.primaryDiagnosis.includes('溃疡性结肠炎');
  const isCDI = pid === 'P-2026-0719' || patient.primaryDiagnosis.includes('艰难梭菌');
  const isIBSD = pid === 'P-2026-0925' || patient.primaryDiagnosis.includes('肠易激综合征');
  const isCD = pid === 'P-2026-0612' || patient.primaryDiagnosis.includes('克罗恩病');

  if (segmentId === 'all') {
    if (isUC) {
      return {
        isLesionZone: true,
        statusTag: '左半结肠弥漫受累',
        tagColor: 'red',
        clinicalNote: '病灶主要沿直肠、乙状结肠向降结肠连续性蔓延，黏膜脆性高伴接触性渗血，右半结肠黏膜相对保持完整。',
        fmtDeliveryTarget: '建议结肠镜直视下多点喷洒（深达降结肠）联合保留灌肠。'
      };
    } else if (isCDI) {
      return {
        isLesionZone: true,
        statusTag: '假膜广泛高危浸润',
        tagColor: 'red',
        clinicalNote: '全结肠微生态极度崩解，次级胆汁酸代谢停止，回盲部与升结肠附着多发黄色假膜，毒素释放旺盛。',
        fmtDeliveryTarget: '大剂量供体菌液全结肠冲刷喷洒，快速建立初级定植抗力屏障。'
      };
    } else if (isIBSD) {
      return {
        isLesionZone: false,
        statusTag: '全结肠动力紊乱',
        tagColor: 'amber',
        clinicalNote: '全结肠黏膜无器质性溃疡缺损，主要为肠-脑轴功能失调、结肠张力痉挛与内脏高敏感性。',
        fmtDeliveryTarget: '建议口服高活性耐酸微囊胶囊联合可溶性膳食纤维全肠道调理。'
      };
    } else if (isCD) {
      return {
        isLesionZone: true,
        statusTag: '节段性跳跃病损',
        tagColor: 'red',
        clinicalNote: '呈现典型节段性透壁炎症，回盲部严重受累伴鹅卵石样改变与线状溃疡，远端直肠多豁免。',
        fmtDeliveryTarget: '严格评估管腔狭窄度后，于回盲部安全远端低压缓慢注射菌液。'
      };
    }
  }

  // Segment-specific analysis for patient cases
  switch (segmentId) {
    case 'cecum':
      if (isUC) {
        return {
          isLesionZone: false,
          statusTag: '近端菌群蓄水池',
          tagColor: 'emerald',
          clinicalNote: '盲肠黏膜未见溃疡，为双歧杆菌与真杆菌属定植向上扩展提供了良好的微环境与保护屏障。',
          fmtDeliveryTarget: '结肠镜可送至回盲瓣下方轻柔喷洒，构建近端抗炎储备库。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 核心高危假膜蓄积区',
          tagColor: 'red',
          clinicalNote: '回盲部内镜下见致密黄色点片状假膜，产毒梭菌负荷极高，定植抗力完全瓦解。',
          fmtDeliveryTarget: '【首要靶区】结肠镜下优先对盲肠假膜周围黏膜喷洒供体活性菌液。'
        };
      } else if (isIBSD) {
        return {
          isLesionZone: false,
          statusTag: '盲端厌氧发酵带',
          tagColor: 'blue',
          clinicalNote: '黏膜光滑充血不明显，回盲瓣开闭协调性稍慢，兼性厌氧菌比例偏低。',
          fmtDeliveryTarget: '口服微囊或灌肠均可波及，补充长双歧杆菌。'
        };
      } else if (isCD) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 回盲部重度浸润病灶',
          tagColor: 'red',
          clinicalNote: '盲肠黏膜显著水肿充血，可见节段性裂隙样深溃疡，炎性肉芽肿增生，SES-CD评分为9分。',
          fmtDeliveryTarget: '严禁高压推注；轻柔局部涂抹以阻遏炎性级联激活。'
        };
      }
      break;

    case 'appendix':
      if (isUC) {
        return {
          isLesionZone: false,
          statusTag: '微生态庇护所',
          tagColor: 'emerald',
          clinicalNote: '阑尾开口无红肿，作为正常生物膜避难所，可在FMT后庇护外源供体菌株抵抗环境波动。',
          fmtDeliveryTarget: '顺应盲肠自然蠕动推移，无需侵入阑尾腔内。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: false,
          statusTag: '共生菌再接种源泉',
          tagColor: 'blue',
          clinicalNote: '既往抗生素治疗后原有菌群枯竭，若供体菌成功定植阑尾隐窝，可显著降低CDI四次复发风险。',
          fmtDeliveryTarget: '经盲肠注入的供体菌液自然流经阑尾开口完成接种。'
        };
      } else if (isCD) {
        return {
          isLesionZone: true,
          statusTag: '回盲区邻近反应区',
          tagColor: 'amber',
          clinicalNote: '回盲部炎症水肿可能累及阑尾周围组织，需与急性阑尾炎发作鉴别。',
          fmtDeliveryTarget: '保持回盲区低压减负，防止局部窦道形成。'
        };
      }
      break;

    case 'ascending':
      if (isUC) {
        return {
          isLesionZone: false,
          statusTag: '右半结肠保护带',
          tagColor: 'emerald',
          clinicalNote: '升结肠黏膜光滑，血管纹理清晰，结肠袋规则，为丁酸盐生成菌提供了充裕的膳食纤维发酵底物。',
          fmtDeliveryTarget: '回盲部冲洗后，于升结肠中段分次布点喷洒。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 假膜侵润蔓延段',
          tagColor: 'red',
          clinicalNote: '假膜由盲肠向上蔓延至升结肠近段，黏膜呈斑驳红斑水肿，毒素B直接损伤上皮细胞骨架。',
          fmtDeliveryTarget: '重点覆盖升结肠结肠袋深凹处，阻遏芽孢再度萌发。'
        };
      } else if (isIBSD) {
        return {
          isLesionZone: false,
          statusTag: '排空亢进功能区',
          tagColor: 'amber',
          clinicalNote: '蠕动波传导加速，水分重吸收率降低致大便成形欠佳，拟杆菌产氢产甲烷平衡失调。',
          fmtDeliveryTarget: '调节短链脂肪酸比例，恢复自主慢波节律。'
        };
      } else if (isCD) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 跳跃性鹅卵石样溃疡',
          tagColor: 'red',
          clinicalNote: '下段近盲肠处呈特征性鹅卵石样改变，上段出现跳跃性健康黏膜岛，透壁性炎症浸润。',
          fmtDeliveryTarget: '微生态菌液涂布于溃疡边缘，刺激紧密连接蛋白Claudin-1修复。'
        };
      }
      break;

    case 'transverse':
      if (isUC) {
        return {
          isLesionZone: false,
          statusTag: '病灶交界过渡段',
          tagColor: 'blue',
          clinicalNote: '横结肠右段基本正常，左段近脾曲处可见轻度接触性充血，炎症呈由左向右梯度递减。',
          fmtDeliveryTarget: '内镜退镜时持续均匀给药，阻断炎症向近端推进。'
        };
      } else if (isIBSD) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 痉挛腹痛好发区',
          tagColor: 'amber',
          clinicalNote: '胃结肠反射亢进，进餐后横结肠易发生局灶性强力痉挛，伴气体积聚引起上腹及脐周胀痛。',
          fmtDeliveryTarget: '多酚益生元联合双歧杆菌定植，抑制5-HT受体敏感度。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: false,
          statusTag: '肠管扩张监控带',
          tagColor: 'amber',
          clinicalNote: '重症CDI需警惕横结肠管径异常扩张（中毒性巨结肠排查），目前内镜显示管壁张力正常。',
          fmtDeliveryTarget: '保持菌液常温微压，防止激发结肠过度扩张。'
        };
      }
      break;

    case 'descending':
      if (isUC) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 主要受累严重病灶区',
          tagColor: 'red',
          clinicalNote: '内镜见黏膜弥漫性显著充血、质脆水肿、多发浅表糜烂与黏液脓血附着，Mayo内镜评分2级，患者腹痛腹泻主因。',
          fmtDeliveryTarget: '【核心主靶区】内镜直视下高密度定量喷洒，优先促进上皮修复。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: true,
          statusTag: '炎性水样泻流注段',
          tagColor: 'amber',
          clinicalNote: '黏膜呈广泛泛红伴点状渗血，频繁腹泻冲刷致黏液保护层极度变薄，钙卫蛋白持续超标。',
          fmtDeliveryTarget: '高活性菌液多点覆盖，竞争性抑制病原菌黏附。'
        };
      } else if (isIBSD) {
        return {
          isLesionZone: false,
          statusTag: '高反应性收缩带',
          tagColor: 'blue',
          clinicalNote: '黏膜无器质破损，排便前出现高幅收缩波，平滑肌对胆碱能刺激过敏。',
          fmtDeliveryTarget: '微生态代谢产物调节自主神经丛，松弛痉挛段。'
        };
      }
      break;

    case 'sigmoid':
      if (isUC) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 溃疡密集与狭窄警戒区',
          tagColor: 'red',
          clinicalNote: '乙状结肠黏膜脆性极高，触之易出血，血管纹理完全消失，是里急后重与脓血便的关键发病部位。',
          fmtDeliveryTarget: '【灌肠首选送达深度】保留灌肠管插入25-35cm直接灌注，维持45分钟以上。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: true,
          statusTag: '灌肠定植起效段',
          tagColor: 'amber',
          clinicalNote: '肠壁充血伴大量炎性稀便流经，保留灌肠时需控制灌注流速与恒温（37℃），提升患者耐受度。',
          fmtDeliveryTarget: '下消化道保留灌肠给药主靶段。'
        };
      } else if (isIBSD) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 里急后重与痉挛绞痛段',
          tagColor: 'amber',
          clinicalNote: '乙状结肠痉挛性狭窄，左下腹触诊可及条索状饱满肠管，排便不尽感强烈。',
          fmtDeliveryTarget: '改善肠道通透性，降低黏膜肥大细胞活化水平。'
        };
      }
      break;

    case 'rectum':
      if (isUC) {
        return {
          isLesionZone: true,
          statusTag: '⚠️ 直肠壶腹严重溃疡浸润',
          tagColor: 'red',
          clinicalNote: '直肠黏膜弥漫脱落伴新鲜自发渗血，便意频繁（6-8次/天），局部炎性递质IL-8与TNF-α高浓度聚集。',
          fmtDeliveryTarget: '内镜喷洒后配合微生态外用灌肠胶囊或栓剂维持局部定植浓度。'
        };
      } else if (isCDI) {
        return {
          isLesionZone: true,
          statusTag: '毒素刺激排泄终末段',
          tagColor: 'amber',
          clinicalNote: '直肠壶腹黏膜水肿显著，粪便钙卫蛋白达890 μg/g，需防范毒素经黏膜破损入血。',
          fmtDeliveryTarget: '灌肠注药后指导患者双侧卧位交替，促进菌液上行分布。'
        };
      } else if (isCD) {
        return {
          isLesionZone: false,
          statusTag: '直肠相对豁免 (Rectal Sparing)',
          tagColor: 'emerald',
          clinicalNote: '呈现经典克罗恩病直肠黏膜豁免特征，直肠壁未受明显侵及，无深大纵行溃疡。',
          fmtDeliveryTarget: '作为安全给药入路通道，耐受性良好。'
        };
      }
      break;

    case 'anal_canal':
      return {
        isLesionZone: false,
        statusTag: '括约肌控压屏障',
        tagColor: 'blue',
        clinicalNote: '内镜检查确认无肛裂或深溃疡，内外括约肌闭合张力良好，是保障FMT菌液保留的最后防线。',
        fmtDeliveryTarget: '拔管后轻柔压迫肛周2-3分钟，指导患者保持臀高位15分钟。'
      };
  }

  // Fallback
  return {
    isLesionZone: false,
    statusTag: '协同观察段',
    tagColor: 'blue',
    clinicalNote: '该解剖部位黏膜基本平稳，参与维持大肠整体微生态动态平衡。',
    fmtDeliveryTarget: '顺应全结肠生理蠕动均匀扩散定植。'
  };
}

interface ThreeGutDigitalTwinProps {
  patient?: ClinicalPatient;
  stateMode?: 'dysbiosis' | 'reconstruction';
  onSegmentSelect?: (segmentName: string) => void;
  className?: string;
}

export const ThreeGutDigitalTwin: React.FC<ThreeGutDigitalTwinProps> = ({
  patient,
  stateMode: initialMode,
  onSegmentSelect,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto determine mode from patient phase
  const effectiveInitialMode = initialMode || (patient?.currentPhase === '随访监测期' ? 'reconstruction' : 'dysbiosis');
  const [currentMode, setCurrentMode] = useState<'dysbiosis' | 'reconstruction'>(effectiveInitialMode);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string>('all');
  const [hoveredSegment, setHoveredSegment] = useState<{ id: string; name: string } | null>(null);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [showAnatomyCard, setShowAnatomyCard] = useState<boolean>(true);
  const [showPinBadges, setShowPinBadges] = useState<boolean>(true);

  // Active segment config object
  const activeSegmentConfig = useMemo(() => {
    return COLON_SEGMENTS.find(s => s.id === activeSegmentId) || null;
  }, [activeSegmentId]);

  // Patient clinical analysis for current segment
  const patientNote = useMemo(() => {
    return getPatientSegmentClinicalNote(patient, activeSegmentId);
  }, [patient, activeSegmentId]);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const segmentMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const haloMeshesRef = useRef<Record<string, THREE.Mesh>>({});
  const beaconMeshRef = useRef<THREE.Mesh | null>(null);
  const dynamicLightRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Mouse drag and stable orientation state (NO sudden jerks/rotations on click!)
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const modelRotationRef = useRef({ x: 0, y: 0 });

  // Handle selecting a segment: highlights that segment cleanly without moving the camera!
  const handleSelectSegment = (segId: string) => {
    setActiveSegmentId(segId);
    setShowAnatomyCard(true);
    const seg = COLON_SEGMENTS.find(s => s.id === segId);
    if (onSegmentSelect) {
      onSegmentSelect(seg ? seg.name : '全结肠全景');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1020); // Deep medical navy slate

    // 2. Camera - Canonical Standard Frontal Medical View (Consistent across all patients)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, -1.8, 38);
    camera.lookAt(0, -1.8, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System
    const ambientLight = new THREE.AmbientLight(0x131f3d, 2.6);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainKeyLight.position.set(12, 22, 25);
    scene.add(mainKeyLight);

    const softFillLight = new THREE.DirectionalLight(0x3a86ff, 1.2);
    softFillLight.position.set(-18, -8, 15);
    scene.add(softFillLight);

    const backRimLight = new THREE.DirectionalLight(0x20cfff, 1.6);
    backRimLight.position.set(0, -15, -20);
    scene.add(backRimLight);

    // Dynamic Focused Spotlight that highlights the active segment
    const dynamicSpotLight = new THREE.PointLight(0xffffff, 3.0, 30);
    dynamicSpotLight.position.set(0, 0, 8);
    scene.add(dynamicSpotLight);
    dynamicLightRef.current = dynamicSpotLight;

    // 5. Main Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;
    modelGroup.position.set(0, 0, 0);
    modelGroup.rotation.set(modelRotationRef.current.x, modelRotationRef.current.y, 0);

    // 6. Build the 8 Anatomical Colon Segments
    segmentMeshesRef.current = {};
    haloMeshesRef.current = {};

    COLON_SEGMENTS.forEach((seg) => {
      const segCurve = new THREE.CatmullRomCurve3(seg.points, false, 'centripetal', 0.5);

      // Primary Haustra Tube Mesh
      const geom = createHaustraTubeGeometry(
        segCurve,
        Math.max(28, seg.points.length * 10),
        seg.radius,
        22,
        seg.pouchCount,
        seg.pouchAmplitude
      );

      const mat = new THREE.MeshPhysicalMaterial({
        color: seg.baseColor,
        emissive: seg.baseColor,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.92,
        roughness: 0.25,
        metalness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.15,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData = { segmentId: seg.id, segmentName: seg.name };
      modelGroup.add(mesh);
      segmentMeshesRef.current[seg.id] = mesh;

      // Outer Glowing Halo Corona Mesh
      const haloGeom = createHaustraTubeGeometry(
        segCurve,
        Math.max(22, seg.points.length * 8),
        seg.radius * 1.22,
        16,
        seg.pouchCount,
        seg.pouchAmplitude * 0.5
      );

      const haloMat = new THREE.MeshBasicMaterial({
        color: seg.glowColor,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      });

      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      haloMesh.userData = { isHalo: true, parentSegmentId: seg.id };
      haloMesh.visible = false;
      modelGroup.add(haloMesh);
      haloMeshesRef.current[seg.id] = haloMesh;
    });

    // 7. Active Segment 3D Target Beacon Indicator
    const beaconGeometry = new THREE.TorusGeometry(1.6, 0.12, 16, 40);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0x20cfff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beaconMesh = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beaconMesh.visible = false;
    modelGroup.add(beaconMesh);
    beaconMeshRef.current = beaconMesh;

    // 8. Continuous Full Colon Curve for Microbial Particle Flow
    const fullColonPathPoints: THREE.Vector3[] = [
      new THREE.Vector3(-6.8, -7.2, 0.6), // Appendix/Cecum start
      new THREE.Vector3(-7.2, -5.8, 0.8),
      new THREE.Vector3(-6.8, -4.2, 0.6), // Ascending colon start
      new THREE.Vector3(-6.7, -1.5, 0.4),
      new THREE.Vector3(-6.6, 1.5, 0.2),
      new THREE.Vector3(-6.2, 4.8, 0.0),  // Hepatic flexure
      new THREE.Vector3(-3.2, 4.5, 1.1),  // Transverse colon
      new THREE.Vector3(0.0, 3.8, 1.4),
      new THREE.Vector3(3.2, 4.6, 1.1),
      new THREE.Vector3(6.2, 5.2, 0.0),   // Splenic flexure
      new THREE.Vector3(6.6, 2.0, 0.2),   // Descending colon
      new THREE.Vector3(6.6, -1.2, 0.4),
      new THREE.Vector3(6.2, -4.2, 0.6),  // Sigmoid colon start
      new THREE.Vector3(5.0, -6.2, 1.2),
      new THREE.Vector3(2.5, -6.8, 1.4),
      new THREE.Vector3(0.0, -6.8, 0.8),  // Rectum start
      new THREE.Vector3(0.0, -8.4, 0.5),
      new THREE.Vector3(0.0, -9.8, 0.2),  // Anal canal
      new THREE.Vector3(0.0, -11.0, 0.0),
    ];

    const continuousColonCurve = new THREE.CatmullRomCurve3(fullColonPathPoints, false, 'centripetal', 0.5);

    // Microbial Flow Particles
    const particleCount = 1200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const progressArray = new Float32Array(particleCount);
    const speedArray = new Float32Array(particleCount);
    const offsetRadiusArray = new Float32Array(particleCount);
    const offsetAngleArray = new Float32Array(particleCount);
    const particleTypeArray = new Float32Array(particleCount); // 0: beneficial, 1: commensal, 2: pathogen

    const isDysbiosis = currentMode === 'dysbiosis';

    for (let i = 0; i < particleCount; i++) {
      const progress = Math.random();
      progressArray[i] = progress;
      speedArray[i] = 0.0006 + Math.random() * 0.0014;
      offsetRadiusArray[i] = Math.random() * 1.3;
      offsetAngleArray[i] = Math.random() * Math.PI * 2;

      let pType = 0;
      if (isDysbiosis) {
        const rand = Math.random();
        if (rand < 0.52) pType = 2; // Pathogen (Coral red/amber)
        else if (rand < 0.78) pType = 1; // Commensal (Violet)
        else pType = 0; // Beneficial (Cyan/Green)
      } else {
        const rand = Math.random();
        if (rand < 0.75) pType = 0; // Beneficial (Cyan/Emerald)
        else if (rand < 0.92) pType = 1; // Commensal (Violet)
        else pType = 2; // Residual pathogen
      }
      particleTypeArray[i] = pType;

      const col = new THREE.Color();
      if (pType === 0) {
        col.set(Math.random() > 0.5 ? 0x20cfff : 0x23e6b1);
      } else if (pType === 1) {
        col.set(0x815cff);
      } else {
        col.set(Math.random() > 0.4 ? 0xff536c : 0xffb84d);
      }

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      sizes[i] = pType === 0 ? 1.4 : pType === 2 ? 1.9 : 1.2;

      const pt = continuousColonCurve.getPointAt(progress);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    modelGroup.add(particles);

    // 9. Animation & Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Slow auto rotate if explicitly toggled by user
      if (autoRotate && !isDraggingRef.current && modelGroupRef.current) {
        modelRotationRef.current.y += delta * 0.25;
        modelGroupRef.current.rotation.y = modelRotationRef.current.y;
      }

      // Dynamic Segment Glowing Update
      const isAll = activeSegmentId === 'all';
      const activeSeg = COLON_SEGMENTS.find(s => s.id === activeSegmentId);

      COLON_SEGMENTS.forEach((seg) => {
        const mesh = segmentMeshesRef.current[seg.id];
        const haloMesh = haloMeshesRef.current[seg.id];
        if (!mesh) return;

        const isSelected = activeSegmentId === seg.id;
        const isHovered = hoveredSegment?.id === seg.id;
        const mat = mesh.material as THREE.MeshPhysicalMaterial;

        if (isSelected) {
          // Intense vivid glowing pulse on selected segment
          const pulse = Math.sin(time * 3.8) * 0.5 + 0.5; // 0 to 1
          mat.color.set(seg.glowColor);
          mat.emissive.set(seg.glowColor);
          mat.emissiveIntensity = 2.2 + pulse * 1.2; // 2.2 - 3.4
          mat.opacity = 1.0;
          mat.roughness = 0.12;

          if (haloMesh) {
            haloMesh.visible = true;
            const haloMat = haloMesh.material as THREE.MeshBasicMaterial;
            haloMat.opacity = 0.5 + pulse * 0.4;
          }

          // Move spotlight to this active segment
          if (dynamicLightRef.current) {
            dynamicLightRef.current.color.set(seg.glowColor);
            dynamicLightRef.current.position.set(seg.pinPosition.x, seg.pinPosition.y, seg.pinPosition.z + 3.5);
            dynamicLightRef.current.intensity = 5.5 + pulse * 2.5;
          }
        } else if (isAll) {
          // Panoramic view - all segments in their clean, distinct anatomical colors
          mat.color.set(seg.baseColor);
          mat.emissive.set(seg.baseColor);
          mat.emissiveIntensity = isHovered ? 0.95 : 0.35;
          mat.opacity = isHovered ? 1.0 : 0.92;
          mat.roughness = 0.25;

          if (haloMesh) {
            haloMesh.visible = isHovered;
            if (isHovered) {
              const haloMat = haloMesh.material as THREE.MeshBasicMaterial;
              haloMat.opacity = 0.35;
            }
          }
        } else {
          // Another segment is selected: dim unselected segments cleanly for maximum contrast
          mat.color.set(seg.baseColor);
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = isHovered ? 0.4 : 0.05;
          mat.opacity = isHovered ? 0.75 : 0.36;
          mat.roughness = 0.55;

          if (haloMesh) {
            haloMesh.visible = false;
          }
        }
      });

      // Target Beacon Ring Animation on active segment
      if (beaconMeshRef.current) {
        if (!isAll && activeSeg) {
          beaconMeshRef.current.visible = true;
          beaconMeshRef.current.position.set(activeSeg.pinPosition.x, activeSeg.pinPosition.y, activeSeg.pinPosition.z);
          beaconMeshRef.current.rotation.z += delta * 1.5;
          const ringPulse = Math.sin(time * 3.8) * 0.5 + 0.5;
          const beaconMat = beaconMeshRef.current.material as THREE.MeshBasicMaterial;
          beaconMat.color.set(activeSeg.glowColor);
          beaconMat.opacity = 0.4 + ringPulse * 0.45;
          const scale = 1.0 + ringPulse * 0.25;
          beaconMeshRef.current.scale.set(scale, scale, scale);
        } else {
          beaconMeshRef.current.visible = false;
        }
      }

      // Update Microbial Particles Flow
      if (particlesRef.current) {
        const pPositions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          progressArray[i] = (progressArray[i] + speedArray[i]) % 1.0;
          const pt = continuousColonCurve.getPointAt(progressArray[i]);

          const rad = offsetRadiusArray[i];
          const ang = offsetAngleArray[i] + time * 0.5;
          const ox = Math.cos(ang) * rad;
          const oz = Math.sin(ang) * rad;

          pPositions[i * 3] = pt.x + ox;
          pPositions[i * 3 + 1] = pt.y;
          pPositions[i * 3 + 2] = pt.z + oz;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // 11. Interactive Raycasting & Pointer Events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const domElement = renderer.domElement;

    const segmentMeshesList = Object.values(segmentMeshesRef.current) as THREE.Mesh[];

    let dragStartX = 0;
    let dragStartY = 0;
    let hasDragged = false;

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      hasDragged = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.set(x, y);

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePosRef.current.x;
        const deltaY = e.clientY - previousMousePosRef.current.y;
        if (Math.abs(e.clientX - dragStartX) > 4 || Math.abs(e.clientY - dragStartY) > 4) {
          hasDragged = true;
        }

        modelRotationRef.current.y += deltaX * 0.008;
        modelRotationRef.current.x += deltaY * 0.008;
        // Limit vertical tilt
        modelRotationRef.current.x = Math.max(-0.6, Math.min(0.6, modelRotationRef.current.x));

        if (modelGroupRef.current) {
          modelGroupRef.current.rotation.y = modelRotationRef.current.y;
          modelGroupRef.current.rotation.x = modelRotationRef.current.x;
        }
        previousMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycast hover check on primary segment meshes
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(segmentMeshesList, false);
        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const segId = hitMesh.userData.segmentId;
          const segName = hitMesh.userData.segmentName;
          if (segId) {
            setHoveredSegment({ id: segId, name: segName });
            domElement.style.cursor = 'pointer';
            return;
          }
        }
        setHoveredSegment(null);
        domElement.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!hasDragged) {
        // Pure click without significant dragging: trigger direct 3D segment selection!
        const rect = domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(segmentMeshesList, false);
        if (intersects.length > 0) {
          const hitMesh = intersects[0].object as THREE.Mesh;
          const segId = hitMesh.userData.segmentId;
          if (segId) {
            handleSelectSegment(segId);
          }
        }
      }
      isDraggingRef.current = false;
      domElement.style.cursor = 'grab';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const newZ = cameraRef.current.position.z + e.deltaY * 0.035;
      cameraRef.current.position.z = Math.max(20, Math.min(52, newZ));
    };

    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [currentMode]);

  // Reset 3D view to standard canonical frontal view
  const resetView = () => {
    modelRotationRef.current = { x: 0, y: 0 };
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, -1.8, 38);
      cameraRef.current.lookAt(0, -1.8, 0);
    }
    handleSelectSegment('all');
  };

  return (
    <div id="three-gut-container-card" className={`relative rounded-xl border border-[#1e2f57] bg-[#0c1429] overflow-hidden select-none ${className}`}>
      {/* Top Header Bar: Anatomical Title & View Controls */}
      <div id="three-gut-header-bar" className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Anatomical Digital Twin Brand & Pin Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#091127]/90 border border-[#2b4170]/70 backdrop-blur-md pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20cfff] shadow-[0_0_8px_#20cfff] animate-pulse"></span>
            <span className="text-xs font-bold text-[#eef4ff] tracking-wide">
              大肠解剖结构 · 3D高精孪生
            </span>
            <span className="text-[10px] text-[#20cfff] bg-[#20cfff]/10 px-1.5 py-0.5 rounded border border-[#20cfff]/30">
              8大解剖分区
            </span>
          </div>

          <div className="h-3.5 w-[1px] bg-[#1e2f57]"></div>

          <button
            id="toggle-pin-badges"
            onClick={() => setShowPinBadges(!showPinBadges)}
            title={showPinBadges ? '隐藏部位指示标签' : '显示部位指示标签'}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 font-medium ${
              showPinBadges ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPinBadges ? '解剖标签: 显示' : '解剖标签: 隐藏'}</span>
          </button>
        </div>

        {/* Right: State Switcher & Tools */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#091127]/90 border border-[#2b4170]/70 backdrop-blur-md pointer-events-auto shadow-lg">
          {/* Dysbiosis / Reconstruction State */}
          <button
            id="state-btn-dysbiosis"
            onClick={() => setCurrentMode('dysbiosis')}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentMode === 'dysbiosis'
                ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/50 shadow-[0_0_10px_rgba(255,83,108,0.25)]'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            治疗前失衡
          </button>
          <button
            id="state-btn-reconstruction"
            onClick={() => setCurrentMode('reconstruction')}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentMode === 'reconstruction'
                ? 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/50 shadow-[0_0_10px_rgba(32,207,255,0.25)]'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            FMT重构态
          </button>

          <div className="h-3.5 w-[1px] bg-[#1e2f57] mx-0.5"></div>

          <button
            id="auto-rotate-toggle"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? '暂停旋转' : '自动缓慢旋转'}
            className={`p-1.5 rounded text-xs transition-colors ${
              autoRotate ? 'text-[#20cfff] bg-[#20cfff]/20' : 'text-[#8996b8] hover:text-[#eef4ff]'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            id="reset-view-btn"
            onClick={resetView}
            title="重置为正面标准解剖图"
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
        className="w-full h-full min-h-[480px] cursor-grab active:cursor-grabbing"
      />

      {/* Overlay: Interactive Anatomical Pin Badges (Directly corresponding to Reference Diagram) */}
      {showPinBadges && (
        <div id="anatomical-pin-overlay" className="absolute inset-0 pointer-events-none z-10">
          {/* Transverse Colon Pin (Top center) */}
          <div className="absolute top-[16%] left-[48%] -translate-x-1/2 pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('transverse')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'transverse'
                  ? 'bg-[#84cc16] text-[#091020] border-[#a3e635] shadow-[0_0_14px_rgba(132,204,22,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#84cc16] border-[#84cc16]/50 hover:bg-[#84cc16]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#84cc16] shrink-0 group-hover:scale-125 transition-transform" />
              <span>横结肠</span>
            </button>
          </div>

          {/* Ascending Colon Pin (Left) */}
          <div className="absolute top-[40%] left-[20%] pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('ascending')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'ascending'
                  ? 'bg-[#3a86ff] text-white border-[#60a5fa] shadow-[0_0_14px_rgba(58,134,255,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#3a86ff] border-[#3a86ff]/50 hover:bg-[#3a86ff]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#3a86ff] shrink-0 group-hover:scale-125 transition-transform" />
              <span>升结肠</span>
            </button>
          </div>

          {/* Cecum Pin (Bottom Left) */}
          <div className="absolute top-[63%] left-[19%] pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('cecum')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'cecum'
                  ? 'bg-[#f2969d] text-[#091020] border-[#fb7185] shadow-[0_0_14px_rgba(242,150,157,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#f2969d] border-[#f2969d]/50 hover:bg-[#f2969d]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f2969d] shrink-0 group-hover:scale-125 transition-transform" />
              <span>盲肠</span>
            </button>
          </div>

          {/* Appendix Pin (Bottommost Left) */}
          <div className="absolute top-[78%] left-[22%] pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('appendix')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'appendix'
                  ? 'bg-[#d90429] text-white border-[#ff1e38] shadow-[0_0_14px_rgba(217,4,41,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#ff4d6d] border-[#d90429]/50 hover:bg-[#d90429]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#d90429] shrink-0 group-hover:scale-125 transition-transform" />
              <span>阑尾</span>
            </button>
          </div>

          {/* Descending Colon Pin (Right) */}
          <div className="absolute top-[40%] right-[20%] pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('descending')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'descending'
                  ? 'bg-[#ff6b81] text-[#091020] border-[#f43f5e] shadow-[0_0_14px_rgba(255,107,129,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#ff6b81] border-[#ff6b81]/50 hover:bg-[#ff6b81]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#ff6b81] shrink-0 group-hover:scale-125 transition-transform" />
              <span>降结肠</span>
            </button>
          </div>

          {/* Sigmoid Colon Pin (Bottom Right) */}
          <div className="absolute top-[66%] right-[28%] pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('sigmoid')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'sigmoid'
                  ? 'bg-[#fbbf24] text-[#091020] border-[#fde047] shadow-[0_0_14px_rgba(251,191,36,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#fbbf24] border-[#fbbf24]/50 hover:bg-[#fbbf24]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#fbbf24] shrink-0 group-hover:scale-125 transition-transform" />
              <span>乙状结肠</span>
            </button>
          </div>

          {/* Rectum Pin (Bottom Center) */}
          <div className="absolute top-[75%] left-[48%] -translate-x-1/2 pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('rectum')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'rectum'
                  ? 'bg-[#e11d48] text-white border-[#f43f5e] shadow-[0_0_14px_rgba(225,29,72,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#e11d48] border-[#e11d48]/50 hover:bg-[#e11d48]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#e11d48] shrink-0 group-hover:scale-125 transition-transform" />
              <span>直肠</span>
            </button>
          </div>

          {/* Anal Canal Pin (Bottommost Center) */}
          <div className="absolute top-[88%] left-[48%] -translate-x-1/2 pointer-events-auto">
            <button
              onClick={() => handleSelectSegment('anal_canal')}
              className={`group flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all border shadow-lg backdrop-blur-sm ${
                activeSegmentId === 'anal_canal'
                  ? 'bg-[#991b1b] text-white border-[#ef4444] shadow-[0_0_14px_rgba(153,27,27,0.6)] scale-110 ring-2 ring-white/50'
                  : 'bg-[#091127]/85 text-[#f87171] border-[#991b1b]/50 hover:bg-[#991b1b]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#991b1b] shrink-0 group-hover:scale-125 transition-transform" />
              <span>肛管</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Hover Indicator on 3D Canvas */}
      {hoveredSegment && (
        <div 
          className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-3 py-1 rounded-full bg-[#091127]/95 border border-[#20cfff] text-xs text-[#eef4ff] shadow-2xl backdrop-blur-md flex items-center gap-2"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#20cfff] animate-spin" />
          <span>点击高亮发光: <strong>{hoveredSegment.name}</strong></span>
        </div>
      )}

      {/* Floating Anatomical & Clinical Spotlight Detail Card (Tailored to current patient) */}
      {showAnatomyCard && (
        <div 
          id="segment-anatomy-card"
          className="absolute top-14 right-3 z-20 w-84 max-w-[calc(100%-24px)] rounded-xl bg-[#091127]/95 border border-[#2b4170] shadow-2xl backdrop-blur-md p-3.5 text-xs animate-in fade-in duration-200"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2f57]">
            <div className="flex items-center gap-2">
              {activeSegmentConfig ? (
                <span 
                  className="w-3.5 h-3.5 rounded-full animate-pulse shadow-md"
                  style={{ 
                    backgroundColor: activeSegmentConfig.hexColor, 
                    boxShadow: `0 0 10px ${activeSegmentConfig.hexColor}` 
                  }}
                />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-[#20cfff] shadow-[0_0_8px_#20cfff]" />
              )}
              <div>
                <h4 className="font-bold text-[#eef4ff] text-sm flex items-center gap-1.5">
                  {activeSegmentConfig ? activeSegmentConfig.name : '全结肠多段病理全景'}
                  {activeSegmentConfig && (
                    <span className="text-[10px] text-[#8996b8] font-normal italic">
                      {activeSegmentConfig.latinName}
                    </span>
                  )}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                patientNote.tagColor === 'red' 
                  ? 'bg-[#ff536c]/20 text-[#ff536c] border border-[#ff536c]/40' 
                  : patientNote.tagColor === 'amber'
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40'
                  : patientNote.tagColor === 'emerald'
                  ? 'bg-[#23e6b1]/20 text-[#23e6b1] border border-[#23e6b1]/40'
                  : 'bg-[#20cfff]/20 text-[#20cfff] border border-[#20cfff]/40'
              }`}>
                {patientNote.statusTag}
              </span>

              <button
                onClick={() => setShowAnatomyCard(false)}
                className="text-[#8996b8] hover:text-[#eef4ff] p-1 rounded hover:bg-[#152347]"
                title="关闭说明卡"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Body: Dynamic patient-tailored clinical explanation */}
          <div className="space-y-2.5 text-[11px]">
            {/* Patient Context Banner */}
            {patient && (
              <div className="p-2 rounded bg-[#0e1935] border border-[#2b4170]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8996b8]">当前受体病例:</span>
                  <div className="font-bold text-[#eef4ff] text-xs flex items-center gap-1.5">
                    {patient.name}
                    <span className="text-[10px] font-normal text-[#20cfff]">
                      ({patient.primaryDiagnosis.split('(')[0].trim()})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-[#8996b8] bg-[#152347] px-1.5 py-0.5 rounded">
                  {patient.currentPhase}
                </span>
              </div>
            )}

            {/* Patient Specific Clinical Finding */}
            <div className={`p-2.5 rounded border ${
              patientNote.isLesionZone 
                ? 'bg-[#210e19] border-[#ff536c]/40 text-[#ffcad4]'
                : 'bg-[#0f1d3a] border-[#20cfff]/40 text-[#cad5e8]'
            }`}>
              <span className={`text-[10px] font-bold block mb-1 flex items-center gap-1 ${
                patientNote.isLesionZone ? 'text-[#ff536c]' : 'text-[#20cfff]'
              }`}>
                {patientNote.isLesionZone ? <AlertTriangle className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                针对当前受体的病理与浸润评估:
              </span>
              <p className="text-[#eef4ff] leading-relaxed text-[11px]">
                {patientNote.clinicalNote}
              </p>
            </div>

            {/* FMT Targeted Delivery Note */}
            <div className="p-2 rounded bg-[#0b162f] border border-[#2b4170]/50">
              <span className="text-[10px] font-semibold text-[#23e6b1] block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> FMT 临床靶向与操作建议:
              </span>
              <p className="text-[#cad5e8] leading-relaxed text-[11px]">
                {patientNote.fmtDeliveryTarget}
              </p>
            </div>

            {/* Universal Anatomical & Microbial Baseline */}
            {activeSegmentConfig && (
              <div className="pt-1.5 border-t border-[#1e2f57]/80 text-[#8996b8] space-y-1">
                <p className="text-[10px] leading-relaxed">
                  <strong className="text-[#cad5e8]">解剖特征: </strong>
                  {activeSegmentConfig.anatomyDesc}
                </p>
                <p className="text-[10px] leading-relaxed">
                  <strong className="text-[#20cfff]">微生态基准: </strong>
                  {activeSegmentConfig.microbiomeDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Segment Switcher Bar: 8 Colon Segments + Panoramic View */}
      <div 
        id="colon-segment-tabs-bar"
        className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[#091127]/95 border border-[#2b4170]/80 backdrop-blur-md shadow-2xl max-w-[calc(100%-240px)]"
      >
        {/* All Panorama Button */}
        <button
          id="tab-segment-all"
          onClick={() => handleSelectSegment('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeSegmentId === 'all'
              ? 'bg-gradient-to-r from-[#20cfff] to-[#3a86ff] text-[#090d18] font-bold shadow-[0_0_12px_rgba(32,207,255,0.4)] scale-105'
              : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>全结肠全景</span>
        </button>

        <div className="h-4 w-[1px] bg-[#1e2f57]"></div>

        {/* 8 Specific Segments strictly ordered anatomically */}
        {COLON_SEGMENTS.map((seg) => {
          const isActive = activeSegmentId === seg.id;
          return (
            <button
              key={seg.id}
              id={`tab-segment-${seg.id}`}
              onClick={() => handleSelectSegment(seg.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'text-[#090d18] font-bold shadow-lg scale-105 ring-1 ring-white/50'
                  : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
              }`}
              style={{
                backgroundColor: isActive ? seg.hexColor : undefined,
                boxShadow: isActive ? `0 0 16px ${seg.hexColor}cc` : undefined,
              }}
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ 
                  backgroundColor: seg.hexColor,
                  boxShadow: isActive ? `0 0 6px #fff` : undefined
                }}
              />
              <span>{seg.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Right: Collapsible Live Microbiome Digital Twin HUD Stats */}
      <div id="gut-hud-stats" className="absolute bottom-3 right-3 z-10 rounded-lg bg-[#091127]/95 border border-[#2b4170]/70 backdrop-blur-md text-xs shadow-2xl pointer-events-auto transition-all">
        {isHudCollapsed ? (
          <button
            onClick={() => setIsHudCollapsed(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#20cfff] hover:text-[#eef4ff] font-medium"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>实时生理参数</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="p-3 min-w-[210px]">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#1e2f57]">
              <div>
                <span className="font-semibold text-[#eef4ff] flex items-center gap-1.5 text-xs">
                  <Activity className="w-3.5 h-3.5 text-[#20cfff]" />
                  微生态孪生参数
                </span>
                {patient && (
                  <span className="text-[10px] text-[#8996b8] block">
                    受体: <span className="text-[#eef4ff] font-medium">{patient.name}</span> ({patient.primaryDiagnosis.split(' ')[0]})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  currentMode === 'dysbiosis' ? 'bg-[#ff536c]/20 text-[#ff536c]' : 'bg-[#23e6b1]/20 text-[#23e6b1]'
                }`}>
                  {currentMode === 'dysbiosis' ? '失衡态' : '重构稳态'}
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
                  {currentMode === 'dysbiosis' 
                    ? `${(patient?.microbiomeSummary?.shannonDiversity ?? 2.15).toFixed(2)} ↓` 
                    : '4.65 ↑'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>失衡度评分 (Dysbiosis):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis' 
                    ? `${patient?.adaptability?.dysbiosisScore ?? 72} / 100` 
                    : '15 / 100'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>供体菌定植率 (Engraftment):</span>
                <span className="font-mono font-bold text-[#20cfff]">
                  {currentMode === 'dysbiosis' 
                    ? (patient?.currentPhase === '随访监测期' ? '78.0%' : '0.0%') 
                    : '84.2%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>黏膜炎症负荷 (FC):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis' 
                    ? `${patient?.clinicalMarkers?.fecalCalprotectin?.value ?? 632} μg/g` 
                    : '36 μg/g (正常)'}
                </span>
              </div>
            </div>

            {/* Microbe Legend */}
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
    </div>
  );
};
