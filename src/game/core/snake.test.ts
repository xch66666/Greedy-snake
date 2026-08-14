// ============================================================
// core/snake.test.ts —— 蛇逻辑单测（docs/06 1.3）
// ============================================================
import { describe, expect, it } from "vitest"
import { createSnake, enqueueDir, hitsSelf, isOpposite, stepSnake } from "./snake"

describe("snake", () => {
  it("创建蛇：长度 3，身体向后延伸", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    expect(s.body).toEqual([{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }])
  })

  it("移动：头部前进一格，尾部收缩", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    stepSnake(s)
    expect(s.body).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }])
  })

  it("增长：growPending 时不移尾", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    s.growPending = 1
    stepSnake(s)
    expect(s.body).toHaveLength(4)
  })

  it("反向忽略：180° 转向被丢弃", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    enqueueDir(s, "left") // 反向
    expect(s.inputBuffer).toHaveLength(0)
    stepSnake(s)
    expect(s.dir).toBe("right")
  })

  it("同向忽略", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    enqueueDir(s, "right")
    expect(s.inputBuffer).toHaveLength(0)
  })

  it("缓冲上限 2 帧，新输入替换旧输入", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    enqueueDir(s, "up")
    enqueueDir(s, "down") // 与 up 反向，忽略
    expect(s.inputBuffer).toHaveLength(1)
    enqueueDir(s, "left")
    expect(s.inputBuffer).toHaveLength(2)
    enqueueDir(s, "down") // 满时替换最后
    expect(s.inputBuffer).toEqual(["up", "down"])
  })

  it("缓冲按帧消费：两步内完成两次转向", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    enqueueDir(s, "up")
    enqueueDir(s, "left")
    stepSnake(s)
    expect(s.dir).toBe("up")
    stepSnake(s)
    expect(s.dir).toBe("left")
  })

  it("hitsSelf：撞自身检测（不含移出尾）", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    // 头 (5,5)，身体 (4,5),(3,5)；新头 (6,5) 不撞
    expect(hitsSelf(s, { x: 6, y: 5 }, false)).toBe(false)
    // 如果身体环回：构造
    const s2 = createSnake(1, { x: 5, y: 5 }, "right")
    s2.body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }]
    expect(hitsSelf(s2, { x: 6, y: 6 }, false)).toBe(false) // 尾部将移出
    expect(hitsSelf(s2, { x: 6, y: 6 }, true)).toBe(true) // 增长时不移出
  })

  it("isOpposite 正确", () => {
    expect(isOpposite("up", "down")).toBe(true)
    expect(isOpposite("left", "right")).toBe(true)
    expect(isOpposite("up", "left")).toBe(false)
  })

  it("幽灵状态不可操作不可移动", () => {
    const s = createSnake(1, { x: 5, y: 5 }, "right")
    s.phase = "ghost"
    enqueueDir(s, "up")
    expect(s.inputBuffer).toHaveLength(0)
    stepSnake(s)
    expect(s.body[0]).toEqual({ x: 5, y: 5 })
  })
})
