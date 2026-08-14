// ============================================================
// core/food.test.ts —— 食物生成单测（docs/03 第 8 节）
// ============================================================
import { describe, expect, it } from "vitest"
import { generateFood, mulberry32 } from "./food"

describe("food", () => {
  it("种子可复现：相同种子生成相同序列", () => {
    const a = generateFood(8, 8, new Set(), mulberry32(123))
    const b = generateFood(8, 8, new Set(), mulberry32(123))
    expect(a).toEqual(b)
  })

  it("不与占用格重叠", () => {
    const occupied = new Set(["0,0", "1,1", "2,2", "3,3"])
    for (let i = 0; i < 50; i++) {
      const f = generateFood(8, 8, occupied, mulberry32(i))
      expect(f).not.toBeNull()
      if (f) expect(occupied.has(`${f.x},${f.y}`)).toBe(false)
    }
  })

  it("全满时返回 null", () => {
    const occupied = new Set<string>()
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) occupied.add(`${x},${y}`)
    expect(generateFood(3, 3, occupied, mulberry32(1))).toBeNull()
  })
})
