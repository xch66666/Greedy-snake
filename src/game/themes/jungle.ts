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
  radius: 4,
  texture: { base: "leaf", dither: true, ao: 0.6 },
  bgDecor: [
    { kind: "firefly", count: 4, periodMin: 3, periodMax: 5 },
    { kind: "leaf", count: 3, periodMin: 6, periodMax: 10 },
    { kind: "light", count: 2, periodMin: 8, periodMax: 12 },
  ],
  parallax: { layers: 3, depth: 4 },
  obstacleStyle: "vine",
  snakeStyle: { pattern: "stripe", head: "cat" },
  anim: { eatParticle: "leaf", dur: 300 },
  foodStyle: "berry", // docs/09：红浆果
  // 素材贴图模式暂缓：草地砖两次反馈"太花/杂乱"，回退程序化深色底纹（对比度最干净）
  // sprites 机制保留（src/render/sprites.ts），后续找到低对比素材再启用
  audio: { bgm: { tempo: 110, scale: "C-major" }, ambient: "insects" },
}
