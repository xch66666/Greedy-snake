// ============================================================
// render/camera.test.ts —— 相机/视野档位测试（docs/13）
// ============================================================
import { describe, expect, it } from "vitest"
import { VIEW_H, VIEW_W, FULL_VIEW_H, FULL_VIEW_W, calcCoopView, clampCam } from "./camera"

describe("calcCoopView（离散两档，docs/13 第 4 版）", () => {
  it("双蛇距离近 → 默认档 40×22（与单人同尺寸，满屏）", () => {
    const v = calcCoopView(3, 3)
    expect(v).toEqual({ w: VIEW_W, h: VIEW_H })
  })

  it("双蛇距离中等 → 默认档（窗口恒定满屏，不再缩小）", () => {
    const v = calcCoopView(20, 3)
    // needW = max(20+16, (3+16)*1.82=34.6) = 36 ≤ 40 → 默认档
    expect(v.w).toBe(VIEW_W)
  })

  it("横向距离主导时按宽度判断", () => {
    const v = calcCoopView(30, 3)
    // needW = 30+16=46 > 40 → 全图档
    expect(v.w).toBe(FULL_VIEW_W)
  })

  it("双蛇拉远超默认档 → 全图档 48×36", () => {
    const v = calcCoopView(45, 30)
    expect(v).toEqual({ w: FULL_VIEW_W, h: FULL_VIEW_H })
  })

  it("margin 计入需求宽度", () => {
    // boxW 24 + 16 = 40 → 恰好默认档（不大于 40）
    expect(calcCoopView(24, 3).w).toBe(VIEW_W)
    // boxW 25 + 16 = 41 > 40 → 全图
    expect(calcCoopView(25, 3).w).toBe(FULL_VIEW_W)
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

  it("全图档视野时 clamp 到 0", () => {
    const c = clampCam(100, 100, 768, 576, FULL_VIEW_W, FULL_VIEW_H)
    expect(c.x).toBe(0)
    expect(c.y).toBe(0)
  })
})
