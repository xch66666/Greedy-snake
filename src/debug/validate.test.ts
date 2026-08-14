// ============================================================
// debug/validate.test.ts —— 数据校验器测试（npm run validate）
// ============================================================
import { describe, expect, it } from "vitest"
import { validateAll, validateMap, validateTheme } from "./validate"
import { MAPS, THEMES } from "../game/maps"

describe("数据校验器", () => {
  it("全部地图通过校验", () => {
    for (const m of MAPS) {
      const errors = validateMap(m)
      expect(errors, `${m.id}: ${errors.join("; ")}`).toEqual([])
    }
  })

  it("全部主题通过校验", () => {
    for (const t of THEMES) {
      const errors = validateTheme(t)
      expect(errors, `${t.id}: ${errors.join("; ")}`).toEqual([])
    }
  })

  it("整体校验零错误", () => {
    expect(validateAll()).toEqual([])
  })

  it("地图数量 = 4（docs/09 定案）", () => {
    expect(MAPS).toHaveLength(4)
    expect(THEMES).toHaveLength(4)
  })

  it("检测越界障碍", () => {
    const errors = validateMap({
      ...MAPS[0],
      staticObstacles: [{ x: 99, y: 99 }],
    })
    expect(errors.some((e) => e.includes("越界"))).toBe(true)
  })

  it("检测非法色值", () => {
    const errors = validateTheme({
      ...THEMES[0],
      palette: { ...THEMES[0].palette, bg: "red" },
    })
    expect(errors.some((e) => e.includes("非法色值"))).toBe(true)
  })
})
