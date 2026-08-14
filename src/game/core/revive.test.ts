// ============================================================
// core/revive.test.ts —— 双人复活规则单测（docs/03 第 5.3 节）
// ============================================================
import { describe, expect, it } from "vitest"
import { safeRespawnCell, updateRevive } from "./revive"
import { mulberry32 } from "./food"
import { createSnake } from "./snake"

const rng = mulberry32(42)

describe("revive", () => {
  it("幽灵倒计时结束 → 进入待复活列表", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    s.phase = "ghost"
    s.phaseTimer = 10
    const { revive, gameOver } = updateRevive([s], 9)
    expect(revive).toHaveLength(0)
    expect(gameOver).toBe(false)
    const r2 = updateRevive([s], 1.5)
    expect(r2.revive).toContain(s)
    expect(s.phase).toBe("ghost") // 引擎负责放置
  })

  it("保护期倒计时结束 → alive", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    s.phase = "invincible"
    s.phaseTimer = 2
    updateRevive([s], 2)
    expect(s.phase).toBe("alive")
  })

  it("双死 → gameOver（等待期间另一条也死）", () => {
    const a = createSnake(1, { x: 5, y: 5 }, "right")
    const b = createSnake(2, { x: 10, y: 10 }, "left")
    a.phase = "ghost"
    a.phaseTimer = 8
    b.phase = "ghost"
    b.phaseTimer = 10
    const { gameOver } = updateRevive([a, b], 0.1)
    expect(gameOver).toBe(true)
  })

  it("单条幽灵不结束当局", () => {
    const a = createSnake(1, { x: 5, y: 5 }, "right")
    const b = createSnake(2, { x: 10, y: 10 }, "left")
    a.phase = "ghost"
    a.phaseTimer = 8
    const { gameOver } = updateRevive([a, b], 0.1)
    expect(gameOver).toBe(false)
  })

  it("安全复活点：远离占用格", () => {
    const map = {
      id: "t", name: "t", grid: { w: 8, h: 8 }, spawn: { x: 1, y: 1 },
      staticObstacles: [], entities: [], dynamicObstacles: [], themeId: "t", decorSeed: 1,
    }
    const s = createSnake(1, { x: 1, y: 1 }, "right")
    const pos = safeRespawnCell(map, [s], new Set(), rng)
    expect(pos).not.toBeNull()
    if (pos) {
      // 复活点不能与蛇身重叠
      expect(s.body.some((c) => c.x === pos.x && c.y === pos.y)).toBe(false)
    }
  })
})
