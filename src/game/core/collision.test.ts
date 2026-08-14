// ============================================================
// core/collision.test.ts —— 碰撞判定单测（docs/06 1.3）
// ============================================================
import { describe, expect, it } from "vitest"
import { hitsAny, hitsDynamic, hitsStatic, isWall } from "./collision"
import { jungleMap } from "../maps/jungle"

describe("collision", () => {
  it("isWall：边界判定", () => {
    expect(isWall({ x: -1, y: 0 }, 16, 12)).toBe(true)
    expect(isWall({ x: 0, y: -1 }, 16, 12)).toBe(true)
    expect(isWall({ x: 16, y: 0 }, 16, 12)).toBe(true)
    expect(isWall({ x: 0, y: 12 }, 16, 12)).toBe(true)
    expect(isWall({ x: 0, y: 0 }, 16, 12)).toBe(false)
    expect(isWall({ x: 15, y: 11 }, 16, 12)).toBe(false)
  })

  it("hitsStatic：命中静态障碍", () => {
    // 丛林地图静态障碍 (1,9)
    expect(hitsStatic(jungleMap, { x: 1, y: 9 })).toBe(true)
    expect(hitsStatic(jungleMap, { x: 2, y: 9 })).toBe(false)
  })

  it("hitsDynamic：命中动态障碍占格", () => {
    const active = new Set(["8,9"]) // 丛林动态障碍 (8,9) pulse
    expect(hitsDynamic(active, { x: 8, y: 9 })).toBe(true)
    expect(hitsDynamic(active, { x: 7, y: 9 })).toBe(false)
  })

  it("hitsAny：综合判定（墙/静态/动态）", () => {
    const active = new Set(["8,9"])
    expect(hitsAny(jungleMap, active, { x: -1, y: 5 })).toBe(true) // 墙
    expect(hitsAny(jungleMap, active, { x: 1, y: 9 })).toBe(true) // 静态
    expect(hitsAny(jungleMap, active, { x: 8, y: 9 })).toBe(true) // 动态
    expect(hitsAny(jungleMap, active, { x: 4, y: 4 })).toBe(false) // 空
  })
})
