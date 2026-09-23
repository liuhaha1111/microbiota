import React from 'react';

interface ScreenSlotBadgeProps {
  /** 物理屏位编号 1..5 */
  slot: number;
}

/**
 * 屏位标识。
 *
 * 多显示器部署下 5 块屏并排摆放，每块屏必须能**自我标识**属于哪个屏位，
 * 否则医生无法判断眼前这块屏承载的是哪一步操作。因此它出现在
 * 每屏常驻上下文栏与启动台入口卡上，是布局级信息而非装饰。
 */
export const ScreenSlotBadge: React.FC<ScreenSlotBadgeProps> = ({ slot }) => (
  <span
    id={`screen-slot-badge-${slot}`}
    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#20cfff] text-[#090d18]"
  >
    屏 {slot}
  </span>
);
