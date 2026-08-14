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

  it("hitsStatic：命中静态障碍与复合实体", () => {
    // 丛林地图：静态单格 (12,16) + 复合实体树 tree-0 (4,13) + 藤蔓墙 vinewall-0 (2,8)
    expect(hitsStatic(jungleMap, { x: 12, y: 16 })).toBe(true)
    expect(hitsStatic(jungleMap, { x: 4, y: 13 })).toBe(true) // 树冠格
    expect(hitsStatic(jungleMap, { x: 5, y: 13 })).toBe(true) // 树冠格
    expect(hitsStatic(jungleMap, { x: 2, y: 8 })).toBe(true) // 藤蔓墙
    expect(hitsStatic(jungleMap, { x: 13, y: 16 })).toBe(false)
    expect(hitsStatic(jungleMap, { x: 4, y: 12 })).toBe(false)
  })

  it("hitsDynamic：命中动态障碍占格", () => {
    const active = new Set(["5,7"]) // 丛林动态障碍 (5,7) pulse
    expect(hitsDynamic(active, { x: 5, y: 7 })).toBe(true)
    expect(hitsDynamic(active, { x: 4, y: 7 })).toBe(false)
  })

  it("hitsAny：综合判定（墙/静态/动态）", () => {
    const active = new Set(["5,7"])
    expect(hitsAny(jungleMap, active, { x: -1, y: 5 })).toBe(true) // 墙
    expect(hitsAny(jungleMap, active, { x: 12, y: 16 })).toBe(true) // 静态
    expect(hitsAny(jungleMap, active, { x: 5, y: 7 })).toBe(true) // 动态
    expect(hitsAny(jungleMap, active, { x: 12, y: 8 })).toBe(false) // 空
  })
})
