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
    // 从地图数据动态取坐标（避免布局更新后测试过期）
    const tree = jungleMap.entities.find((e) => e.kind === "tree")!
    const treeCell = { x: tree.origin.x + tree.shape[0].x, y: tree.origin.y + tree.shape[0].y }
    const wall = jungleMap.entities.find((e) => e.kind === "vinewall")!
    const wallCell = { x: wall.origin.x + wall.shape[0].x, y: wall.origin.y + wall.shape[0].y }
    expect(hitsStatic(jungleMap, treeCell)).toBe(true)
    expect(hitsStatic(jungleMap, wallCell)).toBe(true)
    expect(hitsStatic(jungleMap, { x: 13, y: 16 })).toBe(false)
  })

  it("hitsDynamic：命中动态障碍占格", () => {
    const active = new Set(["6,10"]) // 丛林动态障碍 (6,10) pulse
    expect(hitsDynamic(active, { x: 6, y: 10 })).toBe(true)
    expect(hitsDynamic(active, { x: 5, y: 10 })).toBe(false)
  })

  it("hitsAny：综合判定（墙/静态/动态）", () => {
    const active = new Set(["6,10"])
    const tree = jungleMap.entities.find((e) => e.kind === "tree")!
    const treeCell = { x: tree.origin.x, y: tree.origin.y }
    expect(hitsAny(jungleMap, active, { x: -1, y: 5 })).toBe(true) // 墙
    expect(hitsAny(jungleMap, active, treeCell)).toBe(true) // 实体
    expect(hitsAny(jungleMap, active, { x: 6, y: 10 })).toBe(true) // 动态
    expect(hitsAny(jungleMap, active, { x: 30, y: 20 })).toBe(false) // 空
  })
})
