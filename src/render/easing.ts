// ============================================================
// render/easing.ts —— 缓动函数库（docs/02 1.4：弹入 easeOutBack、淡入淡出 easeOutQuad）
// ============================================================

/** easeOutQuad：淡入淡出用 */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/** easeInQuad */
export function easeInQuad(t: number): number {
  return t * t
}

/** easeOutCubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** easeOutBack：UI 弹入（docs/02 1.3） */
export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** easeInOutSine：装饰浮动/呼吸 */
export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/** 线性 */
export function linear(t: number): number {
  return t
}

/** 时钟工具：归一化周期相位 0..1（period 秒，phase 0..1 偏移） */
export function cyclePhase(t: number, period: number, phase = 0): number {
  if (period <= 0) return 0
  return ((t / period + phase) % 1 + 1) % 1
}

/** 三角波 0..1（来回） */
export function triangleWave(t: number, period: number, phase = 0): number {
  const p = cyclePhase(t, period, phase)
  return 1 - Math.abs(2 * p - 1)
}

/** 夹取 */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
