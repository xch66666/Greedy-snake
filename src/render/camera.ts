// ============================================================
// render/camera.ts —— 整数倍缩放与相机（docs/02 第 2 节）
// 地图 48×36，视野 24×18 格（384×288），相机平滑跟随蛇
// ============================================================

export const CELL = 16 // 格子像素（内部低分辨率；16px 与星露谷 tile 同规格，细节容量最大）

/** 视野尺寸（格）——默认 40×23 宽屏矩形（docs/13：2560×1440 下 scale4 满屏裁剪） */
export const VIEW_W = 40
export const VIEW_H = 23
export const VIEW_PX_W = VIEW_W * CELL
export const VIEW_PX_H = VIEW_H * CELL

/** 计算最佳整数倍（最大整数倍且不超容器，保证像素锐利） */
export function fitScale(
  containerW: number,
  containerH: number,
  internalW: number,
  internalH: number,
): number {
  if (containerW <= 0 || containerH <= 0) return 1
  const s = Math.floor(Math.min(containerW / internalW, containerH / internalH))
  return Math.max(1, s)
}

/**
 * 满屏缩放决策（docs/13 全屏铺满，任何窗口/DPI 都无黑边）：
 * - cover：整数倍铺满（溢出 ≤20% 且不足 ≤5% 时裁剪/微调，像素锐利）
 * - stretch：拉伸铺满（整数倍不可行时，最近邻保持像素感）
 */
export function screenScale(
  containerW: number,
  containerH: number,
  internalW: number,
  internalH: number,
): { scale: number; mode: "cover" | "stretch" } {
  if (containerW <= 0 || containerH <= 0) return { scale: 1, mode: "cover" }
  const fit = Math.min(containerW / internalW, containerH / internalH)
  const ceil = Math.max(1, Math.ceil(fit))
  const overW = (internalW * ceil - containerW) / containerW
  const overH = (internalH * ceil - containerH) / containerH
  // cover 条件：溢出 ≤20%（裁剪），不足 ≤5%（基本贴合）
  if (overW <= 0.2 && overH <= 0.2 && overW >= -0.05 && overH >= -0.05) {
    return { scale: ceil, mode: "cover" }
  }
  // 整数倍无法铺满 → 拉伸铺满（任何窗口都无黑边）
  return { scale: 1, mode: "stretch" }
}

/** 画布内容居中偏移（整数像素，避免抖动） */
export function centerOffset(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): { x: number; y: number } {
  return {
    x: Math.floor((containerW - contentW) / 2),
    y: Math.floor((containerH - contentH) / 2),
  }
}

/** 相机边界 clamp（视野不超出世界；minX/minY 支持负偏移——边界带，docs/13 修复） */
export function clampCam(
  camX: number,
  camY: number,
  mapPxW: number,
  mapPxH: number,
  viewW = VIEW_W,
  viewH = VIEW_H,
  minX = 0,
  minY = 0,
): { x: number; y: number } {
  const maxX = Math.max(minX, mapPxW - viewW * CELL)
  const maxY = Math.max(minY, mapPxH - viewH * CELL)
  return {
    x: Math.min(Math.max(minX, camX), maxX),
    y: Math.min(Math.max(minY, camY), maxY),
  }
}

// ---------- 动态缩放（docs/13：离散两档，窗口恒定满屏） ----------

export const VIEW_ASPECT = VIEW_W / VIEW_H // 40:22 宽屏矩形（docs/13 第 3 点）

/** 全图档视野（整图 48×36，scale 1） */
export const FULL_VIEW_W = 48
export const FULL_VIEW_H = 36

export interface ViewSize {
  w: number
  h: number
}

/**
 * 双人视野档位（docs/13 第 4 版：离散两档，消除窗口收缩与 canvas 每帧 resize）：
 * - 包围盒+边距 ≤ 40 格 → 默认档 40×22（scale2 恒定满屏，与单人同尺寸）
 * - 超出 → 全图档 48×36（scale1，遮罩过渡）
 */
export function calcCoopView(
  boxW: number,
  boxH: number,
  margin = 8,
): ViewSize {
  const needW = Math.max(boxW + margin * 2, (boxH + margin * 2) * VIEW_ASPECT)
  if (needW > VIEW_W) {
    return { w: FULL_VIEW_W, h: FULL_VIEW_H }
  }
  return { w: VIEW_W, h: VIEW_H }
}
