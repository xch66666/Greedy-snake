// ============================================================
// maps/deepsea.ts —— 深海蓝光（docs/09 第 4.7 节，样板图）
// 布局：珊瑚丛×4 边缘 + 珊瑚×2 漂移 + 水母×2 游动
// ============================================================
import type { MapData } from "../core/types"

export const deepseaMap: MapData = {
  id: "deepsea",
  name: "深海蓝光",
  grid: { w: 16, h: 12 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 1, y: 5 },
    { x: 14, y: 6 },
    { x: 4, y: 1 },
    { x: 11, y: 10 },
  ],
  dynamicObstacles: [
    { cell: { x: 5, y: 8 }, motion: "drift", params: { range: 2, speed: 6, phase: 0 } },
    { cell: { x: 10, y: 3 }, motion: "drift", params: { range: 2, speed: 6, phase: 3.14 } },
    { cell: { x: 12, y: 5 }, motion: "drift", params: { range: 3, speed: 8, phase: 1.2 } },
    { cell: { x: 3, y: 7 }, motion: "drift", params: { range: 3, speed: 8, phase: 4.4 } },
  ],
  themeId: "deepsea",
  decorSeed: 404,
}
