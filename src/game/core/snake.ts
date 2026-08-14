// ============================================================
// core/snake.ts —— 蛇的移动/转向/输入缓冲（纯函数，docs/03 第 2 节）
// ============================================================
import type { Cell, Direction, PlayerId, SnakeState } from "./types"
import { INITIAL_SNAKE_LENGTH, INPUT_BUFFER_MAX } from "./constants"

const DX: Record<Direction, number> = { up: 0, down: 0, left: -1, right: 1 }
const DY: Record<Direction, number> = { up: -1, down: 1, left: 0, right: 0 }

export function isOpposite(a: Direction, b: Direction): boolean {
  return (a === "up" && b === "down") || (a === "down" && b === "up") ||
    (a === "left" && b === "right") || (a === "right" && b === "left")
}

export function stepCell(cell: Cell, dir: Direction): Cell {
  return { x: cell.x + DX[dir], y: cell.y + DY[dir] }
}

export function createSnake(player: PlayerId, spawn: Cell, dir: Direction): SnakeState {
  const body: Cell[] = []
  // 初始身体向后延伸
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    body.push({ x: spawn.x - DX[dir] * i, y: spawn.y - DY[dir] * i })
  }
  return {
    player,
    body,
    dir,
    nextDir: dir,
    phase: "alive",
    phaseTimer: 0,
    growPending: 0,
    inputBuffer: [],
  }
}

/** 入队转向：同向忽略、反向忽略（防自杀误触）、缓冲上限 2 帧（docs/03 第 2 节） */
export function enqueueDir(snake: SnakeState, dir: Direction): void {
  if (snake.phase !== "alive" && snake.phase !== "invincible") return // 幽灵不可操作
  const last = snake.inputBuffer.length > 0
    ? snake.inputBuffer[snake.inputBuffer.length - 1]
    : snake.dir
  if (dir === last || isOpposite(dir, last)) return
  if (snake.inputBuffer.length >= INPUT_BUFFER_MAX) {
    // 队首被消费前不允许继续堆积：替换最后一个（保留最新意图）
    snake.inputBuffer[snake.inputBuffer.length - 1] = dir
  } else {
    snake.inputBuffer.push(dir)
  }
}

/** 前进一步：消费缓冲方向 → 移动 → 处理增长。原地更新（返回自身便于链式） */
export function stepSnake(snake: SnakeState): SnakeState {
  // 幽灵不移动（docs/03 5.3）
  if (snake.phase === "ghost") return snake

  const next = snake.inputBuffer.shift()
  if (next && next !== snake.dir && !isOpposite(next, snake.dir)) {
    snake.dir = next
  }
  snake.nextDir = snake.dir

  const head = snake.body[0]
  const newHead = stepCell(head, snake.dir)
  snake.body.unshift(newHead)
  if (snake.growPending > 0) {
    snake.growPending--
  } else {
    snake.body.pop()
  }
  return snake
}

/** 碰撞用：新头是否撞到自身（不含尾部将移出格，但含增长时的尾） */
export function hitsSelf(snake: SnakeState, head: Cell, willGrow: boolean): boolean {
  const body = snake.body
  const limit = willGrow ? body.length : body.length - 1
  for (let i = 1; i < limit; i++) {
    if (body[i].x === head.x && body[i].y === head.y) return true
  }
  return false
}
