// ============================================================
// maps/geometry.ts —— 极简几何（docs/09 第 3.7 节，网格 24×18）
// 布局：大棱柱×2 + 方尖碑×2 + 环形门×1（复合，中心对称）+ 巡逻棱柱×6
// ============================================================
import type { DynamicObstacle, MapData, ObstacleEntity } from "../core/types"

const CX = 11.5
const CY = 8.5

/** 坐标按中心对称镜像 */
function mirrorCells(cells: { x: number; y: number }[]): { x: number; y: number }[] {
  return cells.flatMap((c) => [
    c,
    { x: Math.round(CX * 2 - c.x), y: Math.round(CY * 2 - c.y) },
  ])
}

/** 复合实体按中心对称镜像（origin 镜像；shape 不变——矩形形状自对称） */
function mirrorEntity(e: ObstacleEntity): ObstacleEntity {
  return {
    ...e,
    id: `${e.id}-m`,
    origin: { x: Math.round(CX * 2 - e.origin.x), y: Math.round(CY * 2 - e.origin.y) },
  }
}

/** 动态障碍按中心对称镜像（cell 与 target 都镜像） */
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
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: mirrorCells([
    { x: 3, y: 4 },
    { x: 13, y: 3 },
  ]),
  entities: (
    [
      // 大棱柱 2×2（对角）+ 环形门 3×2（中央）——形状均中心对称，镜像实体仅 origin 翻转
      {
        id: "prism-0", kind: "prismBig", origin: { x: 5, y: 4 },
        shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
      },
      {
        id: "obelisk-0", kind: "obelisk", origin: { x: 9, y: 2 },
        shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
      },
      {
        id: "ring-0", kind: "ring", origin: { x: 10, y: 7 },
        shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
      },
    ] satisfies ObstacleEntity[]
  ).flatMap((e) => [e, mirrorEntity(e)]),
  dynamicObstacles: (
    [
      { cell: { x: 6, y: 8 }, motion: "patrol", params: { range: 2, speed: 5, phase: 0 }, target: { x: 6, y: 12 } },
      { cell: { x: 16, y: 5 }, motion: "patrol", params: { range: 2, speed: 5, phase: 2.5 }, target: { x: 16, y: 9 } },
      { cell: { x: 9, y: 12 }, motion: "patrol", params: { range: 2, speed: 5, phase: 1.2 }, target: { x: 13, y: 12 } },
    ] satisfies DynamicObstacle[]
  ).flatMap((o) => [o, mirrorObstacle(o)]),
  themeId: "geometry",
  decorSeed: 303,
}
