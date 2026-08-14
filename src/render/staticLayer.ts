// ============================================================
// render/staticLayer.ts —— 离屏静态层预渲染（docs/02 第 2 节）
// 底纹/抖动/网格/边框/静态障碍/AO 只画一次，每帧零成本
// ============================================================
import type { MapData, Theme } from "../game/core/types"
import { CELL } from "./camera"
import { mulberry32 } from "../game/core/food"

/** 有序抖动点阵（4×4 Bayer，消除色带，docs/02 3.1） */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export function renderStaticLayer(
  map: MapData,
  theme: Theme,
): HTMLCanvasElement {
  const w = map.grid.w * CELL
  const h = map.grid.h * CELL
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  const rng = mulberry32(map.decorSeed)

  // 底色
  ctx.fillStyle = theme.palette.bg
  ctx.fillRect(0, 0, w, h)

  // ---- 主题底纹 ----
  drawTexture(ctx, theme, w, h, rng)

  // ---- 网格线（弱化：主题色半透明，docs/02 3.2）----
  ctx.strokeStyle = theme.palette.grid
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= map.grid.w; x++) {
    ctx.moveTo(x * CELL + 0.5, 0)
    ctx.lineTo(x * CELL + 0.5, h)
  }
  for (let y = 0; y <= map.grid.h; y++) {
    ctx.moveTo(0, y * CELL + 0.5)
    ctx.lineTo(w, y * CELL + 0.5)
  }
  ctx.stroke()
  ctx.globalAlpha = 1

  // ---- 静态障碍（含 AO 接触阴影）----
  for (const c of map.staticObstacles) {
    drawAo(ctx, c.x * CELL, c.y * CELL, theme)
    drawObstacleShape(ctx, theme.obstacleStyle, c.x * CELL, c.y * CELL, theme, 0)
  }

  // ---- 边框（docs/09 各图 border 色 + 硬阴影）----
  ctx.fillStyle = theme.palette.border
  ctx.fillRect(0, 0, w, 3)
  ctx.fillRect(0, h - 3, w, 3)
  ctx.fillRect(0, 0, 3, h)
  ctx.fillRect(w - 3, 0, 3, h)
  ctx.fillStyle = theme.palette.outline
  ctx.globalAlpha = 0.5
  ctx.fillRect(0, 3, w, 2)
  ctx.fillRect(0, h - 5, w, 2)
  ctx.globalAlpha = 1

  return canvas
}

// ---------- 底纹 ----------

function drawTexture(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  w: number,
  h: number,
  rng: () => number,
): void {
  const t = theme.texture
  switch (t.base) {
    case "leaf":
      // 叶片暗纹 + 光斑
      for (let i = 0; i < 26; i++) {
        const x = rng() * w
        const y = rng() * h
        const r = 4 + rng() * 8
        ctx.globalAlpha = 0.08
        ctx.fillStyle = "#000000"
        ctx.beginPath()
        ctx.ellipse(x, y, r, r * 0.6, rng() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = 0; i < 10; i++) {
        ctx.globalAlpha = 0.12
        ctx.fillStyle = "#8fd45c"
        ctx.beginPath()
        ctx.arc(rng() * w, rng() * h, 2 + rng() * 6, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    case "stone": {
      // 石砖错缝 + 裂纹
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 1
      const bh = 8
      for (let y = 0; y < h; y += bh) {
        const off = (Math.floor(y / bh) % 2) * 8
        ctx.beginPath()
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(w, y + 0.5)
        ctx.stroke()
        for (let x = -16 + off; x < w; x += 16) {
          ctx.beginPath()
          ctx.moveTo(x + 0.5, y)
          ctx.lineTo(x + 0.5, y + bh)
          ctx.stroke()
        }
      }
      // 裂纹
      ctx.globalAlpha = 0.35
      for (let i = 0; i < 5; i++) {
        let x = rng() * w
        let y = rng() * h
        ctx.beginPath()
        ctx.moveTo(x, y)
        for (let s = 0; s < 6; s++) {
          x += (rng() - 0.5) * 14
          y += rng() * 10
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      break
    }
    case "gradient": {
      // 对角渐变 + 网格
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, "rgba(77,166,255,0.10)")
      g.addColorStop(0.5, "rgba(0,0,0,0)")
      g.addColorStop(1, "rgba(232,106,255,0.10)")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
    case "wave": {
      // 横向正弦波纹 + 垂直光柱
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = "#7fd8ff"
      ctx.lineWidth = 1
      for (let i = 0; i < 6; i++) {
        const baseY = (h / 6) * i + 4
        ctx.beginPath()
        for (let x = 0; x <= w; x += 4) {
          const y = baseY + Math.sin((x / 32) * Math.PI * 2) * 3
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      // 光柱
      ctx.globalAlpha = 0.08
      ctx.fillStyle = "#ffffff"
      for (let i = 0; i < 2; i++) {
        const x = 40 + i * (w - 80) * (0.3 + rng() * 0.4)
        ctx.fillRect(x, 0, 14, h)
      }
      break
    }
  }
  ctx.globalAlpha = 1

  // ---- 有序抖动（色带消除）----
  if (t.dither) {
    ctx.fillStyle = "#ffffff"
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (BAYER[y % 4][x % 4] < 2) {
          ctx.globalAlpha = 0.02
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
    ctx.globalAlpha = 1
  }
}

// ---------- 障碍绘制（静态层与动态共用） ----------

/** AO 接触阴影（docs/02 3.1） */
export function drawAo(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  theme: Theme,
): void {
  const a = theme.texture.ao
  if (a <= 0) return
  ctx.fillStyle = "#000000"
  ctx.globalAlpha = a * 0.5
  ctx.fillRect(px + 2, py + CELL - 2, CELL - 4, 2)
  ctx.globalAlpha = a * 0.3
  ctx.fillRect(px + 1, py + CELL - 4, CELL - 2, 2)
  ctx.globalAlpha = 1
}

/** 障碍本体（vine/stone/prism/coral，docs/09） */
export function drawObstacleShape(
  ctx: CanvasRenderingContext2D,
  style: Theme["obstacleStyle"],
  px: number,
  py: number,
  theme: Theme,
  t: number,
): void {
  const color = theme.palette.obstacle
  const outline = theme.palette.outline
  const cx = px + CELL / 2
  const cy = py + CELL / 2
  ctx.save()
  switch (style) {
    case "vine": {
      // 藤蔓柱：圆角柱 + 叶片（随 pulse 呼吸缩放由调用方控制）
      const s = 0.85 + 0.15 * Math.sin(t * 2.5)
      ctx.fillStyle = outline
      ctx.beginPath()
      ctx.roundRect(cx - 3 * s, py + 2, 6 * s, CELL - 4, 3)
      ctx.fill()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(cx - 2.5 * s, py + 3, 5 * s, CELL - 6, 2.5)
      ctx.fill()
      // 叶片
      ctx.fillStyle = theme.palette.snakeA
      ctx.beginPath()
      ctx.ellipse(cx + 5 * s, py + 6, 2.5, 1.5, 0.4, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case "stone": {
      // 石墙：砖块 + 缝隙
      ctx.fillStyle = color
      ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2)
      ctx.fillStyle = outline
      ctx.fillRect(px + 1, py + CELL / 2, CELL - 2, 1)
      ctx.fillRect(px + CELL / 2, py + 1, 1, CELL / 2 - 1)
      ctx.fillStyle = "rgba(0,0,0,0.3)"
      ctx.fillRect(px + 1, py + CELL - 2, CELL - 2, 1)
      break
    }
    case "prism": {
      // 棱柱：菱形 + 高光旋转
      const rot = t * 1.2
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, -5)
      ctx.lineTo(4, 0)
      ctx.lineTo(0, 5)
      ctx.lineTo(-4, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = theme.palette.accent
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.moveTo(0, -3)
      ctx.lineTo(2, 0)
      ctx.lineTo(0, 3)
      ctx.lineTo(-2, 0)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
      break
    }
    case "coral": {
      // 珊瑚：粉红分枝 + 荧光脉动
      const glow = 0.5 + 0.5 * Math.sin(t * 6.9)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(px + 5, py + 4, 6, CELL - 8, 3)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(px + 3, py + 6, 3, 5, -0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(px + 12, py + 7, 3, 4, 0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.25 + 0.2 * glow
      ctx.fillStyle = "#ff9ecb"
      ctx.beginPath()
      ctx.arc(cx, py + 5, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      break
    }
  }
  ctx.restore()
}
