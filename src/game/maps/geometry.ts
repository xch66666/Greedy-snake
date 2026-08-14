// ============================================================
// maps/geometry.ts —— 极简几何（docs/11 布局图，网格 48×36，中心对称）
// 中心 (23.5,17.5)：CX*2=47, CY*2=35
// 实体：大棱柱×4 + 方尖碑×4 + 环形门×2；地形：水晶×4 + 虚空×2；动态：巡逻×8
// ============================================================
import type { DynamicObstacle, MapData, ObstacleEntity } from "../core/types"

const CX = 23.5
const CY = 17.5

function mirrorCells(cells: { x: number; y: number }[]): { x: number; y: number }[] {
  return cells.flatMap((c) => [c, { x: Math.round(CX * 2 - c.x), y: Math.round(CY * 2 - c.y) }])
}

function mirrorEntity(e: ObstacleEntity): ObstacleEntity {
  return {
    ...e,
    id: `${e.id}-m`,
    origin: { x: Math.round(CX * 2 - e.origin.x), y: Math.round(CY * 2 - e.origin.y) },
  }
}

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
  grid: { w: 48, h: 36 },
  spawn: { x: 3, y: 3 },
  staticObstacles: mirrorCells([{ x: 3, y: 4 }]),
  entities: (
    [
      // 大棱柱 2×2
      { id: "prism-0", kind: "prismBig", origin: { x: 6, y: 6 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
      { id: "prism-1", kind: "prismBig", origin: { x: 18, y: 10 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
      // 方尖碑 1×2
      { id: "obelisk-0", kind: "obelisk", origin: { x: 10, y: 24 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
      { id: "obelisk-1", kind: "obelisk", origin: { x: 34, y: 4 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
      // 环形门 3×2（中心偏上）
      { id: "ring-0", kind: "ring", origin: { x: 21, y: 15 }, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
      // 地形：水晶簇（不规则）+ 虚空坑（环形中空）
      {
        id: "crystal-0", kind: "crystal", origin: { x: 14, y: 8 },
        shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }],
      },
      {
        id: "voidpit-0", kind: "voidpit", origin: { x: 8, y: 16 },
        shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
      },
    ] satisfies ObstacleEntity[]
  ).flatMap((e) => [e, mirrorEntity(e)]),
  dynamicObstacles: (
    [
      { cell: { x: 5, y: 20 }, motion: "patrol", params: { range: 3, speed: 5, phase: 0 }, target: { x: 5, y: 28 } },
      { cell: { x: 20, y: 5 }, motion: "patrol", params: { range: 3, speed: 5, phase: 2.5 }, target: { x: 28, y: 5 } },
      { cell: { x: 40, y: 10 }, motion: "patrol", params: { range: 3, speed: 5, phase: 1.2 }, target: { x: 40, y: 18 } },
      { cell: { x: 24, y: 30 }, motion: "patrol", params: { range: 3, speed: 5, phase: 4.2 }, target: { x: 16, y: 30 } },
    ] satisfies DynamicObstacle[]
  ).flatMap((o) => [o, mirrorObstacle(o)]),
  themeId: "geometry",
  decorSeed: 303,
}
