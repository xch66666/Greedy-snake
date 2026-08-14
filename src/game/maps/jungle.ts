// ============================================================
// maps/jungle.ts —— 丛林自然（docs/09 第 1.7 节，网格 24×18）
// 布局：藤蔓桩×8 均匀散布 + 藤蔓柱×6 呼吸，中央 6×6 留空
// ============================================================
import type { MapData } from "../core/types"

export const jungleMap: MapData = {
  id: "jungle",
  name: "丛林自然",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 1, y: 14 },
    { x: 5, y: 16 },
    { x: 8, y: 2 },
    { x: 12, y: 16 },
    { x: 15, y: 2 },
    { x: 19, y: 13 },
    { x: 21, y: 9 },
    { x: 2, y: 6 },
  ],
  dynamicObstacles: [
    { cell: { x: 4, y: 9 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 0 } },
    { cell: { x: 8, y: 12 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 1.6 } },
    { cell: { x: 11, y: 15 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 3.1 } },
    { cell: { x: 14, y: 4 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 4.7 } },
    { cell: { x: 18, y: 9 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 2.2 } },
    { cell: { x: 21, y: 13 }, motion: "pulse", params: { range: 0.15, speed: 2.5, phase: 5.1 } },
  ],
  themeId: "jungle",
  decorSeed: 101,
}
