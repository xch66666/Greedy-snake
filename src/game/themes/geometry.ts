// ============================================================
// themes/geometry.ts —— 极简几何（docs/09 第 3 节，唯一标准）
// ============================================================
import type { Theme } from "../core/types"

export const geometryTheme: Theme = {
  id: "geometry",
  palette: {
    bg: "#191c2b",
    grid: "#2a2f45",
    border: "#3d4466",
    accent: "#4da6ff",
    food: "#ffd24d",
    snakeA: "#29c4c4",
    snakeB: "#e86aff",
    obstacle: "#3d4466",
    outline: "#0d0f1a",
    uiText: "#e8eaf6",
  },
  shadow: { offset: 4, color: "#0d0f1a" },
  radius: 4,
  texture: { base: "gradient", dither: true, ao: 0.4 },
  bgDecor: [
    { kind: "geo", count: 10, periodMin: 4, periodMax: 8 },
    { kind: "orbit", count: 14, periodMin: 6, periodMax: 10 },
  ],
  parallax: { layers: 3, depth: 3 },
  obstacleStyle: "prism",
  snakeStyle: { pattern: "block", head: "robot" },
  anim: { eatParticle: "shard", dur: 300 },
  foodStyle: "energy", // docs/09：能量块
  audio: { bgm: { tempo: 130, scale: "A-minor-pentatonic" }, ambient: "pulse" },
}
