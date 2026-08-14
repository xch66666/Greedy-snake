// ============================================================
// maps/dungeon.ts —— 暗黑地牢（docs/11 布局图，网格 48×36）
// 走廊式迷宫：横墙 y=12/y=24 带口 + 竖墙 x=16/x=32 带口（墙由循环生成）
// 实体：石柱×8 + 祭坛×2 + 铁笼×3；地形：熔岩×3 + 碎石×3；动态：闸门×8
// ============================================================
import type { MapData } from "../core/types"

// 迷宫墙（单格，循环生成）
const walls: { x: number; y: number }[] = []
// 横墙 y=12：口 x=14~16 与 x=31~33
for (let x = 2; x <= 13; x++) walls.push({ x, y: 12 })
for (let x = 17; x <= 30; x++) walls.push({ x, y: 12 })
for (let x = 34; x <= 45; x++) walls.push({ x, y: 12 })
// 横墙 y=24：口 x=16~18、x=29~31（右段从 33 起，给竖墙 x=32 留口）
for (let x = 2; x <= 15; x++) walls.push({ x, y: 24 })
for (let x = 19; x <= 28; x++) walls.push({ x, y: 24 })
for (let x = 33; x <= 45; x++) walls.push({ x, y: 24 })
// 竖墙 x=16：口 y=12 与 y=24
for (let y = 2; y <= 11; y++) walls.push({ x: 16, y })
for (let y = 13; y <= 23; y++) walls.push({ x: 16, y })
for (let y = 25; y <= 33; y++) walls.push({ x: 16, y })
// 竖墙 x=32：口 y=12 与 y=24
for (let y = 2; y <= 11; y++) walls.push({ x: 32, y })
for (let y = 13; y <= 23; y++) walls.push({ x: 32, y })
for (let y = 25; y <= 33; y++) walls.push({ x: 32, y })

const PILLAR = [{ x: 4, y: 4 }, { x: 20, y: 4 }, { x: 28, y: 4 }, { x: 40, y: 4 }, { x: 6, y: 28 }, { x: 22, y: 28 }, { x: 34, y: 28 }, { x: 42, y: 28 }]
const ALTAR = [{ x: 14, y: 16 }, { x: 30, y: 16 }]
const CAGE = [{ x: 40, y: 20 }, { x: 4, y: 20 }, { x: 24, y: 32 }]
const LAVA = [{ x: 10, y: 18 }, { x: 26, y: 18 }, { x: 38, y: 18 }]
const RUBBLE = [{ x: 6, y: 30 }, { x: 18, y: 30 }, { x: 36, y: 30 }]
const GATE = [
  { x: 15, y: 12 }, { x: 31, y: 12 }, { x: 16, y: 24 }, { x: 32, y: 24 },
  { x: 16, y: 12 }, { x: 32, y: 12 }, { x: 17, y: 24 }, { x: 30, y: 24 },
]

const L_SHAPE = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }]

export const dungeonMap: MapData = {
  id: "dungeon",
  name: "暗黑地牢",
  grid: { w: 48, h: 36 },
  spawn: { x: 3, y: 3 },
  staticObstacles: walls,
  entities: [
    ...PILLAR.map((o, i) => ({ id: `pillar-${i}`, kind: "pillar" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 0, y: 1 }] })),
    ...ALTAR.map((o, i) => ({ id: `altar-${i}`, kind: "altar" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })),
    ...CAGE.map((o, i) => ({ id: `cage-${i}`, kind: "cage" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })),
    // 地形
    ...LAVA.map((o, i) => ({ id: `lavacrack-${i}`, kind: "lavacrack" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] })),
    ...RUBBLE.map((o, i) => ({ id: `rubble-${i}`, kind: "rubble" as const, origin: o, shape: L_SHAPE })),
  ],
  dynamicObstacles: GATE.map((c, i) => ({
    cell: c, motion: "gate" as const,
    params: { range: 0, speed: 4, phase: (i * 0.78) % (Math.PI * 2) },
  })),
  themeId: "dungeon",
  decorSeed: 202,
}
