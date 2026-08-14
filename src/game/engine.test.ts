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
  grid: { w: 16, h: 12 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [],
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
    circle(engine, 2) // P1 撞墙 → ghost，P2 绕圈存活
    expect(engine.getView().snakes[0].phase).toBe("ghost")
    expect(engine.getView().state).toBe("playing")
    circle(engine, 9.9) // 复活于 ~10.5s，保护期到 ~12.5s；断言落在保护期内
    const s1 = engine.getView().snakes[0]
    expect(s1.phase).toBe("invincible")
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
    circle(engine, 2) // P1 ghost，P2 绕圈中（此时 dir=up）
    expect(engine.getView().snakes[0].phase).toBe("ghost")
    expect(engine.getView().state).toBe("playing")
    // P2 向左撞墙（dir=up → left 合法）
    engine.setDir(2, "left")
    advance(engine, 3)
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
})
