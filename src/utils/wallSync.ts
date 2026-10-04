import type { ModuleTab } from '../types';

/**
 * 跨屏同步的共享状态。
 *
 * 多屏部署下每块屏是一个独立的浏览器窗口，各自一份 React 运行时，彼此没有
 * 共享内存。这里靠 BroadcastChannel 广播变更，再用 localStorage 存一份快照
 * 给「后加入的窗口」读取——否则新窗口要等到下一次有人操作才会跟上。
 *
 * 两者的作用域都是「同源 + 同一浏览器 profile」。这正是启动器必须让所有窗口
 * 共用一个 user-data-dir 的原因：各窗口用独立 profile 时它们是不同的浏览器
 * 实例，收不到彼此的广播，联动会**静默失效**（不报错，只是不动）。
 */
export interface WallSyncState {
  /** 当前选中的受体病例 id */
  patientId: string;
  /** 已投送的屏位对应的模块集合，只增不减 */
  dispatched: ModuleTab[];
}

/** URL 参数名。带上它打开的窗口才参与跨屏同步。 */
export const WALL_PARAM = 'wall';

/**
 * 读取本窗口所属的多屏会话标识。
 *
 * 只有带 ?wall=<id> 打开的窗口才参与同步。单窗口日常访问不带该参数，行为与
 * 从前完全一致，也不会被上一次演示残留在 localStorage 里的状态污染。
 */
export function readWallSession(search: string = window.location.search): string | null {
  try {
    const value = new URLSearchParams(search).get(WALL_PARAM);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function wallChannelName(session: string): string {
  return `microfmt-wall:${session}`;
}

export function wallStorageKey(session: string): string {
  return `microfmt-wall:${session}:state`;
}

/** 广播能力是否可用。不可用时同步层整体静默降级，不影响单窗口使用。 */
export function isWallSyncSupported(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

export function readWallSnapshot(session: string): WallSyncState | null {
  try {
    const raw = window.localStorage.getItem(wallStorageKey(session));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WallSyncState>;
    if (typeof parsed.patientId !== 'string' || !Array.isArray(parsed.dispatched)) return null;
    return { patientId: parsed.patientId, dispatched: parsed.dispatched as ModuleTab[] };
  } catch {
    return null;
  }
}

export function writeWallSnapshot(session: string, state: WallSyncState): void {
  try {
    window.localStorage.setItem(wallStorageKey(session), JSON.stringify(state));
  } catch {
    /* 隐私模式或配额用尽：忽略。广播通道仍然工作，只是新窗口加入时拿不到快照。 */
  }
}

/**
 * 只比较内容。
 *
 * 远端广播过来的数组每次都是新引用，直接用引用比较会让「状态其实没变」也触发
 * 一次 setState，进而让 App 里的广播 effect 再次发出消息，两块屏之间就会来回
 * 弹射形成无限循环。
 */
export function isSameDispatched(a: readonly ModuleTab[], b: readonly ModuleTab[]): boolean {
  return a.length === b.length && a.every((tab, index) => tab === b[index]);
}

export function isSameWallState(a: WallSyncState, b: WallSyncState): boolean {
  return a.patientId === b.patientId && isSameDispatched(a.dispatched, b.dispatched);
}
