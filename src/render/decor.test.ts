// ============================================================
// render/decor.test.ts —— 装饰系统测试（docs/05 第 5 节画质降级）
// ============================================================
import { describe, expect, it } from "vitest"
import { decorDrawCount, generateDecor } from "./decor"
import { jungleMap } from "../game/maps/jungle"
import { jungleTheme } from "../game/themes/jungle"

describe("decor", () => {
  it("装饰实例数在 8~40 范围（docs/02 1.4，用户反馈后下调）", () => {
    const decor = generateDecor(jungleMap, jungleTheme)
    expect(decor.length).toBeGreaterThanOrEqual(8)
    expect(decor.length).toBeLessThanOrEqual(40)
  })

  it("确定性：同 seed 生成相同装饰", () => {
    const a = generateDecor(jungleMap, jungleTheme)
    const b = generateDecor(jungleMap, jungleTheme)
    expect(a).toEqual(b)
  })

  it("画质降级：高=全量，中=减半，低=关闭（docs/05 第 5 节）", () => {
    const decor = generateDecor(jungleMap, jungleTheme)
    const n = decor.length
    expect(decorDrawCount(decor, "high")).toBe(n)
    expect(decorDrawCount(decor, "mid")).toBe(Math.ceil(n / 2))
    expect(decorDrawCount(decor, "low")).toBe(0)
  })
})
