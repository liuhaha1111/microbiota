/**
 * 显示档位：高对比 / 大字号。
 *
 * 档位状态不放进组件 state，而是落到 <html> 的 data-* 属性上 —— 具体样式由
 * index.css 里的令牌覆盖块负责。这样换档只是重新赋值 CSS 变量：
 *   ① 不触发 React 重渲染，全站一次性生效；
 *   ② three.js 场景、SVG 描边这些不由 React 管理的部分也跟着变。
 *
 * 两个档位互相独立，可同时开启。
 */

export interface DisplayMode {
  /** 提亮文字与描边。用于强光环境或远距离观看。 */
  contrast: boolean;
  /** 全站字号上浮一档。10px 档会抬到 12px。 */
  largeText: boolean;
}

export const DEFAULT_DISPLAY_MODE: DisplayMode = { contrast: false, largeText: false };

const STORAGE_KEY = 'microfmt.displayMode';

/** 读取上次选择。任何异常都退回默认值，不能因为一个坏值让整个应用起不来。 */
export function loadDisplayMode(): DisplayMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DISPLAY_MODE;
    const parsed = JSON.parse(raw) as Partial<DisplayMode>;
    return {
      contrast: parsed.contrast === true,
      largeText: parsed.largeText === true,
    };
  } catch {
    return DEFAULT_DISPLAY_MODE;
  }
}

/** 持久化。隐私模式或配额满时静默失败 —— 本次会话仍然生效，只是下次要重设。 */
export function saveDisplayMode(mode: DisplayMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
  } catch {
    /* ignore */
  }
}

/** 把档位写到根元素上。属性存在与否就是开关本身，不需要额外类名。 */
export function applyDisplayMode(mode: DisplayMode): void {
  const el = document.documentElement;
  if (mode.contrast) el.setAttribute('data-contrast', 'high');
  else el.removeAttribute('data-contrast');
  if (mode.largeText) el.setAttribute('data-size', 'large');
  else el.removeAttribute('data-size');
}
