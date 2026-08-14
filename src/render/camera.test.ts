// ============================================================
// render/camera.test.ts —— 相机/动态缩放测试（docs/13）
// ============================================================
import { describe, expect, it } from "vitest"
import { MAX_VIEW_W, MIN_VIEW_W, calcCoopView, clampCam, VIEW_ASPECT } from "./camera"

describe("calcCoopView", () => {
  it("双蛇距离近 → 最小视野（放大）", () => {
    const v = calcCoopView(3, 3)
    expect(v.w).toBe(MIN_VIEW_W)
    expect(v.h).toBeCloseTo(MIN_VIEW_W / VIEW_ASPECT)
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

  it("封顶 MAX_VIEW_W", () => {
    const v = calcCoopView(80, 60)
    expect(v.w).toBe(MAX_VIEW_W)
  })

  it("横向距离主导时按宽度", () => {
    const v = calcCoopView(25, 3)
    // 需要 25+5=30 > 最小，按宽度
    expect(v.w).toBe(30)
  })
})

describe("clampCam", () => {
  it("边界内不动", () => {
    const c = clampCam(100, 50, 768, 576)
    expect(c).toEqual({ x: 100, y: 50 })
  })

  it("超出地图边缘被夹回", () => {
    const c = clampCam(999, -10, 768, 576)
    expect(c.x).toBe(768 - 24 * 16)
    expect(c.y).toBe(0)
  })
})
