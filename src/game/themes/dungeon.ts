// ============================================================
// themes/dungeon.ts —— 暗黑地牢（docs/09 第 2 节，唯一标准）
// ============================================================
import type { Theme } from "../core/types"

export const dungeonTheme: Theme = {
  id: "dungeon",
  palette: {
    bg: "#1a140f",
    grid: "#33291e",
    border: "#4a3a28",
    accent: "#e07b39",
    food: "#d4af37",
    snakeA: "#9aa0a8",
    snakeB: "#d96a2b",
    obstacle: "#5a4632",
    outline: "#0d0906",
    uiText: "#d8cfc0",
  },
  shadow: { offset: 4, color: "#0d0906" },
  radius: 4,
  texture: { base: "stone", dither: true, ao: 0.8 },
  bgDecor: [
    { kind: "torch", count: 6, periodMin: 0.7, periodMax: 0.9 },
    { kind: "dust", count: 18, periodMin: 10, periodMax: 16 },
    { kind: "bat", count: 3, periodMin: 8, periodMax: 14 },
  ],
  parallax: { layers: 3, depth: 5 },
  obstacleStyle: "stone",
  snakeStyle: { pattern: "scale", head: "dragon" },
  anim: { eatParticle: "ember", dur: 300 },
  foodStyle: "gold", // docs/09：金块
  audio: { bgm: { tempo: 90, scale: "D-minor" }, ambient: "dungeon" },
}
