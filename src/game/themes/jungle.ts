// ============================================================
// themes/jungle.ts —— 丛林自然（docs/09 第 1 节，唯一标准）
// ============================================================
import type { Theme } from "../core/types"

export const jungleTheme: Theme = {
  id: "jungle",
  palette: {
    bg: "#0e2a1a",
    grid: "#1d4a2e",
    border: "#2e6b3f",
    accent: "#c9a227",
    food: "#e0563f",
    snakeA: "#4caf50",
    snakeB: "#d4a017",
    obstacle: "#3d7a4a",
    outline: "#06281a",
    uiText: "#e8f5e9",
  },
  shadow: { offset: 4, color: "#06281a" },
  radius: 3,
  texture: { base: "leaf", dither: true, ao: 0.6 },
  bgDecor: [
    { kind: "firefly", count: 12, periodMin: 3, periodMax: 5 },
    { kind: "leaf", count: 16, periodMin: 6, periodMax: 10 },
    { kind: "light", count: 8, periodMin: 8, periodMax: 12 },
  ],
  parallax: { layers: 3, depth: 4 },
  obstacleStyle: "vine",
  snakeStyle: { pattern: "stripe", head: "cat" },
  anim: { eatParticle: "leaf", dur: 300 },
  foodStyle: "berry", // docs/09：红浆果
  audio: { bgm: { tempo: 110, scale: "C-major" }, ambient: "insects" },
}
