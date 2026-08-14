// ============================================================
// engine.ts —— 固定步长主循环 + 状态机 + 事件发射（docs/04 第 4 节）
// 纯 TS，无 DOM 依赖（可见性暂停由 UI 层调用 pause()）
// ============================================================
import type {
  Cell, Difficulty, Direction, EngineAPI, EngineState, GameEvent, GameMode,
  MapData, PlayerId, SnakeState, Theme,
} from "./core/types"
import { DIFFICULTY_PRESETS, FOOD_COUNT, MAX_ACCUMULATED_MS, TICK_HZ } from "./core/constants"
import { EventBus } from "./core/eventBus"
import { createSnake, enqueueDir, hitsSelf, stepSnake } from "./core/snake"
import { cellKey, generateFood, mulberry32 } from "./core/food"
import { hitsAny, isWall, entityCells, hitsStatic } from "./core/collision"
import { applyEat } from "./core/scoring"
import { updateRevive, INVINCIBLE, randomSafeCell } from "./core/revive"
import { obstacleActiveCells } from "./core/obstacles"
import { getMap, getTheme } from "./maps"

const STEP_MS = 1000 / TICK_HZ

/** 渲染层每帧读取的只读视图（状态不进 React，docs/04 第 3 节） */
export interface EngineView {
  state: EngineState
  map: MapData | null
  theme: Theme | null
  snakes: ReadonlyArray<Readonly<SnakeState>>
  foods: ReadonlyArray<{ x: number; y: number }>
  obstacleCells: ReadonlySet<string> // 当前动态障碍占格
  obstacleT: number // 动态障碍时间（渲染连续位置用）
  /** 开局倒计时剩余秒（0 = 已开始，docs/13 第 2 点） */
  countdown: number
  /** 当前实际移动间隔（秒，含加速；渲染插值用，docs/13） */
  moveInterval: number
  scores: Record<PlayerId, number>
  combos: Record<PlayerId, number>
  mode: GameMode
  difficulty: Difficulty
  elapsed: number
}

export class SnakeEngine implements EngineAPI {
  private bus = new EventBus()
  private map: MapData | null = null
  private theme: Theme | null = null
  private mode: GameMode = "solo"
  private difficulty: Difficulty = "normal"
  private state: EngineState = "idle"

  private snakes: SnakeState[] = []
  private foods: { x: number; y: number }[] = []
  private foodCount = FOOD_COUNT // 单人 1 个，双人 3 个（docs/13 第 2 点）
  private scores: Record<PlayerId, number> = { 1: 0, 2: 0 }
  private combos: Record<PlayerId, number> = { 1: 0, 2: 0 }

  private obstacleT = 0 // 动态障碍时间（秒）
  private elapsed = 0
  private moveTimer = 0
  private lastTs = 0
  private raf = 0
  private acc = 0
  private rng = mulberry32(1)
  private destroyed = false
  private lastCountdownEmit = 0
  private startCountdown = 0 // 开局 3 秒准备（docs/13 第 2 点）

  // 调试开关（F1 面板，docs/06 1.1；生产不打包）
  debugGod = false
  debugNoWall = false
  debugSpeedMul = 1

  // 死亡慢动作（docs/02 3.3 事件反馈链：死亡=碎裂+轻震+0.3s 慢动作）
  private slowmo = 0

  // ---------- EngineAPI ----------

  on(handler: (e: GameEvent) => void): () => void {
    return this.bus.on(handler)
  }

  start(mapId: string, mode: GameMode, difficulty: Difficulty): void {
    // 防双循环：重启前必须取消旧循环（坑：restart 时旧 loop 仍在 rAF 调度中）
    cancelAnimationFrame(this.raf)
    const map = getMap(mapId)
    if (!map) throw new Error(`未知地图: ${mapId}`)
    const theme = getTheme(map.themeId)
    this.map = map
    this.theme = theme ?? null
    this.mode = mode
    this.difficulty = difficulty
    this.rng = mulberry32(map.decorSeed * 31 + 7)

    this.snakes = []
    const spawnP1 = map.spawn
    this.snakes.push(createSnake(1, spawnP1, "right"))
    if (mode === "coop") {
      // P2 出生在镜像角落（docs/09 通用约定）
      this.snakes.push(createSnake(2, { x: map.grid.w - 3, y: map.grid.h - 3 }, "left"))
    }
    this.scores = { 1: 0, 2: 0 }
    this.combos = { 1: 0, 2: 0 }
    this.foods = []
    this.foodCount = mode === "coop" ? 3 : 1 // 双人 3 果（docs/13）
    this.obstacleT = 0
    this.elapsed = 0
    this.moveTimer = 0
    this.acc = 0
    this.lastTs = 0
    this.destroyed = false
    this.startCountdown = 3 // 3 秒准备时间（docs/13 第 2 点）

    this.respawnFood()
    this.setState("playing")
    this.raf = requestAnimationFrame(this.loop)
  }

  pause(): void {
    if (this.state !== "playing") return
    this.setState("paused")
  }

  resume(): void {
    if (this.state !== "paused") return
    this.lastTs = 0 // 防恢复后 delta 爆炸
    this.setState("playing")
    this.raf = requestAnimationFrame(this.loop)
  }

  restart(): void {
    if (!this.map) return
    this.start(this.map.id, this.mode, this.difficulty)
  }

  destroy(): void {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.bus.clear()
    this.state = "idle"
    this.map = null
  }

  // ---------- 对外命令 ----------

  setDir(player: PlayerId, dir: Direction): void {
    const s = this.snakes.find((x) => x.player === player)
    if (s && this.state === "playing") enqueueDir(s, dir)
  }

  /** 调试/测试用：在指定格放置食物（F1 面板"刷食物"，docs/06 1.1） */
  debugPlaceFood(cell: { x: number; y: number }): void {
    if (!this.map) return
    if (cell.x < 0 || cell.y < 0 || cell.x >= this.map.grid.w || cell.y >= this.map.grid.h) return
    this.foods.push(cell)
  }

  /** 调试用：瞬移蛇头（F1 面板，docs/06 1.1） */
  debugTeleportHead(player: PlayerId, cell: { x: number; y: number }): void {
    const s = this.snakes.find((x) => x.player === player)
    if (!s || !this.map) return
    if (cell.x < 0 || cell.y < 0 || cell.x >= this.map.grid.w || cell.y >= this.map.grid.h) return
    s.body[0] = { ...cell }
  }

  getView(): EngineView {
    return {
      state: this.state,
      map: this.map,
      theme: this.theme,
      snakes: this.snakes,
      foods: this.foods,
      obstacleCells: this.map ? obstacleActiveCells(this.map, this.obstacleT) : new Set<string>(),
      obstacleT: this.obstacleT,
      countdown: this.startCountdown,
      moveInterval: 1 / this.currentSpeed(),
      scores: this.scores,
      combos: this.combos,
      mode: this.mode,
      difficulty: this.difficulty,
      elapsed: this.elapsed,
    }
  }

  // ---------- 内部 ----------

  private setState(s: EngineState): void {
    this.state = s
    this.bus.emit({ type: "state", state: s })
  }

  private loop = (ts: number): void => {
    if (this.destroyed) return
    if (this.state !== "playing") return
    if (this.lastTs === 0) this.lastTs = ts
    let dt = ts - this.lastTs
    this.lastTs = ts
    if (dt > 0) {
      this.acc += Math.min(dt, MAX_ACCUMULATED_MS)
      while (this.acc >= STEP_MS) {
        this.acc -= STEP_MS
        this.tickLogic(STEP_MS / 1000)
        if (this.state !== "playing") break
      }
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  private currentSpeed(): number {
    const preset = DIFFICULTY_PRESETS[this.difficulty]
    const eaten = Math.max(this.combos[1], this.combos[2])
    const steps = Math.floor(eaten / preset.accelPerFood)
    return Math.min(preset.initialSpeed + steps * preset.accelStep, preset.maxSpeed) * this.debugSpeedMul
  }

  private tickLogic(dt: number): void {
    if (this.state !== "playing") return
    // 开局 3 秒准备：蛇锁定不动（docs/13 第 2 点），障碍/装饰时间继续
    if (this.startCountdown > 0) {
      this.startCountdown = Math.max(0, this.startCountdown - dt)
      this.elapsed += dt
      this.obstacleT += dt
      return
    }
    // 死亡慢动作（docs/02 3.3：0.3s 内逻辑时间 ×0.25）
    if (this.slowmo > 0) {
      this.slowmo -= dt
      dt *= 0.25
    }
    this.elapsed += dt
    this.obstacleT += dt

    // 复活/保护期倒计时
    const { gameOver, revive } = updateRevive(this.snakes, dt)
    for (const s of revive) this.doRevive(s)
    if (gameOver) {
      this.finishGame()
      return
    }
    // 倒计时事件（每秒一次）
    for (const s of this.snakes) {
      if (s.phase === "ghost") {
        const remaining = Math.max(0, Math.ceil(s.phaseTimer))
        if (remaining !== this.lastCountdownEmit) {
          this.lastCountdownEmit = remaining
          this.bus.emit({ type: "reviveCountdown", player: s.player, remaining })
        }
      }
    }
    const anyGhost = this.snakes.some((s) => s.phase === "ghost")
    if (!anyGhost) this.lastCountdownEmit = 0

    // 移动（按当前速度的步进间隔）
    const interval = 1 / this.currentSpeed()
    this.moveTimer += dt
    while (this.moveTimer >= interval) {
      this.moveTimer -= interval
      this.stepSnakes()
      if (this.state !== "playing") return
    }
  }

  private stepSnakes(): void {
    const map = this.map
    if (!map) return
    const active = obstacleActiveCells(map, this.obstacleT)

    for (const snake of this.snakes) {
      // 幽灵/复活保护期原地不动（docs/03 5.3 修订：保护期原地无敌闪烁，防"活了就死"）
      if (snake.phase === "ghost") continue
      if (snake.phase === "invincible") {
        // 保护期倒计时（updateRevive 已处理），不移动不判定
        continue
      }
      const willGrow = snake.growPending > 0
      stepSnake(snake)
      const head = snake.body[0]

      // 双人：两蛇互穿不互伤（docs/03 5.1）
      const hitsOther = this.snakes.some(
        (o) => o !== snake && o.body.some((c) => c.x === head.x && c.y === head.y),
      )
      if (hitsOther) continue

      const eatIdx = this.foods.findIndex((f) => f.x === head.x && f.y === head.y)
      if (eatIdx >= 0) {
        this.foods.splice(eatIdx, 1)
        this.eatFood(snake)
        this.respawnFood()
      }

      // 死亡判定：墙 / 障碍 / 自身（调试开关：无敌/穿墙，docs/06 1.1）
      if (this.debugGod) continue
      let reason = ""
      if (isWall(head, map.grid.w, map.grid.h)) {
        if (!this.debugNoWall) reason = "撞墙"
      } else if (hitsAny(map, active, head)) {
        reason = "撞到障碍"
      } else if (hitsSelf(snake, head, willGrow)) {
        reason = "撞到自己"
      }
      if (reason) {
        this.killSnake(snake, reason)
        if (this.state !== "playing") return
      }
    }
  }

  private eatFood(snake: SnakeState): void {
    const { score, combo, multiplier } = applyEat(this.scores[snake.player], this.combos[snake.player])
    this.scores[snake.player] = score
    this.combos[snake.player] = combo
    snake.growPending++
    this.bus.emit({ type: "eat", cell: snake.body[0], player: snake.player })
    this.bus.emit({ type: "score", player: snake.player, score, combo, multiplier })
  }

  private respawnFood(): void {
    const map = this.map
    if (!map) return
    while (this.foods.length < this.foodCount) {
      const occupied = new Set<string>()
      for (const s of this.snakes) for (const c of s.body) occupied.add(cellKey(c))
      for (const f of this.foods) occupied.add(cellKey(f))
      for (const o of map.staticObstacles) occupied.add(cellKey(o))
      for (const k of entityCells(map)) occupied.add(k) // 复合障碍
      for (const k of obstacleActiveCells(map, this.obstacleT)) occupied.add(k)
      const f = generateFood(map.grid.w, map.grid.h, occupied, this.rng)
      if (!f) break // 全满：胜利条件（本期不处理，视为无食物可吃）
      this.foods.push(f)
    }
  }

  private killSnake(snake: SnakeState, reason: string): void {
    if (this.mode === "solo") {
      this.bus.emit({ type: "death", player: snake.player, reason })
      this.finishGame()
      return
    }
    // 双人：进入幽灵等待 + 慢动作反馈
    snake.phase = "ghost"
    snake.phaseTimer = 10
    snake.inputBuffer = []
    this.lastCountdownEmit = 0
    this.slowmo = 0.3 // docs/02 3.3 死亡慢动作
    this.bus.emit({ type: "death", player: snake.player, reason })
  }

  private doRevive(snake: SnakeState): void {
    const map = this.map
    if (!map) return
    const active = obstacleActiveCells(map, this.obstacleT)
    // 随机安全复活点（docs/13 第 2 点：不再固定位置）
    const pos = randomSafeCell(map, this.snakes, active, this.rng)
    if (pos) {
      // 保留死亡前一半长度（docs/13 第 2 点），随机方向向后延伸
      const half = Math.max(1, Math.ceil(snake.body.length / 2))
      const dirs: Direction[] = ["up", "down", "left", "right"]
      const dir = dirs[Math.floor(this.rng() * dirs.length)]
      const body: Cell[] = [pos]
      for (let i = 1; i < half; i++) {
        const c: Cell = {
          x: pos.x - (dir === "left" ? 1 : dir === "right" ? -1 : 0) * i,
          y: pos.y - (dir === "up" ? 1 : dir === "down" ? -1 : 0) * i,
        }
        if (c.x < 0 || c.y < 0 || c.x >= map.grid.w || c.y >= map.grid.h) break
        if (hitsStatic(map, c) || active.has(cellKey(c))) break
        body.push(c)
      }
      snake.body = body
      snake.dir = dir
      snake.nextDir = dir
    }
    snake.inputBuffer = []
    snake.growPending = 0
    snake.phase = "invincible"
    snake.phaseTimer = INVINCIBLE
    this.bus.emit({ type: "revive", player: snake.player })
  }

  private finishGame(): void {
    this.setState("gameover")
    let winner: PlayerId | "draw" | undefined
    if (this.mode === "coop") {
      winner = this.scores[1] === this.scores[2] ? "draw" : this.scores[1] > this.scores[2] ? 1 : 2
    }
    this.bus.emit({ type: "gameover", winner })
    cancelAnimationFrame(this.raf)
  }
}
