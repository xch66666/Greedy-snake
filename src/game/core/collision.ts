// ============================================================
// core/collision.ts —— 碰撞判定（纯函数，docs/03 第 5.1 节）
// ============================================================
import type { Cell, MapData } from "./types"
import { cellKey } from "./food"

export function isWall(cell: Cell, w: number, h: number): boolean {
  return cell.x < 0 || cell.y < 0 || cell.x >= w || cell.y >= h
}

/** 静态障碍命中 */
export function hitsStatic(map: MapData, cell: Cell): boolean {
  const k = cellKey(cell)
  return map.staticObstacles.some((c) => cellKey(c) === k)
}

/** 动态障碍命中（activeCells = 当前占据格的集合） */
export function hitsDynamic(activeCells: Set<string>, cell: Cell): boolean {
  return activeCells.has(cellKey(cell))
}

/** 综合：墙 / 静态 / 动态 */
export function hitsAny(map: MapData, activeCells: Set<string>, cell: Cell): boolean {
  return isWall(cell, map.grid.w, map.grid.h) ||
    hitsStatic(map, cell) ||
    hitsDynamic(activeCells, cell)
}
