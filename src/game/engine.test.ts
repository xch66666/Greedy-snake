// ============================================================
// engine.test.ts —— 引擎集成测试（mock rAF 手动推进时间）
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SnakeEngine } from "./engine"
import { registerMap, registerTheme } from "./maps"
import type { Direction, GameEvent, MapData, Theme } from "./core/types"

// 测试专用空地图（无障碍，便于精确控制路径）
const testVoidMap: MapData = {
  id: "test-void",
  name: "测试空地图",
  grid: { w: 48, h: 36 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [],
  entities: [],
  dynamicObstacles: [],
  themeId: "test-theme",
  decorSeed: 1,
}
const testVoidTheme: Theme = {
  id: "test-theme",
  palette: {
    bg: "#000000", grid: "#111111", border: "#222222", accent: "#ffffff",
    food: "#ffffff", snakeA: "#ffffff", snakeB: "#ffffff",
    obstacle: "#ffffff", outline: "#000000", uiText: "#ffffff",
  },
  shadow: { offset: 4, color: "#000000" },
  radius: 4,
  texture: { base: "gradient", dither: false, ao: 0 },
  bgDecor: [],
  parallax: { layers: 3, depth: 1 },
  obstacleStyle: "prism",
  snakeStyle: { pattern: "block", head: "robot" },
  anim: { eatParticle: "shard", dur: 300 },
  foodStyle: "energy",
  audio: { bgm: { tempo: 100, scale: "C-major" }, ambient: "pulse" },
}

let rafCbs: ((ts: number) => void)[] = []
let rafId = 0

beforeEach(() => {
  rafCbs = []
  rafId = 0
  registerMap(testVoidMap)
  registerTheme(testVoidTheme)
  vi.stubGlobal("requestAnimationFrame", (cb: (ts: number) => void) => {
    rafCbs.push(cb)
    return ++rafId
  })
  vi.stubGlobal("cancelAnimationFrame", () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** 手动推进仿真时间（模拟多次 rAF 回调） */
function advance(engine: SnakeEngine, seconds: number): void {
  const steps = Math.ceil((seconds * 1000) / 16.67)
  let ts = 16.67
  for (let i = 0; i < steps; i++) {
    const cb = rafCbs.shift()
    if (!cb) break
    cb(ts)
    ts += 16.67
  }
  void engine
}

/** 越过 3 秒开局倒计时（docs/13 第 2 点） */
function skipCountdown(engine: SnakeEngine): void {
  advance(engine, 3.5)
}

/**
 * 推进时间并让 P2 绕圈存活（每 1.0s 逻辑时间顺时针转向 90°）。
 * 空地图 16×12：left 6 格 → up 6 格 → right 6 格 → down 6 格，循环不撞墙。
 */
function makeP2Circle() {
  const dirs: Direction[] = ["up", "right", "down", "left"]
  let idx = 0
  let lastTurn = 0
  return (engine: SnakeEngine, seconds: number): void => {
    const target = engine.getView().elapsed + seconds
    let ts = 0
    let guard = 0
    while (engine.getView().elapsed < target && guard++ < 20000) {
      const cb = rafCbs.shift()
      if (!cb) break
      ts += 16.67 // 递增时间戳，避免 Date.now() 同毫秒 dt=0 的坑
      cb(ts)
      while (engine.getView().elapsed - lastTurn >= 1.0) {
        engine.setDir(2, dirs[idx % 4])
        idx++
        lastTurn += 1.0
      }
    }
  }
}

describe("SnakeEngine", () => {
  it("start 后进入 playing，生成 1 个食物", () => {
    const engine = new SnakeEngine()
    const events: GameEvent[] = []
    engine.on((e) => events.push(e))
    engine.start("jungle", "solo", "normal")
    expect(engine.getView().state).toBe("playing")
    expect(engine.getView().foods).toHaveLength(1)
    expect(events.some((e) => e.type === "state" && e.state === "playing")).toBe(true)
    engine.destroy()
  })

  it("吃食物：分数增加 + 连击 + 事件", () => {
    const engine = new SnakeEngine()
    engine.start("jungle", "solo", "normal")
    skipCountdown(engine) // 越过 3 秒倒计时
    // 蛇在 (2,2) 朝右，把食物放到前方
    const view = engine.getView()
    const head = view.snakes[0].body[0]
    engine.debugPlaceFood({ x: head.x + 2, y: head.y })
    const events: GameEvent[] = []
    engine.on((e) => events.push(e))
    advance(engine, 1)
    const ev = events.filter((e) => e.type === "score")
    expect(ev.length).toBeGreaterThan(0)
    expect(engine.getView().scores[1]).toBeGreaterThan(0)
    engine.destroy()
  })

  it("单人撞墙 → gameover", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "solo", "normal")
    const events: GameEvent[] = []
    engine.on((e) => events.push(e))
    // 出生 (2,2) 朝右；转向朝上一直走撞顶墙（y=-1）
    engine.setDir(1, "up")
    advance(engine, 6)
    expect(engine.getView().state).toBe("gameover")
    expect(events.some((e) => e.type === "gameover")).toBe(true)
    expect(events.some((e) => e.type === "death")).toBe(true)
    engine.destroy()
  })

  it("双人：一条死 → 幽灵 → 10 秒后复活带保护期", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "coop", "normal")
    const events: GameEvent[] = []
    engine.on((e) => events.push(e))
    const circle = makeP2Circle()
    engine.setDir(1, "up")
    circle(engine, 4) // 3s 倒计时 + P1 撞墙 → ghost，P2 绕圈存活
    expect(engine.getView().snakes[0].phase).toBe("ghost")
    expect(engine.getView().state).toBe("playing")
    circle(engine, 9.6) // 复活于 ~13.5s（3.5 撞墙 + 10s），保护期 15.5s 内断言
    const s1 = engine.getView().snakes[0]
    expect(s1.phase).toBe("invincible")
    // 复活保留一半长度（docs/13 第 2 点）：初始 3 节 → ceil(3/2)=2 节
    expect(s1.body.length).toBe(2)
    expect(events.some((e) => e.type === "revive" && e.player === 1)).toBe(true)
    expect(events.some((e) => e.type === "reviveCountdown" && e.player === 1)).toBe(true)
    engine.destroy()
  })

  it("双人：等待复活期间另一条死 → 当局结束", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "coop", "normal")
    const events: GameEvent[] = []
    engine.on((e) => events.push(e))
    const circle = makeP2Circle()
    engine.setDir(1, "up")
    circle(engine, 4) // P1 于 ~3.5s 撞墙 ghost，P2 绕圈中（此时 dir=up）
    expect(engine.getView().snakes[0].phase).toBe("ghost")
    expect(engine.getView().state).toBe("playing")
    // P2 向左走 45 格撞左墙（约 7.5s）→ 双死
    engine.setDir(2, "left")
    advance(engine, 8)
    expect(engine.getView().state).toBe("gameover")
    expect(events.some((e) => e.type === "gameover")).toBe(true)
    engine.destroy()
  })

  it("pause/resume/restart", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "solo", "normal")
    engine.pause()
    expect(engine.getView().state).toBe("paused")
    engine.resume()
    expect(engine.getView().state).toBe("playing")
    const scoreBefore = engine.getView().scores[1]
    engine.restart()
    expect(engine.getView().state).toBe("playing")
    expect(engine.getView().scores[1]).toBe(scoreBefore) // 分数重置
    engine.destroy()
  })

  it("restart 无双循环：1 秒内蛇只走约 6 格（normal）", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "solo", "normal")
    engine.restart() // 重启时旧循环若未取消会双倍速
    rafCbs.length = 0
    advance(engine, 1)
    const head = engine.getView().snakes[0].body[0]
    // 6 格/秒 → 1 秒后 x≈8（2+6）；双循环会 x≈14 撞墙前
    expect(head.x).toBeGreaterThanOrEqual(2)
    expect(head.x).toBeLessThan(11)
    engine.destroy()
  })

  it("难度影响速度：hard 比 casual 1 秒多走 4 格（8 vs 4）", () => {
    const c = new SnakeEngine()
    rafCbs.length = 0 // 先清空再 start（start 会注册新回调）
    c.start("test-void", "solo", "casual")
    skipCountdown(c)
    const c0 = c.getView().snakes[0].body[0].x
    advance(c, 1)
    const casualMove = c.getView().snakes[0].body[0].x - c0
    c.destroy()

    const h = new SnakeEngine()
    rafCbs.length = 0
    h.start("test-void", "solo", "hard")
    skipCountdown(h)
    const h0 = h.getView().snakes[0].body[0].x
    advance(h, 1)
    const hardMove = h.getView().snakes[0].body[0].x - h0
    h.destroy()

    expect(casualMove).toBe(4) // docs/03：casual 4 格/秒
    expect(hardMove).toBe(8) // hard 8 格/秒
  })

  it("食物数量：单人 1 个，双人 3 个（docs/13 第 2 点）", () => {
    const s = new SnakeEngine()
    s.start("test-void", "solo", "normal")
    expect(s.getView().foods).toHaveLength(1)
    s.destroy()
    const c = new SnakeEngine()
    c.start("test-void", "coop", "normal")
    expect(c.getView().foods).toHaveLength(3)
    c.destroy()
  })

  it("gameover 后 restart 可再次游玩", () => {
    const engine = new SnakeEngine()
    engine.start("test-void", "solo", "normal")
    engine.setDir(1, "up")
    advance(engine, 6) // 撞墙 → gameover
    expect(engine.getView().state).toBe("gameover")
    engine.restart()
    expect(engine.getView().state).toBe("playing")
    expect(engine.getView().snakes[0].body[0]).toEqual({ x: 2, y: 2 }) // 回出生点
    engine.destroy()
  })
})
