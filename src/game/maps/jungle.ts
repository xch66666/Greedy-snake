// ============================================================
// maps/jungle.ts —— 丛林自然（docs/09 第 1.7 节）
// 布局：藤蔓桩×4 四角对称 + 藤蔓柱×4 均匀散布，中央 4×4 留空
// ============================================================
import type { MapData } from "../core/types"

export const jungleMap: MapData = {
  id: "jungle",
  name: "丛林自然",
  grid: { w: 16, h: 12 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 1, y: 9 },
    { x: 5, y: 10 },
    { x: 10, y: 1 },
    { x: 14, y: 9 },
  ],
  dynamicObstacles: [
    { cell: { x: 3, y: 6 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 0 } },
    { cell: { x: 7, y: 3 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 1.6 } },
    { cell: { x: 12, y: 5 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 3.1 } },
    { cell: { x: 8, y: 9 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 4.7 } },
  ],
  themeId: "jungle",
  decorSeed: 101,
}
