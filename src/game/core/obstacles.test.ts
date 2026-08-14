// ============================================================
// core/obstacles.test.ts —— 动态障碍位置单测（docs/02 第 6 节）
// ============================================================
import { describe, expect, it } from "vitest"
import { obstacleActiveCells, obstacleCell } from "./obstacles"
import type { DynamicObstacle } from "./types"

function makeMap(obs: DynamicObstacle[]) {
  return {
    id: "t", name: "t", grid: { w: 16, h: 12 }, spawn: { x: 1, y: 1 },
    staticObstacles: [], dynamicObstacles: obs, themeId: "t", decorSeed: 1,
  }
}

describe("obstacles", () => {
  it("pulse 始终占原格", () => {
    const o: DynamicObstacle = { cell: { x: 3, y: 3 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 0 } }
    expect(obstacleCell(o, 0)).toEqual({ x: 3, y: 3 })
    expect(obstacleCell(o, 1.3)).toEqual({ x: 3, y: 3 })
  })

  it("gate 周期开合：开 1.5s 不占格，关时占格", () => {
    const o: DynamicObstacle = { cell: { x: 5, y: 5 }, motion: "gate", params: { range: 0, speed: 4, phase: 0 } }
    // t=0 开（不占格）
    expect(obstacleCell(o, 0).x).toBe(-1)
    // t=2（关闭段）占格
    expect(obstacleCell(o, 2)).toEqual({ x: 5, y: 5 })
    // t=4 回到开
    expect(obstacleCell(o, 4).x).toBe(-1)
  })

  it("patrol 在 cell 与 target 间往返", () => {
    const o: DynamicObstacle = {
      cell: { x: 3, y: 7 }, motion: "patrol",
      params: { range: 2, speed: 5, phase: 0 }, target: { x: 3, y: 5 },
    }
    expect(obstacleCell(o, 0).y).toBe(7)
    expect(obstacleCell(o, 2.5).y).toBe(5) // 半周期到另一端
    expect(obstacleCell(o, 5).y).toBe(7) // 整周期回来
  })

  it("drift 水平正弦 ±range 内", () => {
    const o: DynamicObstacle = { cell: { x: 10, y: 3 }, motion: "drift", params: { range: 3, speed: 6, phase: 0 } }
    const cells = new Set<number>()
    for (let t = 0; t < 12; t += 0.5) {
      const c = obstacleCell(o, t)
      expect(Math.abs(c.x - 10)).toBeLessThanOrEqual(3)
      expect(c.y).toBe(3)
      cells.add(c.x)
    }
    expect(cells.size).toBeGreaterThan(1) // 确实在动
  })

  it("activeCells 汇总正确", () => {
    const map = makeMap([
      { cell: { x: 3, y: 3 }, motion: "pulse", params: { range: 0, speed: 1, phase: 0 } },
      { cell: { x: 5, y: 5 }, motion: "gate", params: { range: 0, speed: 4, phase: 0 } },
    ])
    const active = obstacleActiveCells(map, 2) // gate 关闭中
    expect(active.has("3,3")).toBe(true)
    expect(active.has("5,5")).toBe(true)
    const active2 = obstacleActiveCells(map, 0) // gate 开启中
    expect(active2.has("3,3")).toBe(true)
    expect(active2.has("5,5")).toBe(false)
  })
})
