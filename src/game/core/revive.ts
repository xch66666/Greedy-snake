// ============================================================
// core/revive.ts —— 双人复活规则（纯函数，docs/03 第 5.3 节）
// 蛇死 → 幽灵 10 秒 → 复活安全位置；期间另一条死 → 当局结束
// 复活后 2 秒保护期（不吃食物、不受伤害、可穿障碍）
// ============================================================
import type { Cell, MapData, SnakeState } from "./types"
import { INVINCIBLE_SECONDS, REVIVE_WAIT_SECONDS } from "./constants"
import { cellKey } from "./food"

/** 计算安全复活点：所有空格中，距最近占用格距离最大者（确定性 + rng 平局扰动） */
export function safeRespawnCell(
  map: MapData,
  snakes: SnakeState[],
  activeCells: Set<string>,
  rng: () => number,
): Cell | null {
  const occupied = new Set(activeCells)
  for (const s of snakes) {
    for (const c of s.body) occupied.add(cellKey(c))
  }
  let best: Cell | null = null
  let bestDist = -1
  let candidates: Cell[] = []
  for (let y = 0; y < map.grid.h; y++) {
    for (let x = 0; x < map.grid.w; x++) {
      const k = `${x},${y}`
      if (occupied.has(k)) continue
      let minD = Infinity
      for (const k2 of occupied) {
        const [ox, oy] = k2.split(",").map(Number)
        const d = Math.abs(x - ox) + Math.abs(y - oy)
        if (d < minD) minD = d
      }
      if (minD > bestDist) {
        bestDist = minD
        candidates = [{ x, y }]
      } else if (minD === bestDist && minD !== Infinity) {
        candidates.push({ x, y })
      }
    }
  }
  if (candidates.length === 0) return best
  return candidates[Math.floor(rng() * candidates.length)]
}

export interface ReviveUpdate {
  /** 是否应结束当局（双死，docs/03 5.3） */
  gameOver: boolean
  /** 等待结束、需要引擎放置复活点的蛇 */
  revive: SnakeState[]
}

/** 更新幽灵/保护期倒计时（dt 秒）。纯函数更新蛇的 phase/phaseTimer */
export function updateRevive(snakes: SnakeState[], dt: number): ReviveUpdate {
  const revive: SnakeState[] = []
  for (const s of snakes) {
    if (s.phase === "ghost") {
      s.phaseTimer -= dt
      if (s.phaseTimer <= 0) {
        revive.push(s) // 引擎负责放置并转 invincible
      }
    } else if (s.phase === "invincible") {
      s.phaseTimer -= dt
      if (s.phaseTimer <= 0) {
        s.phase = "alive"
      }
    }
  }
  const waiting = snakes.filter((s) => s.phase === "ghost")
  const gameOver = snakes.length === 2 && waiting.length >= 2
  return { gameOver, revive }
}

export const REVIVE_WAIT = REVIVE_WAIT_SECONDS
export const INVINCIBLE = INVINCIBLE_SECONDS
