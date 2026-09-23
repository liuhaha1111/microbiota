import {
  LayoutDashboard,
  UserCheck,
  GitMerge,
  LineChart,
  LibraryBig
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleTab } from '../types';

/**
 * 屏位 ↔ 模块 的唯一映射源。
 *
 * 部署前提：5 块物理屏，每块固定承载一个模块，**没有第 6 块屏**。
 * 启动时 5 块屏都显示启动台主屏（`HomeConsole`），点击入口卡后对应屏位才加载模块。
 *
 * 侧边导航与启动台入口卡都从这里取数据——两处各写一份一定会漂移，
 * 屏位编号与模块的对应关系一旦错位，多屏部署下医生会把内容投到错误的屏上。
 */
export interface ScreenSlot {
  /** 物理屏位编号 1..5 */
  slot: number;
  tab: ModuleTab;
  name: string;
  sub: string;
  icon: LucideIcon;
  /** 启动台入口卡上的一句话职责说明 */
  role: string;
}

export const SCREEN_SLOTS: ReadonlyArray<ScreenSlot> = [
  {
    slot: 1,
    tab: 'workbench',
    name: '工作台驾驶舱',
    sub: '3D微生态数字孪生',
    icon: LayoutDashboard,
    role: '肠道微生态三维孪生映射，以及全流程患者队列的阶段分布'
  },
  {
    slot: 2,
    tab: 'patient_center',
    name: '患者精准诊疗',
    sub: '菌群画像与微生态网络',
    icon: UserCheck,
    role: '受体菌群画像、生态网络、功能通路与临床基线'
  },
  {
    slot: 3,
    tab: 'donor_matching',
    name: '供受体智能匹配',
    sub: '六维雷达与精准处方',
    icon: GitMerge,
    role: '供受体六维匹配度演算、菌源批次溯源与移植处方门控'
  },
  {
    slot: 4,
    tab: 'efficacy_tracker',
    name: '疗效与重构监测',
    sub: '四轨时序与再决策',
    icon: LineChart,
    role: '移植后微生态重塑时序追踪与再决策引擎'
  },
  {
    slot: 5,
    tab: 'history_library',
    name: '历史样本参考库',
    sub: '相似病例与方案参考',
    icon: LibraryBig,
    role: '已闭环 FMT 样本的相似度检索与方案对照'
  }
];

/** 屏位总数——启动台用它表达「5 屏待命」 */
export const SCREEN_SLOT_COUNT = SCREEN_SLOTS.length;

export const getScreenSlot = (tab: ModuleTab): ScreenSlot =>
  SCREEN_SLOTS.find(s => s.tab === tab) ?? SCREEN_SLOTS[0];
