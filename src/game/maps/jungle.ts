// ============================================================
// maps/jungle.ts —— 丛林自然（docs/11 布局图，网格 48×36）
// 实体：树×6 + 巨石×3 + 藤蔓墙×4；地形：水塘×2 + 荆棘×3；动态：藤蔓柱×8
// 布局原则：均匀散布，中央 22~27,14~21 留空
// ============================================================
import type { MapData } from "../core/types"

const TREE = [{ x: 5, y: 6 }, { x: 14, y: 28 }, { x: 22, y: 8 }, { x: 30, y: 26 }, { x: 38, y: 6 }, { x: 40, y: 30 }]
const BOULDER = [{ x: 10, y: 18 }, { x: 26, y: 12 }, { x: 34, y: 22 }]
const VINE_WALL = [{ x: 2, y: 14 }, { x: 22, y: 30 }, { x: 44, y: 16 }, { x: 16, y: 4 }]
const POND = [{ x: 20, y: 20 }, { x: 36, y: 12 }]
const BRAMBLES = [{ x: 8, y: 26 }, { x: 28, y: 18 }, { x: 42, y: 24 }]
const PULSE = [
  { x: 6, y: 10 }, { x: 12, y: 24 }, { x: 18, y: 14 }, { x: 24, y: 22 },
  { x: 30, y: 8 }, { x: 34, y: 28 }, { x: 40, y: 14 }, { x: 44, y: 26 },
]

const L_SHAPE = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }]

export const jungleMap: MapData = {
  id: "jungle",
  name: "丛林自然",
  grid: { w: 48, h: 36 },
  spawn: { x: 3, y: 3 },
  staticObstacles: [],
  entities: [
    ...TREE.map((o, i) => ({ id: `tree-${i}`, kind: "tree" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })),
    ...BOULDER.map((o, i) => ({ id: `boulder-${i}`, kind: "boulder" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }] })),
    ...VINE_WALL.map((o, i) => ({ id: `vinewall-${i}`, kind: "vinewall" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] })),
    // 地形（docs/12 第 3 节）
    ...POND.map((o, i) => ({ id: `pond-${i}`, kind: "pond" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })),
    ...BRAMBLES.map((o, i) => ({ id: `brambles-${i}`, kind: "brambles" as const, origin: o, shape: L_SHAPE })),
  ],
  dynamicObstacles: PULSE.map((c, i) => ({
    cell: c, motion: "pulse" as const,
    params: { range: 0.15, speed: 2.5, phase: (i * 0.8) % (Math.PI * 2) },
  })),
  themeId: "jungle",
  decorSeed: 101,
}
