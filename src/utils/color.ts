/**
 * 颜色工具。
 *
 * 背景：原先代码里到处是 `${color}33` 这种「hex 拼 alpha 后缀」的写法。
 * 一旦 color 改成 `var(--color-violet)`，拼出来就是 `var(--color-violet)33` ——
 * 非法值，声明整条失效，底色会直接消失。
 *
 * 所以统一改用 color-mix()：它接受任意合法颜色（含 var()）并按比例混入透明，
 * 语义和原来的 hex 后缀完全一致，但不再要求颜色必须是 6 位 hex。
 *
 * 兼容性：color-mix() 需要 Chrome/Edge 111+，与 Tailwind 4 本身的门槛一致。
 */

/** 按百分比把颜色调成半透明。percent 是「保留多少颜色」，0–100。 */
export function withAlpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

/**
 * hex alpha 后缀 → 百分比。
 * 保留这个映射表是为了让改动可核对：`${c}33` 与 withAlpha(c, 20) 是同一个颜色。
 */
export const ALPHA = {
  '14': 8,
  '1a': 10,
  '1f': 12,
  '22': 13,
  '25': 15,
  '2e': 18,
  '33': 20,
  '3d': 24,
  '55': 33,
  '66': 40,
  '80': 50,
} as const;
