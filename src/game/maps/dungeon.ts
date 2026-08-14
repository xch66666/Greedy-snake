// ============================================================
// maps/dungeon.ts —— 暗黑地牢（docs/09 第 2.7 节）
// 布局：走廊式迷宫（石墙横竖交错成通道），闸门设通道口
// ============================================================
import type { MapData } from "../core/types"

export const dungeonMap: MapData = {
  id: "dungeon",
  name: "暗黑地牢",
  grid: { w: 16, h: 12 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    // 水平墙（留通道口）
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    { x: 9, y: 4 },
    { x: 10, y: 4 },
    { x: 11, y: 4 },
    // 垂直墙
    { x: 13, y: 6 },
    { x: 13, y: 7 },
    { x: 13, y: 8 },
    // 左下落差墙
    { x: 2, y: 9 },
    { x: 3, y: 9 },
    { x: 4, y: 9 },
    { x: 5, y: 9 },
  ],
  dynamicObstacles: [
    // 通道口闸门（开 1.5s / 关 2.5s，周期 4s）
    { cell: { x: 8, y: 4 }, motion: "gate", params: { range: 0, speed: 4, phase: 0 } },
    { cell: { x: 12, y: 6 }, motion: "gate", params: { range: 0, speed: 4, phase: 2 } },
    { cell: { x: 1, y: 9 }, motion: "gate", params: { range: 0, speed: 4, phase: 1 } },
    { cell: { x: 14, y: 3 }, motion: "gate", params: { range: 0, speed: 4, phase: 3 } },
  ],
  themeId: "dungeon",
  decorSeed: 202,
}
