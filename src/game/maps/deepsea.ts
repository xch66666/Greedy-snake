// ============================================================
// maps/deepsea.ts —— 深海蓝光（docs/09 第 4.7 节，网格 24×18，样板图）
// 布局：珊瑚丛×12 边缘 + 珊瑚/水母×6 漂移
// ============================================================
import type { MapData } from "../core/types"

export const deepseaMap: MapData = {
  id: "deepsea",
  name: "深海蓝光",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 1, y: 9 },
    { x: 2, y: 13 },
    { x: 5, y: 16 },
    { x: 10, y: 17 },
    { x: 15, y: 16 },
    { x: 19, y: 14 },
    { x: 22, y: 10 },
    { x: 21, y: 5 },
    { x: 17, y: 1 },
    { x: 11, y: 2 },
    { x: 6, y: 3 },
    { x: 3, y: 7 },
  ],
  dynamicObstacles: [
    { cell: { x: 8, y: 13 }, motion: "drift", params: { range: 2, speed: 6, phase: 0 } },
    { cell: { x: 13, y: 6 }, motion: "drift", params: { range: 2, speed: 6, phase: 3.14 } },
    { cell: { x: 20, y: 12 }, motion: "drift", params: { range: 3, speed: 8, phase: 1.2 } },
    { cell: { x: 5, y: 8 }, motion: "drift", params: { range: 3, speed: 8, phase: 4.4 } },
    { cell: { x: 15, y: 9 }, motion: "drift", params: { range: 2, speed: 7, phase: 2.2 } },
    { cell: { x: 10, y: 4 }, motion: "drift", params: { range: 2, speed: 7, phase: 5.5 } },
  ],
  themeId: "deepsea",
  decorSeed: 404,
}
