// ============================================================
// core/scoring.test.ts —— 计分/连击单测（docs/03 第 3 节）
// ============================================================
import { describe, expect, it } from "vitest"
import { applyEat } from "./scoring"
import { COMBO_MAX_MULTIPLIER } from "./constants"

describe("scoring", () => {
  it("第一个食物 10 分，倍数 1", () => {
    const r = applyEat(0, 0)
    expect(r).toEqual({ score: 10, combo: 1, multiplier: 1, points: 10 })
  })

  it("每 5 个连击 +1 倍", () => {
    // 吃第 5 个 → combo=5 → multiplier=2
    let s = 0
    let c = 0
    for (let i = 0; i < 5; i++) {
      const r = applyEat(s, c)
      s = r.score
      c = r.combo
    }
    expect(c).toBe(5)
    expect(applyEat(s, c).multiplier).toBe(2)
    expect(applyEat(s, c).points).toBe(20)
  })

  it("倍数上限 X5", () => {
    let s = 0
    let c = 0
    for (let i = 0; i < 100; i++) {
      const r = applyEat(s, c)
      s = r.score
      c = r.combo
      expect(r.multiplier).toBeLessThanOrEqual(COMBO_MAX_MULTIPLIER)
    }
    expect(applyEat(s, c).multiplier).toBe(COMBO_MAX_MULTIPLIER)
  })

  it("分数累积正确", () => {
    // 4 个食物（x1）+ 第 5 个（x2）：10*4 + 20 = 60
    let s = 0
    let c = 0
    for (let i = 0; i < 5; i++) {
      const r = applyEat(s, c)
      s = r.score
      c = r.combo
    }
    expect(s).toBe(60)
  })
})
