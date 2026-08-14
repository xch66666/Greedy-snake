// ============================================================
// maps/dungeon.ts —— 暗黑地牢（docs/09 第 2.7 节，网格 24×18）
// 布局：石柱×4 + 祭坛×1 + 铁笼×2（复合障碍） + 闸门×6（动态），走廊式
// ============================================================
import type { MapData } from "../core/types"

export const dungeonMap: MapData = {
  id: "dungeon",
  name: "暗黑地牢",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    // 走廊墙（石墙横竖交错，留通道口）
    { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 },
    { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 },
    { x: 17, y: 5 }, { x: 17, y: 6 }, { x: 17, y: 8 }, { x: 17, y: 9 },
    { x: 5, y: 13 }, { x: 6, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 },
  ],
  entities: [
    // 石柱 1×2（竖）
    { id: "pillar-0", kind: "pillar", origin: { x: 13, y: 4 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { id: "pillar-1", kind: "pillar", origin: { x: 19, y: 6 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { id: "pillar-2", kind: "pillar", origin: { x: 2, y: 11 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    { id: "pillar-3", kind: "pillar", origin: { x: 20, y: 14 }, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
    // 祭坛 2×2（中央）
    {
      id: "altar-0", kind: "altar", origin: { x: 11, y: 9 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    // 铁笼 2×2（囚禁光点）
    {
      id: "cage-0", kind: "cage", origin: { x: 3, y: 15 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
    {
      id: "cage-1", kind: "cage", origin: { x: 15, y: 15 },
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    },
  ],
  dynamicObstacles: [
    // 通道口闸门（开 1.5s / 关 2.5s，周期 4s）
    { cell: { x: 8, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 0 } },
    { cell: { x: 13, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 1 } },
    { cell: { x: 17, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 2 } },
    { cell: { x: 4, y: 13 }, motion: "gate", params: { range: 0, speed: 4, phase: 3 } },
    { cell: { x: 9, y: 13 }, motion: "gate", params: { range: 0, speed: 4, phase: 1.5 } },
    { cell: { x: 21, y: 11 }, motion: "gate", params: { range: 0, speed: 4, phase: 2.5 } },
  ],
  themeId: "dungeon",
  decorSeed: 202,
}
