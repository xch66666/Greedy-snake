// ============================================================
// maps/deepsea.ts —— 深海蓝光（docs/11 布局图，网格 48×36）
// 实体：珊瑚礁×4 + 沉船×2 + 海葵×4；地形：沙洲×3 + 海藻×3；动态：漂移×8
// 布局原则：边缘为主
// ============================================================
import type { MapData } from "../core/types"

const REEF = [{ x: 2, y: 30 }, { x: 14, y: 2 }, { x: 30, y: 32 }, { x: 44, y: 8 }]
const WRECK = [{ x: 8, y: 12 }, { x: 36, y: 20 }]
const ANEMONE = [{ x: 5, y: 24 }, { x: 18, y: 30 }, { x: 40, y: 26 }, { x: 24, y: 4 }]
const SANDBANK = [{ x: 12, y: 26 }, { x: 28, y: 14 }, { x: 42, y: 28 }]
const KELP = [{ x: 20, y: 10 }, { x: 34, y: 6 }, { x: 6, y: 16 }]
const DRIFT = [
  { x: 10, y: 20 }, { x: 16, y: 8 }, { x: 24, y: 24 }, { x: 32, y: 10 },
  { x: 38, y: 28 }, { x: 44, y: 18 }, { x: 8, y: 6 }, { x: 28, y: 30 },
]

const L_SHAPE = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }]

export const deepseaMap: MapData = {
  id: "deepsea",
  name: "深海蓝光",
  grid: { w: 48, h: 36 },
  spawn: { x: 3, y: 3 },
  staticObstacles: [{ x: 1, y: 18 }, { x: 46, y: 20 }],
  entities: [
    ...REEF.map((o, i) => ({ id: `reef-${i}`, kind: "reef" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] })),
    ...WRECK.map((o, i) => ({
      id: `wreck-${i}`, kind: "wreck" as const, origin: o,
      shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    })),
    ...ANEMONE.map((o, i) => ({ id: `anemone-${i}`, kind: "anemone" as const, origin: o, shape: [{ x: 0, y: 0 }, { x: 1, y: 0 }] })),
    // 地形
    ...SANDBANK.map((o, i) => ({ id: `sandbank-${i}`, kind: "sandbank" as const, origin: o, shape: L_SHAPE })),
    ...KELP.map((o, i) => ({ id: `kelpfield-${i}`, kind: "kelpfield" as const, origin: o, shape: L_SHAPE })),
  ],
  dynamicObstacles: DRIFT.map((c, i) => ({
    cell: c, motion: "drift" as const,
    params: { range: 2, speed: 6 + (i % 3) * 1.5, phase: (i * 0.9) % (Math.PI * 2) },
  })),
  themeId: "deepsea",
  decorSeed: 404,
}
