/**
 * 显示档位：高对比 / 大字号 / 背景质感 / 大光标。
 *
 * 档位状态不放进组件 state，而是落到 <html> 的 data-* 属性上 —— 具体样式由
 * index.css 里的令牌覆盖块负责。这样换档只是重新赋值 CSS 变量：
 *   ① 不触发 React 重渲染，全站一次性生效；
 *   ② three.js 场景、SVG 描边这些不由 React 管理的部分也跟着变。
 *
 * 四个档位互相独立，可同时开启。
 */

/**
 * 背景质感。
 *
 * 都是「偏白 + 老式网站」的路子：纸纹、方格、网点、斜纹、亚麻、横线。
 * 强度一律压到几个百分点（见 index.css 的 --bg-tex-* ），只作质感，
 * 不与正文争视觉 —— 医疗场景里背景一旦有存在感，读数就会变累。
 *
 * 顺序即按钮的循环顺序，第一个是默认的纯色底。
 */
export const BACKGROUNDS = [
  { id: 'plain',    label: '素色',   hint: '纯浅灰蓝底，无纹理' },
  { id: 'paper',    label: '纸纹',   hint: '旧纸张的纤维颗粒' },
  { id: 'grid',     label: '方格',   hint: '坐标纸方格' },
  { id: 'dots',     label: '网点',   hint: '半调网点' },
  { id: 'diagonal', label: '斜纹',   hint: '45° 细斜线' },
  { id: 'linen',    label: '亚麻',   hint: '织物经纬纹' },
  { id: 'ruled',    label: '横线',   hint: '稿纸横线' },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]['id'];

export const DEFAULT_BACKGROUND: BackgroundId = 'plain';

const BACKGROUND_IDS: ReadonlyArray<string> = BACKGROUNDS.map((b) => b.id);

export function backgroundLabel(id: BackgroundId): string {
  return BACKGROUNDS.find((b) => b.id === id)?.label ?? id;
}

export function backgroundHint(id: BackgroundId): string {
  return BACKGROUNDS.find((b) => b.id === id)?.hint ?? '';
}

/** 循环到下一个背景。按钮只有一个，点一次换一种，不弹菜单。 */
export function nextBackground(id: BackgroundId): BackgroundId {
  const i = BACKGROUNDS.findIndex((b) => b.id === id);
  return BACKGROUNDS[(i + 1) % BACKGROUNDS.length].id;
}

export interface DisplayMode {
  /** 提亮文字与描边。用于强光环境或远距离观看。 */
  contrast: boolean;
  /** 全站字号上浮一档。 */
  largeText: boolean;
  /**
   * 大光标。多屏演示时操作者站在屏前一两米外，系统默认的箭头（约 20px）
   * 根本认不出指到哪了。开启后全站换成 48px 的自绘光标。
   */
  largeCursor: boolean;
  /** 页面背景质感。 */
  background: BackgroundId;
}

/** 只能整体开关的档位。`background` 是多选一，走 nextBackground，不在其中。 */
export type DisplayToggleKey = 'contrast' | 'largeText' | 'largeCursor';

export const DEFAULT_DISPLAY_MODE: DisplayMode = {
  contrast: false,
  largeText: false,
  largeCursor: false,
  background: DEFAULT_BACKGROUND,
};

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
      largeCursor: parsed.largeCursor === true,
      // 校验取值：旧版本存的档位、或手改过的 localStorage 都可能在 BACKGROUNDS 之外，
      // 直接塞进 data-bg 会得到一个没有样式的属性，页面看上去像「背景坏了」。
      background:
        typeof parsed.background === 'string' && BACKGROUND_IDS.includes(parsed.background)
          ? (parsed.background as BackgroundId)
          : DEFAULT_BACKGROUND,
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
  if (mode.largeCursor) el.setAttribute('data-cursor', 'large');
  else el.removeAttribute('data-cursor');
  // 素色档不写属性，与「未选择」等价，省掉一条 :root[data-bg="plain"] 规则。
  if (mode.background && mode.background !== DEFAULT_BACKGROUND) {
    el.setAttribute('data-bg', mode.background);
  } else {
    el.removeAttribute('data-bg');
  }
}
