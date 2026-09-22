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
  Crosshair,
  FileText
} from 'lucide-react';

import { ClinicalPatient } from '../types';
import { getPatientLongitudinalPoints } from '../data/mockMicroFmtData';

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
 * 部位标签的落位策略。
 *
 * 锚点（COLON_SEGMENTS[].pinPosition）是 3D 里的解剖坐标，渲染循环会把它投影成屏幕坐标。
 * 但标签不能压在锚点上——结肠模型本身只占画布中间一小块，标签盖上去会糊住解剖结构。
 * 这里只声明「该往哪一侧让开」，「让开多少」由渲染循环按当前投影出的模型包围盒实时算，
 * 因此容器尺寸变化、窗口缩放、自动旋转都不会让标签脱离模型。
 */
export const PIN_LABEL_PLACEMENT: Record<string, { side: 'left' | 'right' | 'top' | 'bottom' }> = {
  ascending:  { side: 'left' },
  cecum:      { side: 'left' },
  appendix:   { side: 'left' },
  descending: { side: 'right' },
  sigmoid:    { side: 'right' },
  transverse: { side: 'top' },
  rectum:     { side: 'bottom' },
  anal_canal: { side: 'bottom' },
};

/**
 * 给定底色返回可读的前景色。
 * 原先每个标签的激活态文字色是手写的（浅色底配深字、深色底配白字），
 * 8 个部位各写一遍，改配色时极容易漏。这里按相对亮度算一次即可。
 */
function readableOn(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#091020' : '#ffffff';
}

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
  // 默认收起：展开态与右上角信息卡在垂直方向会互相遮挡，收起后 3D 视野更干净，
  // 需要看实时参数时点一下即可展开。
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(true);
  // 默认收起：这张卡宽度占舞台右侧近一半，展开时会把降结肠、乙状结肠整段连同
  // 它们右侧的标签一起盖住。点击任一部位标签会自动展开（见 handleSelectSegment），
  // 看完细节点 × 收起即可回到干净的解剖视图。
  const [showAnatomyCard, setShowAnatomyCard] = useState<boolean>(false);
  const [showPinBadges, setShowPinBadges] = useState<boolean>(true);
  // 默认解剖透视：整体呈半透明玻璃壳体，点击标签后再为对应部位着色
  const [ghostMode, setGhostMode] = useState<boolean>(true);
  const ghostModeRef = useRef<boolean>(true);
  // 悬停段 ID 走 ref：渲染循环只创建一次，靠 state 会读到旧闭包
  const hoveredSegmentIdRef = useRef<string | null>(null);
  // 渲染循环的 effect 只依赖 [currentMode]，因此循环内不能直接读 state——
  // 那样读到的永远是 effect 创建时的旧值。以下三个都改走 ref 同步。
  const activeSegmentIdRef = useRef<string>('all');
  const autoRotateRef = useRef<boolean>(false);

  useEffect(() => {
    ghostModeRef.current = ghostMode;
  }, [ghostMode]);

  useEffect(() => {
    activeSegmentIdRef.current = activeSegmentId;
  }, [activeSegmentId]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // 量取药丸尺寸：投影定位需要知道每个标签的实际宽高才能贴着模型外缘摆放。
  // 字体异步加载会改变宽度，所以挂载后再补量一次。
  useEffect(() => {
    if (!showPinBadges) return;
    const measure = () => {
      COLON_SEGMENTS.forEach((seg) => {
        const el = pinPillElementsRef.current[seg.id];
        if (!el) return;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w > 0 && h > 0) pinSizeRef.current[seg.id] = { w, h };
      });
      measureFreeRect();
    };
    measure();
    const timer = window.setTimeout(measure, 150);
    return () => window.clearTimeout(timer);
  }, [showPinBadges, showAnatomyCard]);

  // Active segment config object
  const activeSegmentConfig = useMemo(() => {
    return COLON_SEGMENTS.find(s => s.id === activeSegmentId) || null;
  }, [activeSegmentId]);

  // Patient clinical analysis for current segment
  const patientNote = useMemo(() => {
    return getPatientSegmentClinicalNote(patient, activeSegmentId);
  }, [patient, activeSegmentId]);

  // 「FMT 重构态」下的真实指标。
  // 取随访时序的最后一点作为重构稳态、首点作为基线。
  // 此前重构态的四个 HUD 指标是写死的（4.65 / 15 / 84.2% / 36），换患者也不变，
  // 与「重构态」的名义不符，也和 3D 里几乎看不出模式差异的问题同源。
  const reconStats = useMemo(() => {
    const pts = patient ? getPatientLongitudinalPoints(patient.id) : [];
    if (pts.length === 0) return null;
    const baseline = pts[0];
    const point = pts[pts.length - 1];
    // 残余失衡度 = 基线失衡度按 Shannon 恢复比例下调，最高削减 80%
    const targetShannon = 4.5;
    const span = Math.max(0.1, targetShannon - baseline.shannonDiversity);
    const recovery = Math.min(1, Math.max(0, (point.shannonDiversity - baseline.shannonDiversity) / span));
    const baseDysbiosis = patient?.adaptability?.dysbiosisScore ?? 72;
    return {
      point,
      baseline,
      shannon: point.shannonDiversity,
      engraftment: point.donorEngraftmentRate,
      fecalCalprotectin: point.fecalCalprotectin,
      scfa: point.scfaSynthesisScore,
      relief: point.symptomReliefPercentage,
      dysbiosisScore: Math.round(baseDysbiosis * (1 - recovery * 0.8))
    };
  }, [patient]);

  // 部位标签的 DOM 引用：标签位置由渲染循环把 3D 锚点投影到屏幕坐标后写入，
  // 不再用硬编码百分比。硬编码时模型只占画布中间约 1/3 宽度，标签却挂在 19%/20% 处，
  // 与模型完全脱节；容器高度一变偏移还会继续放大。
  //
  // 每个标签由三部分组成，各自需要独立的引用：
  //   wrapper —— 锚点坐标系原点，每帧被平移到投影出的屏幕坐标
  //   dot     —— 落在锚点上的圆点（跟着 wrapper 走，无需单独写）
  //   line    —— 从锚点指向药丸的引导线，长度/角度每帧重算
  //   pill    —— 药丸按钮本体，相对锚点做偏移
  const pinElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const pinLineElementsRef = useRef<Record<string, HTMLSpanElement | null>>({});
  const pinPillElementsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  // 药丸尺寸只在挂载/缩放时量一次。每帧读 offsetWidth 会触发强制同步布局，
  // 8 个标签 × 60fps 足够把帧率拖下来。
  const pinSizeRef = useRef<Record<string, { w: number; h: number }>>({});
  // 画布像素尺寸，供投影换算使用（resizeObserver 里同步）
  const stageSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  // 舞台里被浮层占掉的区域：页头工具条、底部图例条、右上角信息卡。
  // 标签若落进这些区域就会被压在浮层下面「凭空消失」，所以先把可用矩形量出来。
  const overlayRef = useRef<HTMLDivElement>(null);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const legendBarRef = useRef<HTMLDivElement>(null);
  const anatomyCardRef = useRef<HTMLDivElement>(null);
  const freeRectRef = useRef<{ left: number; right: number; top: number; bottom: number } | null>(null);

  /**
   * 量出舞台里「还能放标签」的矩形（相对 overlay 的左上角）。
   * 页头工具条压住上沿、图例条压住下沿、信息卡压住右沿——标签落进去就会被盖住，
   * 所以这三个浮层的实测位置直接决定可用边界。全部实测而非写死，
   * 这样图例换行、卡片改宽、面板缩放都不需要回来改常量。
   */
  const measureFreeRect = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const box = overlay.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const next = { left: 4, right: box.width - 4, top: 4, bottom: box.height - 4 };

    const header = headerBarRef.current;
    if (header) {
      const r = header.getBoundingClientRect();
      if (r.height > 0) next.top = Math.max(next.top, r.bottom - box.top + 6);
    }
    const legend = legendBarRef.current;
    if (legend) {
      const r = legend.getBoundingClientRect();
      if (r.height > 0) next.bottom = Math.min(next.bottom, r.top - box.top - 6);
    }
    const card = anatomyCardRef.current;
    if (card) {
      const r = card.getBoundingClientRect();
      if (r.width > 0) next.right = Math.min(next.right, r.left - box.left - 6);
    }
    // 浮层把可用区挤没了（极窄容器）时直接放弃让位，至少保证标签可见
    if (next.right - next.left < 120) next.right = box.width - 4;
    if (next.bottom - next.top < 120) next.bottom = box.height - 4;
    freeRectRef.current = next;
    // 留一个调试锚点：标签落位不对时，直接看这个属性就知道可用区被谁挤小了
    overlay.dataset.freeRect = [next.left, next.top, next.right, next.bottom]
      .map((v) => Math.round(v))
      .join(',');
  };

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const segmentMeshesRef = useRef<Record<string, THREE.Mesh>>({});
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
    stageSizeRef.current = { w: width, h: height };

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
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting System
    // 注意：此前总光强过高（环境 2.6 + 主光 2.2 + 补光 1.2 + 轮廓光 1.6 + 点光 3.0），
    // 叠加 ACES 色调映射后，浅色部位（如降结肠 #f2969d）会被冲成白色。
    // 这里整体下调约 30%，保留层次的同时让解剖本色可读。
    const ambientLight = new THREE.AmbientLight(0x131f3d, 1.8);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainKeyLight.position.set(12, 22, 25);
    scene.add(mainKeyLight);

    const softFillLight = new THREE.DirectionalLight(0x3a86ff, 0.9);
    softFillLight.position.set(-18, -8, 15);
    scene.add(softFillLight);

    const backRimLight = new THREE.DirectionalLight(0x20cfff, 1.1);
    backRimLight.position.set(0, -15, -20);
    scene.add(backRimLight);

    // Dynamic Focused Spotlight that highlights the active segment
    const dynamicSpotLight = new THREE.PointLight(0xffffff, 1.8, 30);
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
    });

    // 7. Continuous Full Colon Curve for Microbial Particle Flow
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

    const progressArray = new Float32Array(particleCount);
    const speedArray = new Float32Array(particleCount);
    const offsetRadiusArray = new Float32Array(particleCount);
    const offsetAngleArray = new Float32Array(particleCount);

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

      const pt = continuousColonCurve.getPointAt(progress);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // PointsMaterial 只认 uniform 的 size，不支持逐顶点 size 属性（旧代码注册的
    // size 缓冲区会被 three.js 静默忽略）。默认点精灵是方块，这里生成一张径向渐变
    // 贴图，让菌群粒子渲染成柔和圆点，而不是截图中那种像素方块。
    const createParticleSprite = (): THREE.CanvasTexture | null => {
      const px = 64;
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const grad = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.65, 'rgba(255,255,255,0.28)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, px, px);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const particleSprite = createParticleSprite();

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.7,
      vertexColors: true,
      map: particleSprite ?? undefined,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    modelGroup.add(particles);

    // 9. Animation & Render Loop
    const clock = new THREE.Clock();
    // 投影复用的临时向量：每帧 8 次投影，避免在循环里反复 new Vector3
    const pinProjectVec = new THREE.Vector3();
    // 量取「1 个模型单位 = 多少屏幕像素」用的两个探针点
    const probeA = new THREE.Vector3();
    const probeB = new THREE.Vector3();

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Slow auto rotate if explicitly toggled by user
      if (autoRotateRef.current && !isDraggingRef.current && modelGroupRef.current) {
        modelRotationRef.current.y += delta * 0.25;
        modelGroupRef.current.rotation.y = modelRotationRef.current.y;
      }

      // Dynamic Segment Glowing Update
      const currentActiveId = activeSegmentIdRef.current;
      const isAll = currentActiveId === 'all';
      const isGhost = ghostModeRef.current;

      COLON_SEGMENTS.forEach((seg) => {
        const mesh = segmentMeshesRef.current[seg.id];
        if (!mesh) return;

        const isSelected = currentActiveId === seg.id;
        const isHovered = hoveredSegmentIdRef.current === seg.id;
        const mat = mesh.material as THREE.MeshPhysicalMaterial;

        if (isSelected) {
          // 选中态：干净的实体着色，无脉冲、无光晕、无定位环
          mat.color.set(seg.baseColor);
          mat.emissive.set(seg.baseColor);
          mat.emissiveIntensity = 0.55;
          mat.opacity = 1.0;
          mat.roughness = 0.3;
          mat.metalness = 0.1;
          mat.clearcoat = 0.6;
          mat.clearcoatRoughness = 0.2;
          mat.specularIntensity = 0.7;
          mat.depthWrite = true;
          mat.side = THREE.DoubleSide;

          // 聚光灯跟随选中段：纯白、固定强度，避免叠加色彩后过曝
          if (dynamicLightRef.current) {
            dynamicLightRef.current.color.set(0xffffff);
            dynamicLightRef.current.position.set(seg.pinPosition.x, seg.pinPosition.y, seg.pinPosition.z + 4);
            dynamicLightRef.current.intensity = 1.4;
          }
        } else if (isGhost) {
          // 解剖透视（未着色）：整体统一为半透明玻璃壳体，不带部位色彩；
          // 悬停时浮现该部位即将被赋予的颜色作为提示，点击后才真正着色。
          // 色调随模式变化：失衡态为冷灰蓝（炎性），重构态转为健康黏膜暖粉，
          // 否则两个模式在 3D 里完全看不出区别。
          if (isHovered) {
            mat.color.set(seg.baseColor).multiplyScalar(0.75);
            mat.emissive.set(seg.baseColor);
            mat.emissiveIntensity = 0.8;
            mat.opacity = 0.34;
          } else {
            mat.color.set(isDysbiosis ? 0x9fb4d4 : 0xe9a6b4).multiplyScalar(0.42);
            mat.emissive.set(isDysbiosis ? 0x2b4a7a : 0x6b2f42);
            mat.emissiveIntensity = 0.55;
            mat.opacity = isDysbiosis ? 0.2 : 0.24;
          }
          mat.roughness = 0.9;
          mat.metalness = 0.0;
          mat.clearcoat = 0.0;
          mat.specularIntensity = 0.15;
          mat.depthWrite = false;
          mat.side = THREE.FrontSide;
        } else if (isAll) {
          // Panoramic view - all segments in their clean, distinct anatomical colors
          // 重构态整体提亮一档，体现黏膜修复后的健康光泽（仍保留各段解剖本色）
          mat.color.set(seg.baseColor);
          mat.emissive.set(seg.baseColor);
          mat.emissiveIntensity = isHovered ? 0.85 : (isDysbiosis ? 0.35 : 0.55);
          mat.opacity = isHovered ? 1.0 : 0.92;
          mat.roughness = isDysbiosis ? 0.25 : 0.32;
          mat.metalness = 0.1;
          mat.clearcoat = 0.85;
          mat.specularIntensity = 1.0;
          mat.depthWrite = true;
          mat.side = THREE.DoubleSide;
        } else {
          // Another segment is selected: dim unselected segments cleanly for maximum contrast
          mat.color.set(seg.baseColor);
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = isHovered ? 0.4 : 0.05;
          mat.opacity = isHovered ? 0.75 : 0.36;
          mat.roughness = 0.55;
          mat.metalness = 0.1;
          mat.clearcoat = 0.85;
          mat.specularIntensity = 1.0;
          mat.depthWrite = true;
          mat.side = THREE.DoubleSide;
        }
      });

      // 全景态下把补光收回中央，避免停留在上一次选中部位
      if (isAll && dynamicLightRef.current) {
        dynamicLightRef.current.color.set(0xffffff);
        dynamicLightRef.current.position.set(0, 0, 8);
        dynamicLightRef.current.intensity = 1.6;
      }

      // Update Microbial Particles Flow
      if (particlesRef.current) {
        // 透视模式下管壁近乎透明，必须压暗粒子，否则叠加发光会糊成一片白
        const pMat = particlesRef.current.material as THREE.PointsMaterial;
        pMat.opacity = isGhost ? 0.22 : 0.6;
        pMat.size = isGhost ? 1.15 : 1.5;

        const pPositions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        // 重构态下菌群已建立稳定定植，流动更快、更活跃；失衡态则迟缓淤滞
        const flowScale = isDysbiosis ? 1 : 1.75;
        for (let i = 0; i < particleCount; i++) {
          progressArray[i] = (progressArray[i] + speedArray[i] * flowScale) % 1.0;
          const pt = continuousColonCurve.getPointAt(progressArray[i]);

          const rad = offsetRadiusArray[i];
          const ang = offsetAngleArray[i] + time * (isDysbiosis ? 0.5 : 0.9);
          const ox = Math.cos(ang) * rad;
          const oz = Math.sin(ang) * rad;

          pPositions[i * 3] = pt.x + ox;
          pPositions[i * 3 + 1] = pt.y;
          pPositions[i * 3 + 2] = pt.z + oz;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // ---- 部位标签跟随 3D 锚点 ----
      // 标签是 DOM，位置在这里逐帧写入：先把 8 个解剖锚点连同各自的管径一起投影成屏幕范围，
      // 得到结肠模型真正占用的矩形；再让每个标签朝合适的一侧贴到模型外缘。
      // 「合适」= 优先本侧；本侧被信息卡 / 图例条挡住时改走负荷最小的可用侧。
      // 这样标签永远紧贴模型、互不压叠，也不会被浮层吃掉。
      const stageW = stageSizeRef.current.w;
      const stageH = stageSizeRef.current.h;
      if (stageW > 0 && stageH > 0) {
        // 每单位长度对应多少屏幕像素：投影 (0,0,0.6) 与 (1,0,0.6) 求差
        probeA.set(0, 0, 0.6);
        modelGroup.localToWorld(probeA);
        probeA.project(camera);
        probeB.set(1, 0, 0.6);
        modelGroup.localToWorld(probeB);
        probeB.project(camera);
        const unitPx = Math.abs((probeB.x - probeA.x) * 0.5 * stageW) || 16;

        const anchorScreen: Record<string, { x: number; y: number; z: number }> = {};
        let modelLeft = Infinity;
        let modelRight = -Infinity;
        let modelTop = Infinity;
        let modelBottom = -Infinity;

        COLON_SEGMENTS.forEach((seg) => {
          pinProjectVec.set(seg.pinPosition.x, seg.pinPosition.y, seg.pinPosition.z);
          modelGroup.localToWorld(pinProjectVec);
          pinProjectVec.project(camera);
          const x = (pinProjectVec.x * 0.5 + 0.5) * stageW;
          const y = (-pinProjectVec.y * 0.5 + 0.5) * stageH;
          anchorScreen[seg.id] = { x, y, z: pinProjectVec.z };
          // 锚点在管中心线上，按该段管径向外扩，才是模型真正的轮廓
          const pad = seg.radius * unitPx;
          modelLeft = Math.min(modelLeft, x - pad);
          modelRight = Math.max(modelRight, x + pad);
          modelTop = Math.min(modelTop, y - pad);
          modelBottom = Math.max(modelBottom, y + pad);
        });
        modelLeft -= 4;
        modelRight += 4;
        modelTop -= 4;
        modelBottom += 4;

        const free = freeRectRef.current ?? { left: 4, right: stageW - 4, top: 4, bottom: stageH - 4 };
        const GAP = 12;
        const OPPOSITE: Record<string, string> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
        // 备选顺序：先同侧，再左右两侧，最后才翻到正对侧（翻正对侧要绕整条模型，线会很长）
        const SIDE_TRIES: Record<string, string[]> = {
          left: ['left', 'right', 'top', 'bottom'],
          right: ['right', 'left', 'top', 'bottom'],
          top: ['top', 'left', 'right', 'bottom'],
          bottom: ['bottom', 'left', 'right', 'top'],
        };

        const buildCandidate = (
          side: string,
          anchor: { x: number; y: number },
          size: { w: number; h: number }
        ) => {
          let x = anchor.x;
          let y = anchor.y;
          if (side === 'left') x = modelLeft - GAP - size.w / 2;
          else if (side === 'right') x = modelRight + GAP + size.w / 2;
          else if (side === 'top') y = modelTop - GAP - size.h / 2;
          else y = modelBottom + GAP + size.h / 2;
          // 夹进可用区域（可用区域已让开页头工具条、图例条与信息卡）
          x = Math.min(Math.max(x, free.left + size.w / 2), free.right - size.w / 2);
          y = Math.min(Math.max(y, free.top + size.h / 2), free.bottom - size.h / 2);
          const clear =
            side === 'left'
              ? x + size.w / 2 <= modelLeft + 2
              : side === 'right'
                ? x - size.w / 2 >= modelRight - 2
                : side === 'top'
                  ? y + size.h / 2 <= modelTop + 2
                  : y - size.h / 2 >= modelBottom - 2;
          const inside =
            x - size.w / 2 >= free.left - 0.5 &&
            x + size.w / 2 <= free.right + 0.5 &&
            y - size.h / 2 >= free.top - 0.5 &&
            y + size.h / 2 <= free.bottom + 0.5;
          return { x, y, clear, inside };
        };

        const load: Record<string, number> = { left: 0, right: 0, top: 0, bottom: 0 };
        const placed: Record<string, { x: number; y: number }> = {};
        const placedSide: Record<string, string> = {};
        const pending: string[] = [];

        // 第一轮：本侧放得下的直接落位
        COLON_SEGMENTS.forEach((seg) => {
          const anchor = anchorScreen[seg.id];
          if (!anchor) return;
          const size = pinSizeRef.current[seg.id] ?? { w: 64, h: 20 };
          const preferred = PIN_LABEL_PLACEMENT[seg.id]?.side ?? 'right';
          const cand = buildCandidate(preferred, anchor, size);
          if (cand.clear && cand.inside) {
            placed[seg.id] = { x: cand.x, y: cand.y };
            placedSide[seg.id] = preferred;
            load[preferred] += 1;
          } else {
            pending.push(seg.id);
          }
        });

        // 第二轮：本侧放不下的（例如右侧被信息卡占掉）改走负荷最小的可用侧
        pending.forEach((id) => {
          const anchor = anchorScreen[id];
          if (!anchor) return;
          const size = pinSizeRef.current[id] ?? { w: 64, h: 20 };
          const preferred = PIN_LABEL_PLACEMENT[id]?.side ?? 'right';
          let bestSide: string | null = null;
          let bestX = 0;
          let bestY = 0;
          let bestScore = Number.POSITIVE_INFINITY;
          SIDE_TRIES[preferred].forEach((side) => {
            const cand = buildCandidate(side, anchor, size);
            if (!cand.clear || !cand.inside) return;
            // 同侧越空越优先；翻到正对侧额外罚一点，避免出现贯穿整条模型的引线
            const score =
              load[side] * 10 + (side === OPPOSITE[preferred] ? 25 : 0) + Math.abs(cand.y - anchor.y) / 1000;
            if (score < bestScore) {
              bestScore = score;
              bestSide = side;
              bestX = cand.x;
              bestY = cand.y;
            }
          });
          if (bestSide) {
            placed[id] = { x: bestX, y: bestY };
            placedSide[id] = bestSide;
            load[bestSide] += 1;
          } else {
            // 四处都放不下（容器极窄）时退回本侧并夹紧，至少保证可见
            const fallback = buildCandidate(preferred, anchor, size);
            placed[id] = { x: fallback.x, y: fallback.y };
            placedSide[id] = preferred;
          }
        });

        // 同侧防重叠：左/右沿纵轴排开，上/下沿横轴排开。
        // 正向压一遍后若越过可用区域下沿，再反向压回来，保证整列仍在可用区域内。
        (['left', 'right', 'top', 'bottom'] as const).forEach((side) => {
          const ids = Object.keys(placed).filter((id) => placedSide[id] === side);
          if (ids.length < 2) return;
          const vertical = side === 'left' || side === 'right';
          const MIN_GAP = 6;
          const items = ids
            .map((id) => {
              const size = pinSizeRef.current[id] ?? { w: 64, h: 20 };
              return { id, pos: vertical ? placed[id].y : placed[id].x, extent: vertical ? size.h : size.w };
            })
            .sort((a, b) => a.pos - b.pos);
          const limitLow = vertical ? free.top : free.left;
          const limitHigh = vertical ? free.bottom : free.right;

          for (let i = 1; i < items.length; i++) {
            const minPos = items[i - 1].pos + items[i - 1].extent / 2 + MIN_GAP + items[i].extent / 2;
            if (items[i].pos < minPos) items[i].pos = minPos;
          }
          const tail = items[items.length - 1];
          if (tail.pos + tail.extent / 2 > limitHigh) {
            tail.pos = limitHigh - tail.extent / 2;
            for (let i = items.length - 2; i >= 0; i--) {
              const maxPos = items[i + 1].pos - items[i + 1].extent / 2 - MIN_GAP - items[i].extent / 2;
              if (items[i].pos > maxPos) items[i].pos = maxPos;
            }
          }
          items.forEach((it) => {
            const clamped = Math.min(Math.max(it.pos, limitLow + it.extent / 2), limitHigh - it.extent / 2);
            if (vertical) placed[it.id].y = clamped;
            else placed[it.id].x = clamped;
          });
        });

        COLON_SEGMENTS.forEach((seg) => {
          const wrapper = pinElementsRef.current[seg.id];
          const anchor = anchorScreen[seg.id];
          const target = placed[seg.id];
          if (!wrapper || !anchor || !target) return;

          // 锚点跑到相机背后（NDC z > 1）时整块藏起来，避免出现镜像的鬼影标签
          const visible = anchor.z <= 1;
          wrapper.style.opacity = visible ? '1' : '0';
          if (!visible) return;

          wrapper.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;

          const dx = target.x - anchor.x;
          const dy = target.y - anchor.y;
          const pill = pinPillElementsRef.current[seg.id];
          if (pill) {
            // 选中态轻微放大。scale 必须写进这条 transform 里——药丸的位置由本行独占，
            // 用 Tailwind 的 scale-110 类会被这里的行内样式直接覆盖掉。
            const scale = currentActiveId === seg.id ? 1.08 : 1;
            pill.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale})`;
          }

          const line = pinLineElementsRef.current[seg.id];
          if (line) {
            const len = Math.max(0, Math.hypot(dx, dy) - 6);
            line.style.width = `${len.toFixed(1)}px`;
            line.style.transform = `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`;
          }
        });
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
          stageSizeRef.current = { w: newW, h: newH };
          measureFreeRect();
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
            hoveredSegmentIdRef.current = segId;
            setHoveredSegment({ id: segId, name: segName });
            domElement.style.cursor = 'pointer';
            return;
          }
        }
        hoveredSegmentIdRef.current = null;
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
      // 释放场景资源：几何体 / 材质 / 贴图。
      // 原先只 dispose 了 renderer，切换 currentMode 重建场景时显存会持续累积。
      scene.traverse((obj: THREE.Object3D) => {
        const meshLike = obj as THREE.Mesh;
        if (meshLike.geometry) meshLike.geometry.dispose();
        const matLike = meshLike.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(matLike)) {
          matLike.forEach((m) => m.dispose());
        } else if (matLike) {
          matLike.dispose();
        }
      });
      particleSprite?.dispose();
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
      <div id="three-gut-header-bar" ref={headerBarRef} className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Anatomical Digital Twin Brand & Pin Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#091127]/90 border border-[#2b4170]/70 backdrop-blur-md pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#20cfff] shadow-[0_0_8px_#20cfff] animate-pulse"></span>
            <span className="text-xs font-bold text-[#eef4ff] tracking-wide">
              大肠解剖结构 · 3D高精孪生
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
            <span>标签</span>
          </button>

          <button
            id="toggle-anatomy-card"
            onClick={() => setShowAnatomyCard(!showAnatomyCard)}
            title={showAnatomyCard ? '收起部位详解卡' : '展开部位详解卡'}
            className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 font-medium ${
              showAnatomyCard ? 'bg-[#20cfff]/20 text-[#20cfff]' : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>详解</span>
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

          {/* 解剖透视 / 彩色实体 显示模式 */}
          <button
            id="ghost-mode-toggle"
            onClick={() => setGhostMode(!ghostMode)}
            title={ghostMode ? '当前为半透明解剖透视，点击切换为彩色实体' : '当前为彩色实体，点击切换为半透明解剖透视'}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              ghostMode
                ? 'bg-[#815cff]/20 text-[#b592ff] border border-[#815cff]/50'
                : 'text-[#8996b8] hover:text-[#eef4ff] hover:bg-[#152347]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {ghostMode ? '解剖透视' : '彩色实体'}
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

      {/* Overlay: Interactive Anatomical Pin Badges */}
      {/* 位置不写死：每帧由渲染循环把 3D 锚点投影成屏幕坐标后写入 transform */}
      {showPinBadges && (
        <div id="anatomical-pin-overlay" ref={overlayRef} className="absolute inset-0 pointer-events-none z-10">
          {COLON_SEGMENTS.map((seg) => {
            const isActive = activeSegmentId === seg.id;
            const onColor = readableOn(seg.hexColor);
            return (
              <div
                key={seg.id}
                ref={(el) => { pinElementsRef.current[seg.id] = el; }}
                className="absolute left-0 top-0 pointer-events-none opacity-0 transition-opacity duration-200"
                style={{ willChange: 'transform' }}
              >
                {/* 锚点圆点：精确落在解剖位置上 */}
                <span
                  className="absolute rounded-full ring-1 ring-white/70"
                  style={{
                    width: 7,
                    height: 7,
                    marginLeft: -3.5,
                    marginTop: -3.5,
                    background: seg.hexColor,
                    boxShadow: `0 0 8px ${seg.hexColor}`
                  }}
                />
                {/* 引导线：从锚点指向药丸，长度与角度由渲染循环写入 */}
                <span
                  ref={(el) => { pinLineElementsRef.current[seg.id] = el; }}
                  className="absolute left-0 top-0 h-px origin-top-left"
                  style={{ background: `${seg.hexColor}b3` }}
                />
                {/* 药丸按钮：相对锚点偏移，避免压住模型 */}
                <button
                  ref={(el) => { pinPillElementsRef.current[seg.id] = el; }}
                  onClick={() => handleSelectSegment(seg.id)}
                  title={`${seg.name} · ${seg.latinName}`}
                  className={`group absolute left-0 top-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border backdrop-blur-sm pointer-events-auto transition-shadow duration-150 ${
                    isActive ? 'ring-2 ring-white/50' : 'hover:brightness-125'
                  }`}
                  style={{
                    color: isActive ? onColor : seg.hexColor,
                    background: isActive ? seg.hexColor : 'rgba(9,17,39,0.88)',
                    borderColor: isActive ? seg.hexColor : `${seg.hexColor}80`,
                    boxShadow: isActive ? `0 0 14px ${seg.hexColor}99` : '0 2px 10px rgba(0,0,0,0.4)'
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                    style={{ background: isActive ? onColor : seg.hexColor }}
                  />
                  <span>{seg.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Hover Indicator on 3D Canvas */}
      {hoveredSegment && (
        <div 
          className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-30 px-3 py-1 rounded-full bg-[#091127]/95 border border-[#20cfff] text-xs text-[#eef4ff] shadow-2xl backdrop-blur-md flex items-center gap-2"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#20cfff]" />
          <span>点击着色: <strong>{hoveredSegment.name}</strong></span>
        </div>
      )}

      {/* Floating Anatomical & Clinical Spotlight Detail Card (Tailored to current patient) */}
      {showAnatomyCard && (
        <div 
          id="segment-anatomy-card"
          ref={anatomyCardRef}
          className="absolute top-14 right-3 z-20 w-84 max-w-[calc(100%-24px)] max-h-[calc(100%-165px)] overflow-y-auto rounded-xl bg-[#091127]/95 border border-[#2b4170] shadow-2xl backdrop-blur-md p-3.5 text-xs animate-in fade-in duration-200"
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

            {/* 模式语境条：明确当前 3D 呈现的是哪个阶段的微生态状态。
                此前信息卡不随模式切换，重构态下仍在展示急性期病理描述。 */}
            <div className={`p-2 rounded border flex items-center justify-between ${
              currentMode === 'dysbiosis'
                ? 'bg-[#210e19] border-[#ff536c]/40'
                : 'bg-[#0c2019] border-[#23e6b1]/40'
            }`}>
              <span className={`font-semibold flex items-center gap-1 ${
                currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'
              }`}>
                <Eye className="w-3 h-3" />
                {currentMode === 'dysbiosis' ? '呈现：治疗前微生态失衡态' : '呈现：FMT 后微生态重构稳态'}
              </span>
              <span className="text-[10px] text-[#8996b8] font-mono">
                {currentMode === 'dysbiosis'
                  ? (reconStats ? `基线 ${reconStats.baseline.date}` : '基线')
                  : (reconStats ? `${reconStats.point.date}` : '随访')}
              </span>
            </div>

            {/* 重构态实测：用随访末段的真实指标，替代原先写死的展示值 */}
            {currentMode === 'reconstruction' && reconStats && (
              <div className="p-2.5 rounded bg-[#0c2019] border border-[#23e6b1]/40 text-[#bff3e2]">
                <span className="text-[10px] font-bold block mb-1 text-[#23e6b1]">
                  重构稳态实测 ({reconStats.point.label}):
                </span>
                <p className="leading-relaxed text-[11px] text-[#eef4ff]">
                  供体菌定植率 {reconStats.engraftment}%，Shannon 多样性 {reconStats.shannon.toFixed(2)}
                  （基线 {reconStats.baseline.shannonDiversity.toFixed(2)}），粪便钙卫蛋白 {reconStats.fecalCalprotectin} μg/g
                  （基线 {reconStats.baseline.fecalCalprotectin} μg/g），SCFA 合成 {reconStats.scfa}/100，
                  症状缓解 {reconStats.relief}%。
                </p>
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
                {currentMode === 'dysbiosis' ? '针对当前受体的病理与浸润评估:' : '基线病理与浸润评估（重构前对照）:'}
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
        ref={legendBarRef}
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

        <div className="h-4 w-[1px] bg-[#1e2f57]"></div>
        <span className="px-1.5 text-[10px] text-[#8996b8] hidden lg:inline">
          点击标签为对应部位着色
        </span>
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
                    : reconStats ? `${reconStats.shannon.toFixed(2)} ↑` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>失衡度评分 (Dysbiosis):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis'
                    ? `${patient?.adaptability?.dysbiosisScore ?? 72} / 100`
                    : reconStats ? `${reconStats.dysbiosisScore} / 100` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>供体菌定植率 (Engraftment):</span>
                <span className="font-mono font-bold text-[#20cfff]">
                  {currentMode === 'dysbiosis'
                    ? (patient?.currentPhase === '随访监测期' ? '78.0%' : '0.0%')
                    : reconStats ? `${reconStats.engraftment}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>黏膜炎症负荷 (FC):</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ff536c]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis'
                    ? `${patient?.clinicalMarkers?.fecalCalprotectin?.value ?? 632} μg/g`
                    : reconStats ? `${reconStats.fecalCalprotectin} μg/g` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#8996b8]">
                <span>SCFA 合成能力:</span>
                <span className={`font-mono font-bold ${currentMode === 'dysbiosis' ? 'text-[#ffb84d]' : 'text-[#23e6b1]'}`}>
                  {currentMode === 'dysbiosis'
                    ? (reconStats ? `${reconStats.baseline.scfaSynthesisScore} / 100` : '—')
                    : reconStats ? `${reconStats.scfa} / 100` : '—'}
                </span>
              </div>
              {reconStats && (
                <div className="pt-1 mt-0.5 border-t border-[#1e2f57]/70 flex justify-between items-center text-[10px] text-[#8996b8]">
                  <span>{currentMode === 'dysbiosis' ? '基线采集' : '随访节点'}</span>
                  <span className="font-mono">
                    {currentMode === 'dysbiosis' ? reconStats.baseline.date : `${reconStats.point.date} · ${reconStats.point.label}`}
                  </span>
                </div>
              )}
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
