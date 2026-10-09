import { useCallback, useEffect, useState } from 'react';
import {
  applyDisplayMode,
  loadDisplayMode,
  saveDisplayMode,
  type DisplayMode,
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

  const toggle = useCallback((key: keyof DisplayMode) => {
    setMode((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return { mode, toggle };
}
