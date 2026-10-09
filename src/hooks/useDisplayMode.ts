import { useCallback, useEffect, useState } from 'react';
import {
  applyDisplayMode,
  loadDisplayMode,
  nextBackground,
  saveDisplayMode,
  type DisplayMode,
  type DisplayToggleKey,
} from '../utils/displayMode';

/**
 * 显示档位的读写。
 *
 * 初始值直接从 localStorage 取（懒初始化，不是先默认再 effect 修正），
 * 避免首帧闪一下标准档。main.tsx 里还会在 React 挂载前先应用一次，
 * 保证连首帧都不会错。
 */
export function useDisplayMode() {
  const [mode, setMode] = useState<DisplayMode>(loadDisplayMode);

  useEffect(() => {
    applyDisplayMode(mode);
    saveDisplayMode(mode);
  }, [mode]);

  /** 整体开关（高对比 / 大字号）。 */
  const toggle = useCallback((key: DisplayToggleKey) => {
    setMode((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /** 背景是多选一，不是开关 —— 单独给一个动作，避免把 keyof 用成字符串下标。 */
  const cycleBackground = useCallback(() => {
    setMode((prev) => ({ ...prev, background: nextBackground(prev.background) }));
  }, []);

  return { mode, toggle, cycleBackground };
}
