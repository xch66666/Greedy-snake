// ============================================================
// core/food.ts —— 食物生成（纯函数，可注入种子，docs/03 第 8 节）
// ============================================================
import type { Cell } from "./types"

/** mulberry32 确定性随机（种子可复现，docs/04 第 8 节） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`
}

/** 从空格中随机选一个食物位置；无空格返回 null */
export function generateFood(
  w: number,
  h: number,
  occupied: Set<string>,
  rng: () => number,
): Cell | null {
  const free: Cell[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!occupied.has(cellKey({ x, y }))) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(rng() * free.length)]
}
