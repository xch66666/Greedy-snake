// ============================================================
// maps/deepsea.ts —— 深海蓝光（docs/09 第 4.7 节，网格 24×18，样板图）
// 布局：珊瑚礁×3 + 沉船×1 + 海葵×2（复合障碍） + 漂移×6（动态）
// ============================================================
import type { MapData } from "../core/types"

export const deepseaMap: MapData = {
  id: "deepsea",
  name: "深海蓝光",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    { x: 1, y: 14 },
    { x: 10, y: 17 },
    { x: 21, y: 4 },
    { x: 6, y: 2 },
    { x: 19, y: 16 },
    { x: 3, y: 10 },
  ],
  entities: [
    // 珊瑚礁 2×2（边缘）
    {
      id: "reef-0", kind: "reef", origin: { x: 2, y: 15 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    {
      id: "reef-1", kind: "reef", origin: { x: 13, y: 15 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    {
      id: "reef-2", kind: "reef", origin: { x: 19, y: 2 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    // 沉船残骸 3×2（中上）
    {
      id: "wreck-0", kind: "wreck", origin: { x: 10, y: 4 },
      shape: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
        { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 },
      ],
    },
    // 海葵丛 2×1
    {
      id: "anemone-0", kind: "anemone", origin: { x: 6, y: 12 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    },
    {
      id: "anemone-1", kind: "anemone", origin: { x: 16, y: 10 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    },
  ],
  dynamicObstacles: [
    { cell: { x: 8, y: 13 }, motion: "drift", params: { range: 2, speed: 6, phase: 0 } },
    { cell: { x: 13, y: 6 }, motion: "drift", params: { range: 2, speed: 6, phase: 3.14 } },
    { cell: { x: 20, y: 12 }, motion: "drift", params: { range: 3, speed: 8, phase: 1.2 } },
    { cell: { x: 5, y: 8 }, motion: "drift", params: { range: 3, speed: 8, phase: 4.4 } },
    { cell: { x: 15, y: 9 }, motion: "drift", params: { range: 2, speed: 7, phase: 2.2 } },
    { cell: { x: 10, y: 2 }, motion: "drift", params: { range: 2, speed: 7, phase: 5.5 } },
  ],
  themeId: "deepsea",
  decorSeed: 404,
}
