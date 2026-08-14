// ============================================================
// maps/dungeon.ts —— 暗黑地牢（docs/09 第 2.7 节，网格 24×18）
// 布局：走廊式迷宫（石墙横竖交错成通道），闸门设通道口
// ============================================================
import type { MapData } from "../core/types"

export const dungeonMap: MapData = {
  id: "dungeon",
  name: "暗黑地牢",
  grid: { w: 24, h: 18 },
  spawn: { x: 2, y: 2 },
  staticObstacles: [
    // 上墙 y=7：左右两段（通道口 x=8 与 x=15）
    { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 },
    { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 },
    // 垂直墙 x=17：中段（通道口 y=7）
    { x: 17, y: 5 }, { x: 17, y: 6 }, { x: 17, y: 8 }, { x: 17, y: 9 },
    // 下墙 y=13：中段（通道口 x=3~4 与 x=10~11）
    { x: 5, y: 13 }, { x: 6, y: 13 }, { x: 7, y: 13 }, { x: 8, y: 13 }, { x: 9, y: 13 },
  ],
  dynamicObstacles: [
    // 通道口闸门（开 1.5s / 关 2.5s，周期 4s）
    { cell: { x: 8, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 0 } },
    { cell: { x: 15, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 1 } },
    { cell: { x: 17, y: 7 }, motion: "gate", params: { range: 0, speed: 4, phase: 2 } },
    { cell: { x: 4, y: 13 }, motion: "gate", params: { range: 0, speed: 4, phase: 3 } },
    { cell: { x: 10, y: 13 }, motion: "gate", params: { range: 0, speed: 4, phase: 1.5 } },
    { cell: { x: 20, y: 10 }, motion: "gate", params: { range: 0, speed: 4, phase: 2.5 } },
  ],
  themeId: "dungeon",
  decorSeed: 202,
}
