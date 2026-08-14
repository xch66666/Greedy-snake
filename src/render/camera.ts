// ============================================================
// render/camera.ts —— 整数倍缩放与相机（docs/02 第 2 节）
// 地图 48×36，视野 24×18 格（384×288），相机平滑跟随蛇
// ============================================================

export const CELL = 16 // 格子像素（内部低分辨率；16px 与星露谷 tile 同规格，细节容量最大）

/** 视野尺寸（格）——地图扩大 2 倍后滚动视野，docs/11 */
export const VIEW_W = 24
export const VIEW_H = 18
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

/** 相机边界 clamp（视野不超出地图） */
export function clampCam(camX: number, camY: number, mapPxW: number, mapPxH: number): { x: number; y: number } {
  const maxX = Math.max(0, mapPxW - VIEW_PX_W)
  const maxY = Math.max(0, mapPxH - VIEW_PX_H)
  return {
    x: Math.min(Math.max(0, camX), maxX),
    y: Math.min(Math.max(0, camY), maxY),
  }
}
