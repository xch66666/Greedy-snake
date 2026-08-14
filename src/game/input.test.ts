// ============================================================
// game/input.test.ts —— 键盘映射单测（docs/03 第 2 节）
// ============================================================
import { describe, expect, it } from "vitest"
import { keyToControl } from "./input"

describe("keyToControl", () => {
  it("WASD → P1", () => {
    expect(keyToControl("w")).toEqual({ player: 1, dir: "up" })
    expect(keyToControl("a")).toEqual({ player: 1, dir: "left" })
    expect(keyToControl("s")).toEqual({ player: 1, dir: "down" })
    expect(keyToControl("d")).toEqual({ player: 1, dir: "right" })
  })

  it("大写 WASD 同样生效", () => {
    expect(keyToControl("W")).toEqual({ player: 1, dir: "up" })
  })

  it("方向键 → P2", () => {
    expect(keyToControl("ArrowUp")).toEqual({ player: 2, dir: "up" })
    expect(keyToControl("ArrowDown")).toEqual({ player: 2, dir: "down" })
    expect(keyToControl("ArrowLeft")).toEqual({ player: 2, dir: "left" })
    expect(keyToControl("ArrowRight")).toEqual({ player: 2, dir: "right" })
  })

  it("无关按键 → null", () => {
    expect(keyToControl("p")).toBeNull()
    expect(keyToControl("Enter")).toBeNull()
    expect(keyToControl("")).toBeNull()
  })
})
