// ============================================================
// themes/deepsea.ts —— 深海蓝光（docs/09 第 4 节，唯一标准 · 样板图）
// ============================================================
import type { Theme } from "../core/types"

export const deepseaTheme: Theme = {
  id: "deepsea",
  palette: {
    bg: "#0a1e3c",
    grid: "#14305c",
    border: "#1e4a7a",
    accent: "#3ee6c8",
    food: "#e8f4ff",
    snakeA: "#2e86de",
    snakeB: "#10b981",
    obstacle: "#d95f8e",
    outline: "#04101f",
    uiText: "#d8ecff",
  },
  shadow: { offset: 4, color: "#04101f" },
  radius: 4,
  texture: { base: "wave", dither: true, ao: 0.6 },
  bgDecor: [
    { kind: "bubble", count: 18, periodMin: 4, periodMax: 8 },
    { kind: "kelp", count: 8, periodMin: 3, periodMax: 5 },
    { kind: "plankton", count: 10, periodMin: 2, periodMax: 4 },
  ],
  parallax: { layers: 3, depth: 4 },
  obstacleStyle: "coral",
  snakeStyle: { pattern: "gradient", head: "fish" },
  anim: { eatParticle: "bubble", dur: 300 },
  audio: { bgm: { tempo: 70, scale: "E-minor" }, ambient: "abyss" },
}
