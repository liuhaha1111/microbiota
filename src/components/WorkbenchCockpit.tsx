import React from 'react';
import { FmtTwinStage } from './FmtTwinStage';
import { ScreenSlotBadge } from './ui';

/**
 * 屏 1 · 工作台驾驶舱
 *
 * 本屏已整屏移交给 **FMT 临床全链路与微生态定植 3D 推演系统**（FmtTwinStage）。
 *
 * 为什么整屏、而不是塞进原来的三栏中栏：
 *   推演系统自带三段式版面 —— 标题栏 / （3D 视口 2:1 循证面板）/ 五阶段步骤条，
 *   它本身就是一个完整应用，不是一块可以塞进格子的卡片。挂进 32:9 三栏的中栏后，
 *   中栏在 5120 上只有约 1700px，它的循证面板被压到 ~570px，读数条当场截断
 *   （「区间 70%–86%」这类末位数字会被 overflow-hidden 吃掉）。
 *   整屏铺开才能维持 2:1 的视口/面板配比，也才对得起 32:9 这条带鱼屏。
 *
 * 版面之外的两处改动：
 *   ① 屏位徽章从 ContextBar 挪进推演系统标题栏（slotBadge 插槽）——
 *      多屏部署下每块屏必须自我标识，这是布局级信息，不能因为换了承载组件就丢；
 *   ② 推演系统根节点**不再**挂 .viewport-dark。深色只保留在 three.js 画布内部
 *      （画布自己绘制 0x0a1020 场景底色），标题栏 / 循证面板 / 步骤条走浅色令牌，
 *      与其余四屏一致。
 *
 * 已迁出本屏的内容（**不要加回来**）：
 *   - 3D 大肠解剖结构图（ThreeGutDigitalTwin）→ 屏 2「菌群画像」切面的
 *     「肠道解剖孪生」视图。它表达的是「该受体在哪个肠段失衡」，属患者个体画像，
 *     与生态网络、丰度表是同一份数据的三种画法，留在工作台是错位。
 *   - 患者队列 / 医师负荷 / 供体池 / 菌液批次 / 筛查漏斗共 9 块运营面板
 *     → 随整屏移交一并退出本屏。组件与数据仍保留在
 *     `components/workbench/*` 与 `data/platformOps.ts`（当前无引用），
 *     需要时可挂到其它屏或启动台。
 */

interface WorkbenchCockpitProps {
  /** 当前受体病例。推演系统当前按「演示数据 · 非诊疗用途」运行，暂不消费该病例。 */
  currentPatient?: unknown;
}

export const WorkbenchCockpit: React.FC<WorkbenchCockpitProps> = () => (
  <div id="workbench-cockpit-container" className="h-full min-h-[720px]">
    <FmtTwinStage slotBadge={<ScreenSlotBadge slot={1} />} />
  </div>
);
