// ============================================================
// core/obstacles.ts —— 动态障碍位置计算（docs/02 第 6 节）
// pulse：原地呼吸（占原格）；gate：开 1.5s / 关 2.5s（周期 speed）
// patrol：cell↔target 往返（三角波）；drift：水平正弦漂移 ±range
// ============================================================
import type { DynamicObstacle, MapData } from "./types"
import { cellKey } from "./food"

/** 三角波 0..1 */
function triangle(t: number, phase: number): number {
  const p = (t + phase) % 1
  return 1 - Math.abs(2 * p - 1)
}

/** 单个动态障碍在时刻 t 占据的格子 */
export function obstacleCell(o: DynamicObstacle, t: number): { x: number; y: number } {
  const p = o.params
  switch (o.motion) {
    case "pulse":
      return o.cell
    case "gate": {
      // 周期 p.speed 秒；开 1.5s（不占格），其余关闭（占格）
      const period = p.speed
      const openDur = Math.min(1.5, period * 0.4)
      const tt = (t + (p.phase / (Math.PI * 2)) * period) % period
      return tt < openDur ? { x: -1, y: -1 } : o.cell // 开时不占格
    }
    case "patrol": {
      const target = o.target ?? { x: o.cell.x + p.range, y: o.cell.y }
      const tri = triangle(t / p.speed, p.phase / (Math.PI * 2))
      return {
        x: Math.round(o.cell.x + (target.x - o.cell.x) * tri),
        y: Math.round(o.cell.y + (target.y - o.cell.y) * tri),
      }
    }
    case "drift": {
      const s = Math.sin((t * 2 * Math.PI) / p.speed + p.phase)
      return { x: Math.round(o.cell.x + p.range * s), y: o.cell.y }
    }
  }
}

/** 时刻 t 所有动态障碍占据格集合 */
export function obstacleActiveCells(map: MapData, t: number): Set<string> {
  const active = new Set<string>()
  for (const o of map.dynamicObstacles) {
    const c = obstacleCell(o, t)
    if (c.x >= 0 && c.y >= 0) active.add(cellKey(c))
  }
  return active
}
