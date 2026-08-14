// ============================================================
// maps/jungle.ts —— 丛林自然（docs/09 第 1.7 节，网格 24×18）
// 布局：大树×4 + 巨石×2 + 藤蔓墙×2（复合障碍） + 藤蔓柱×6（动态）
// ============================================================
import type { MapData } from "../core/types"

const TREE: { x: number; y: number }[] = [
  { x: 4, y: 13 }, { x: 19, y: 14 }, { x: 7, y: 2 }, { x: 20, y: 3 },
]
const BOULDER: { x: number; y: number }[] = [
  { x: 9, y: 4 }, { x: 14, y: 13 },
]
const VINE_WALL: { x: number; y: number }[] = [
  { x: 1, y: 8 }, { x: 21, y: 9 },
]

export const jungleMap: MapData = {
  id: "jungle",
  name: "丛林自然",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 12, y: 16 },
    { x: 7, y: 12 },
    { x: 16, y: 6 },
  ],
  entities: [
    // 大树 2×2
    ...TREE.map((o, i) => ({
      id: `tree-${i}`,
      kind: "tree" as const,
      origin: o,
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    })),
    // 巨石 2×1
    ...BOULDER.map((o, i) => ({
      id: `boulder-${i}`,
      kind: "boulder" as const,
      origin: o,
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    })),
    // 藤蔓墙 3×1
    ...VINE_WALL.map((o, i) => ({
      id: `vinewall-${i}`,
      kind: "vinewall" as const,
      origin: o,
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    })),
  ],
  dynamicObstacles: [
    { cell: { x: 5, y: 7 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 0 } },
    { cell: { x: 9, y: 9 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 1.6 } },
    { cell: { x: 13, y: 11 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 3.1 } },
    { cell: { x: 17, y: 9 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 4.7 } },
    { cell: { x: 11, y: 5 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 2.2 } },
    { cell: { x: 15, y: 15 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 5.1 } },
  ],
  themeId: "jungle",
  decorSeed: 101,
}
