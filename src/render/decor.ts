// ============================================================
// render/decor.ts —— 背景装饰系统（docs/02 3.2/3.3，docs/09 各图装饰）
// 确定性生成（decorSeed），独立周期动画，数量 ≤60（docs/02 1.4）
// ============================================================
import type { MapData, Theme } from "../game/core/types"
import { CELL } from "./camera"
import { mulberry32 } from "../game/core/food"
import { cyclePhase, easeInOutSine } from "./easing"
import type { Quality } from "../storage/schema"

interface DecorInstance {
  kind: Theme["bgDecor"][number]["kind"]
  x: number // 像素（0..w）
  y: number
  phase: number // 0..1
  period: number // 秒
  size: number
  layer: 0 | 1 | 2 // 视差层（0 最远）
}

export type { DecorInstance }

/** 视差深度因子（docs/09：depth 4~5） */
const LAYER_DEPTH = [0.02, 0.05, 0.1]

export function generateDecor(map: MapData, theme: Theme): DecorInstance[] {
  const rng = mulberry32(map.decorSeed * 7919 + 13)
  const w = map.grid.w * CELL
  const h = map.grid.h * CELL
  const out: DecorInstance[] = []
  for (const spec of theme.bgDecor) {
    for (let i = 0; i < spec.count; i++) {
      out.push({
        kind: spec.kind,
        x: rng() * w,
        y: rng() * h,
        phase: rng(),
        period: spec.periodMin + rng() * (spec.periodMax - spec.periodMin),
        size: 1 + rng() * 2.5,
        layer: (i % 3) as 0 | 1 | 2,
      })
    }
  }
  return out
}

/** 视差偏移（跟随蛇头相对中心，docs/02 3.2） */
export function parallaxOffset(
  headPx: { x: number; y: number },
  centerPx: { x: number; y: number },
  layer: 0 | 1 | 2,
): { x: number; y: number } {
  const f = LAYER_DEPTH[layer]
  return {
    x: (centerPx.x - headPx.x) * f,
    y: (centerPx.y - headPx.y) * f,
  }
}

/** 画质档位下的装饰绘制数（docs/05 第 5 节：中=减半，低=关闭） */
export function decorDrawCount(decor: DecorInstance[], quality: Quality): number {
  if (quality === "low") return 0
  if (quality === "mid") return Math.ceil(decor.length / 2)
  return decor.length
}

/** 绘制全部装饰（前景层，半透明，独立周期） */
export function drawDecor(
  ctx: CanvasRenderingContext2D,
  decor: DecorInstance[],
  theme: Theme,
  t: number,
  offset: { x: number; y: number },
  w: number,
  h: number,
  quality: Quality,
): void {
  const count = decorDrawCount(decor, quality)
  for (let i = 0; i < count; i++) {
    const d = decor[i]
    const p = cyclePhase(t, d.period, d.phase)
    const ox = offset.x * LAYER_DEPTH[d.layer] * 3
    const oy = offset.y * LAYER_DEPTH[d.layer] * 3
    const x = ((d.x + ox) % (w + 20)) - 10
    let y = ((d.y + oy) % (h + 20)) - 10
    ctx.save()
    ctx.globalAlpha = 0.55
    switch (d.kind) {
      case "firefly":
        // 萤火虫：黄绿光点脉动漂移
        ctx.fillStyle = "#d8ff5c"
        ctx.globalAlpha = 0.25 + 0.55 * easeInOutSine(p)
        ctx.beginPath()
        ctx.arc(x + Math.sin(p * Math.PI * 2) * 8, y + Math.cos(p * Math.PI * 3) * 5, d.size, 0, Math.PI * 2)
        ctx.fill()
        break
      case "leaf":
        // 落叶：从上到下 + 水平摇摆
        y = ((d.y + p * h) % h) - 10
        ctx.fillStyle = "#6fbf4a"
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.ellipse(x + Math.sin(p * Math.PI * 4) * 8, y, d.size * 1.6, d.size * 0.8, p * 6, 0, Math.PI * 2)
        ctx.fill()
        break
      case "light":
        // 浮光斑：缓慢漂移亮斑
        ctx.fillStyle = "#bfff8a"
        ctx.globalAlpha = 0.08 + 0.12 * easeInOutSine(p)
        ctx.beginPath()
        ctx.arc(x + Math.sin(p * Math.PI * 2) * 12, y + Math.cos(p * Math.PI * 2) * 8, d.size * 3, 0, Math.PI * 2)
        ctx.fill()
        break
      case "torch":
        // 火把光晕：火焰摇曳
        ctx.fillStyle = "#ff9d3c"
        ctx.globalAlpha = 0.2 + 0.25 * easeInOutSine(p)
        ctx.beginPath()
        ctx.arc(x, y, d.size * 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#ffd166"
        ctx.globalAlpha = 0.5
        const fy = Math.sin(p * Math.PI * 4) * 2
        ctx.beginPath()
        ctx.arc(x, y - 3 + fy, d.size, 0, Math.PI * 2)
        ctx.fill()
        break
      case "dust":
        // 飘尘：缓慢上浮
        y = ((d.y - p * h * 0.5) % h + h) % h
        ctx.fillStyle = "#cbbfa8"
        ctx.globalAlpha = 0.3
        ctx.fillRect(x, y, 1, 1)
        break
      case "bat":
        // 蝙蝠影：周期性掠过（仅在上方 1/4）
        ctx.fillStyle = "#1a1208"
        ctx.globalAlpha = 0.6
        const bx = ((p - 0.5) * (w + 60)) - 30
        const by = h * 0.12 + Math.sin(p * Math.PI * 3) * 12
        ctx.beginPath()
        ctx.ellipse(bx, by, 6, 3, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(bx - 5, by - 2, 3, 2, -0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(bx + 5, by - 2, 3, 2, 0.4, 0, Math.PI * 2)
        ctx.fill()
        break
      case "geo":
        // 悬浮几何：旋转 + 浮动
        ctx.translate(x, y + Math.sin(p * Math.PI * 2) * 6)
        ctx.rotate(p * Math.PI * 2)
        ctx.fillStyle = theme.palette.accent
        ctx.globalAlpha = 0.35
        ctx.fillRect(-d.size * 2, -d.size * 2, d.size * 4, d.size * 4)
        ctx.fillStyle = theme.palette.food
        ctx.globalAlpha = 0.25
        ctx.fillRect(-d.size, -d.size, d.size * 2, d.size * 2)
        break
      case "orbit":
        // 轨道光点：公转
        ctx.fillStyle = "#9db4ff"
        ctx.globalAlpha = 0.5
        const ox2 = Math.cos(p * Math.PI * 2) * 14
        const oy2 = Math.sin(p * Math.PI * 2) * 10
        ctx.beginPath()
        ctx.arc(x + ox2, y + oy2, d.size, 0, Math.PI * 2)
        ctx.fill()
        break
      case "bubble":
        // 气泡：自下而上 + 摇摆
        y = ((d.y - p * h) % h + h) % h
        ctx.strokeStyle = "#8fd8ff"
        ctx.globalAlpha = 0.45
        ctx.beginPath()
        ctx.arc(x + Math.sin(p * Math.PI * 3) * 6, y, d.size, 0, Math.PI * 2)
        ctx.stroke()
        break
      case "kelp":
        // 水草：底部固定，顶部摆动
        ctx.strokeStyle = "#2e9e6b"
        ctx.globalAlpha = 0.6
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, h - 4)
        const sway = Math.sin(p * Math.PI * 2) * 6
        ctx.quadraticCurveTo(x + sway, h - d.size * 8, x + sway * 1.5, h - d.size * 16)
        ctx.stroke()
        break
      case "plankton":
        // 浮游生物：游动光点明灭
        ctx.fillStyle = "#7fe3ff"
        ctx.globalAlpha = 0.2 + 0.5 * easeInOutSine(p)
        ctx.beginPath()
        ctx.arc(x + Math.sin(p * Math.PI * 4) * 10, y + Math.cos(p * Math.PI * 3) * 6, d.size * 0.8, 0, Math.PI * 2)
        ctx.fill()
        break
    }
    ctx.restore()
  }
}
