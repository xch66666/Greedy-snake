// ============================================================
// render/camera.ts —— 整数倍缩放与相机（docs/02 第 2 节）
// 地图 48×36，视野 24×18 格（384×288），相机平滑跟随蛇
// ============================================================

export const CELL = 16 // 格子像素（内部低分辨率；16px 与星露谷 tile 同规格，细节容量最大）

/** 视野尺寸（格）——默认 40×22 宽屏矩形（docs/13：scale2 占满屏幕，窗口恒定） */
export const VIEW_W = 40
export const VIEW_H = 22
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

/** 相机边界 clamp（视野不超出地图；viewW/viewH 为当前视野格数，docs/13 修复） */
export function clampCam(
  camX: number,
  camY: number,
  mapPxW: number,
  mapPxH: number,
  viewW = VIEW_W,
  viewH = VIEW_H,
): { x: number; y: number } {
  const maxX = Math.max(0, mapPxW - viewW * CELL)
  const maxY = Math.max(0, mapPxH - viewH * CELL)
  return {
    x: Math.min(Math.max(0, camX), maxX),
    y: Math.min(Math.max(0, camY), maxY),
  }
}

// ---------- 动态缩放（docs/13：双人距离远时拉远视野） ----------

/** 视野格数范围：最小 26（scale2 内放大），最大 48（整图宽，切 scale1 全图） */
export const MIN_VIEW_W = 26
export const MAX_VIEW_W = 48 // 整图宽（48×36），两蛇任意位置都可见
export const VIEW_ASPECT = VIEW_W / VIEW_H // 40:22 宽屏矩形（docs/13 第 3 点）

export interface ViewSize {
  w: number
  h: number
}

/**
 * 双人动态视野：基于两蛇包围盒计算所需视野。
 * 需要容纳 包围盒 + margin 边距，保持宽屏比例；clamp 到 [MIN, MAX]。
 * 26~40 格区间为 scale2 连续缩放（窗口恒定满屏）；>40 格切 scale1 全图（遮罩过渡）。
 */
export function calcCoopView(
  boxW: number,
  boxH: number,
  margin = 8,
): ViewSize {
  const needW = Math.max(boxW + margin * 2, (boxH + margin * 2) * VIEW_ASPECT)
  const w = Math.min(Math.max(needW, MIN_VIEW_W), MAX_VIEW_W)
  return { w, h: w / VIEW_ASPECT }
}
