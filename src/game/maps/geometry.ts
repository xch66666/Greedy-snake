// ============================================================
// maps/geometry.ts —— 极简几何（docs/09 第 3.7 节）
// 布局：中心对称（中心点 7.5,5.5 镜像）
// ============================================================
import type { DynamicObstacle, MapData } from "../core/types"

const CX = 7.5
const CY = 5.5

/** 坐标按中心对称镜像 */
function mirrorCells(cells: { x: number; y: number }[]): { x: number; y: number }[] {
  return cells.flatMap((c) => [
    c,
    { x: Math.round(CX * 2 - c.x), y: Math.round(CY * 2 - c.y) },
  ])
}

/** 动态障碍按中心对称镜像（cell 与 target 都要镜像） */
function mirrorObstacle(o: DynamicObstacle): DynamicObstacle {
  return {
    ...o,
    cell: { x: Math.round(CX * 2 - o.cell.x), y: Math.round(CY * 2 - o.cell.y) },
    target: o.target
      ? { x: Math.round(CX * 2 - o.target.x), y: Math.round(CY * 2 - o.target.y) }
      : undefined,
  }
}

export const geometryMap: MapData = {
  id: "geometry",
  name: "极简几何",
  grid: { w: 16, h: 12 },
  spawn: { x: 2, y: 2 },
  staticObstacles: mirrorCells([
    // 注意：源点集合内不能包含互为镜像的点（否则展开后重叠）
    { x: 3, y: 3 },
    { x: 13, y: 4 },
  ]),
  dynamicObstacles: (
    [
      { cell: { x: 3, y: 7 }, motion: "patrol", params: { range: 2, speed: 5, phase: 0 }, target: { x: 3, y: 5 } },
      { cell: { x: 7, y: 9 }, motion: "patrol", params: { range: 2, speed: 5, phase: 2.5 }, target: { x: 7, y: 7 } },
    ] satisfies DynamicObstacle[]
  ).flatMap((o) => [o, mirrorObstacle(o)]),
  themeId: "geometry",
  decorSeed: 303,
}
