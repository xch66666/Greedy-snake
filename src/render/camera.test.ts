// ============================================================
// render/camera.test.ts —— 相机/动态缩放测试（docs/13）
// ============================================================
import { describe, expect, it } from "vitest"
import { MAX_VIEW_W, MIN_VIEW_W, calcCoopView, clampCam, VIEW_ASPECT, VIEW_W } from "./camera"

describe("calcCoopView", () => {
  it("双蛇距离近 → 最小视野附近（margin 8 主导：25.3 格）", () => {
    const v = calcCoopView(3, 3)
    // needW = max(3+16, (3+16)*4/3) = 25.33
    expect(v.w).toBeGreaterThanOrEqual(MIN_VIEW_W)
    expect(v.w).toBeCloseTo(25.33, 0)
    expect(v.h).toBeCloseTo(v.w / VIEW_ASPECT)
  })

  it("双蛇距离远 → 视野拉远（缩小）", () => {
    const v = calcCoopView(30, 10)
    expect(v.w).toBeGreaterThan(MIN_VIEW_W)
    expect(v.h).toBeCloseTo(v.w / VIEW_ASPECT)
  })

  it("保持 4:3 比例", () => {
    const v = calcCoopView(12, 20)
    expect(v.h).toBeCloseTo(v.w / VIEW_ASPECT)
  })

  it("封顶 MAX_VIEW_W（整图）", () => {
    const v = calcCoopView(45, 30)
    expect(v.w).toBe(MAX_VIEW_W)
  })

  it("横向距离主导时按宽度 + margin 双侧（docs/13）", () => {
    const v = calcCoopView(25, 3)
    // 需要 25 + 8*2 = 41 > 最小，按宽度
    expect(v.w).toBe(41)
  })

  it("margin 保证蛇离视野边缘有距离（docs/13 边距修复）", () => {
    const v = calcCoopView(10, 10)
    // needW = max(10+16, (10+16)*4/3) = 34.67（高向主导）
    expect(v.w).toBeCloseTo(26 * VIEW_ASPECT, 0)
  })
})

describe("clampCam", () => {
  it("边界内不动", () => {
    const c = clampCam(100, 50, 768, 576)
    expect(c).toEqual({ x: 100, y: 50 })
  })

  it("超出地图边缘被夹回（默认视野）", () => {
    const c = clampCam(999, -10, 768, 576)
    expect(c.x).toBe(768 - VIEW_W * 16)
    expect(c.y).toBe(0)
  })

  it("大视野（40 格宽）时 clamp 上限更小（docs/13 修复：按当前视野计算）", () => {
    const c = clampCam(999, 999, 768, 576, 40, 30)
    expect(c.x).toBe(768 - 40 * 16)
    expect(c.y).toBe(576 - 30 * 16)
  })

  it("视野大于地图时 clamp 到 0（全图视野）", () => {
    const c = clampCam(100, 100, 768, 576, MAX_VIEW_W, 36)
    expect(c.x).toBe(0)
    expect(c.y).toBe(0)
  })
})
