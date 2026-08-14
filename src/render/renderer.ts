// ============================================================
// render/renderer.ts —— 主渲染器（docs/02/09）
// 每帧：静态层 → 动态障碍 → 食物 → 蛇（插值）→ 装饰 → 粒子 → 边缘光
// 纯绘制，不依赖 React；状态经 EngineView 传入
// ============================================================
import type { Cell, Direction, MapData, SnakeState, Theme } from "../game/core/types"
import { CELL, VIEW_PX_H, VIEW_PX_W, VIEW_H, VIEW_W, calcCoopView, clampCam, screenScale, type ViewSize } from "./camera"
import { DIFFICULTY_PRESETS } from "../game/core/constants"
import { obstacleCell } from "../game/core/obstacles"
import { drawAo, drawObstacleShape, renderStaticLayer } from "./staticLayer"
import { drawDecor, generateDecor, parallaxOffset, type DecorInstance } from "./decor"
import { ParticleSystem, eatPalette } from "./effects"
import { easeOutQuad, triangleWave } from "./easing"
import type { EngineView } from "../game/engine"
import type { Quality } from "../storage/schema"

const DIR_ANGLE: Record<Direction, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }

/** 蛇插值状态（渲染层私有） */
interface SnakeAnim {
  prevBody: Cell[]
  t: number
  angle: number
  scale: number // 死亡/复活动画
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private staticLayer: HTMLCanvasElement | null = null
  private decor: DecorInstance[] = []
  private particles = new ParticleSystem()
  private snakeAnims = new Map<number, SnakeAnim>()
  private lastMapKey = ""

  private view: EngineView | null = null
  private shake = 0 // 死亡震动
  showGrid = false // 调试网格叠加（F1，docs/06 1.1）
  // 相机（docs/11：大地图滚动视野，平滑跟随）
  private camX = 0
  private camY = 0
  // 动态缩放（docs/13：双人距离远时拉远视野）
  private viewW = VIEW_W
  private viewH = VIEW_H
  private lastContainerW = 0
  private lastContainerH = 0
  private lastScale = 0
  private shade = 0 // 档位切换遮罩（0~1）
  private vignetteGrad: CanvasGradient | null = null
  private vignetteKey = ""
  // 档位过渡（docs/13 第 5 点：0.35s 平滑插值 + 遮罩，不再突兀切换）
  private transFromW = VIEW_W
  private transToW = VIEW_W
  private transFromH = VIEW_H
  private transToH = VIEW_H
  private transT = 1 // 1 = 无过渡

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d")!
  }

  /** 画布尺寸适配（满屏：整数倍裁剪优先，拉伸兜底，docs/13 任何窗口无黑边） */
  fit(containerW: number, containerH: number): { scale: number; w: number; h: number } {
    this.lastContainerW = containerW
    this.lastContainerH = containerH
    const { scale, mode } = screenScale(containerW, containerH, VIEW_PX_W, VIEW_PX_H)
    this.canvas.width = VIEW_PX_W
    this.canvas.height = VIEW_PX_H
    if (mode === "stretch") {
      // 拉伸铺满（非整数倍，最近邻保持像素感）
      this.canvas.style.width = `${containerW}px`
      this.canvas.style.height = `${containerH}px`
    } else {
      this.canvas.style.width = `${VIEW_PX_W * scale}px`
      this.canvas.style.height = `${VIEW_PX_H * scale}px`
    }
    this.canvas.style.imageRendering = "pixelated"
    return { scale: mode === "stretch" ? 1 : scale, w: VIEW_PX_W, h: VIEW_PX_H }
  }

  /** 每帧渲染 */
  render(view: EngineView, dt: number, quality: Quality): void {
    this.view = view
    const map = view.map
    const theme = view.theme
    const ctx = this.ctx
    if (!map || !theme) return

    // 地图变化时重建静态层与装饰（视野画布固定，不再随地图变）
    const key = `${map.id}-${map.decorSeed}`
    if (key !== this.lastMapKey) {
      this.lastMapKey = key
      this.staticLayer = renderStaticLayer(map, theme)
      this.decor = generateDecor(map, theme)
      this.snakeAnims.clear()
      this.particles.clear()
      // 相机回到出生点中心
      this.camX = Math.max(0, map.spawn.x * CELL - VIEW_PX_W / 2)
      this.camY = Math.max(0, map.spawn.y * CELL - VIEW_PX_H / 2)
    }

    const t = view.elapsed

    // ---- 相机与动态缩放（docs/13：含 3 格边界带的世界范围）----
    const mapPxW = (map.grid.w + 6) * CELL
    const mapPxH = (map.grid.h + 6) * CELL
    // 目标视野：coop=两蛇包围盒→离散档位（40 或全图），solo=默认（docs/13 第 4 版）
    let targetView: ViewSize = { w: VIEW_W, h: VIEW_H }
    if (view.mode === "coop" && view.snakes.length === 2) {
      const a = view.snakes[0].body[0]
      const b = view.snakes[1].body[0]
      targetView = calcCoopView(Math.abs(a.x - b.x) + 1, Math.abs(a.y - b.y) + 1)
    }
    // 档位切换：启动 0.35s 平滑过渡（docs/13 第 5 点）
    if (targetView.w !== this.transToW || targetView.h !== this.transToH) {
      this.transFromW = this.viewW
      this.transFromH = this.viewH
      this.transToW = targetView.w
      this.transToH = targetView.h
      this.transT = 0
      this.shade = 1
    }
    if (this.transT < 1) {
      this.transT = Math.min(1, this.transT + dt / 0.35)
      const e = this.transT < 0.5
        ? 2 * this.transT * this.transT
        : 1 - Math.pow(-2 * this.transT + 2, 2) / 2 // easeInOutQuad
      this.viewW = this.transFromW + (this.transToW - this.transFromW) * e
      this.viewH = this.transFromH + (this.transToH - this.transFromH) * e
    } else {
      this.viewW = this.transToW
      this.viewH = this.transToH
    }
    // canvas 尺寸（像素）
    const pxW = this.viewW * CELL
    const pxH = this.viewH * CELL
    if (this.canvas.width !== pxW || this.canvas.height !== pxH) {
      const { scale, mode } = screenScale(this.lastContainerW, this.lastContainerH, pxW, pxH)
      this.canvas.width = pxW
      this.canvas.height = pxH
      if (mode === "stretch") {
        this.canvas.style.width = `${this.lastContainerW}px`
        this.canvas.style.height = `${this.lastContainerH}px`
      } else {
        this.canvas.style.width = `${pxW * scale}px`
        this.canvas.style.height = `${pxH * scale}px`
      }
      // scale 档位切换 → 遮罩过渡，避免跳变感
      if (scale !== this.lastScale) {
        this.lastScale = scale
        this.shade = 1
      }
    }

    // 跟随目标（solo=蛇头，coop=中点；用连续视野值）
    const follow = (): { x: number; y: number } => {
      const snakes = view.snakes
      if (snakes.length === 0) return { x: this.viewW * CELL / 2, y: this.viewH * CELL / 2 }
      let tx = 0
      let ty = 0
      for (const s of snakes) {
        const h = s.body[0]
        tx += (h.x * CELL + CELL / 2)
        ty += (h.y * CELL + CELL / 2)
      }
      tx /= snakes.length
      ty /= snakes.length
      return { x: tx - this.viewW * CELL / 2, y: ty - this.viewH * CELL / 2 }
    }
    const target = follow()
    const cam = clampCam(target.x, target.y, mapPxW, mapPxH, this.viewW, this.viewH)
    // 相机快速同步（dt*10）：缩放期间减少与视野变化的相位差（docs/13 震动修复）
    this.camX += (cam.x - this.camX) * Math.min(1, dt * 10)
    this.camY += (cam.y - this.camY) * Math.min(1, dt * 10)

    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(-Math.round(this.camX), -Math.round(this.camY))

    // 静态层（全图含边界带；静态层原点 = 世界(-3,-3)，docs/13 第 1 点）
    ctx.drawImage(this.staticLayer!, -3 * CELL, -3 * CELL)

    // 震动（docs/02 3.3 死亡反馈；衰减加快，避免残留到复活，docs/13 修复）
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 10)
      if (this.shake > 0) {
        ctx.translate((Math.random() - 0.5) * this.shake * 2, (Math.random() - 0.5) * this.shake * 2)
      }
    }

    // ---- 动态障碍（连续位置）----
    for (const o of map.dynamicObstacles) {
      const c = obstacleCell(o, view.obstacleT)
      if (c.x < 0 || c.y < 0) continue
      drawAo(ctx, c.x * CELL, c.y * CELL, theme)
      drawObstacleShape(ctx, theme.obstacleStyle, c.x * CELL, c.y * CELL, theme, t)
    }

    // ---- 食物（造型 + 呼吸动画）----
    for (const f of view.foods) {
      this.drawFood(ctx, f, theme, t)
    }

    // ---- 蛇（插值 + 花纹 + 卡通头）----
    for (const snake of view.snakes) {
      this.drawSnake(ctx, snake, theme, t, dt, view)
    }

    // ---- 前景装饰（视差）----
    const head = view.snakes[0]?.body[0] ?? { x: 0, y: 0 }
    const center = { x: (map.grid.w * CELL) / 2, y: (map.grid.h * CELL) / 2 }
    const po = parallaxOffset({ x: head.x * CELL, y: head.y * CELL }, center, 2)
    drawDecor(ctx, this.decor, theme, t, po, map.grid.w * CELL, map.grid.h * CELL, quality)

    // ---- 粒子 ----
    this.particles.update(dt)
    this.particles.draw(ctx)

    // ---- 调试网格叠加（F1，全图坐标，视野裁剪）----
    if (this.showGrid && view.map) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)"
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= view.map.grid.w; x++) {
        ctx.moveTo(x * CELL + 0.5, 0)
        ctx.lineTo(x * CELL + 0.5, view.map.grid.h * CELL)
      }
      for (let y = 0; y <= view.map.grid.h; y++) {
        ctx.moveTo(0, y * CELL + 0.5)
        ctx.lineTo(view.map.grid.w * CELL, y * CELL + 0.5)
      }
      ctx.stroke()
    }

    ctx.restore()

    // ---- 地图边界线（docs/13 第 1 点：视野贴边时显示边界）----
    this.drawMapBorder(ctx, theme, map)

    // ---- 食物导航指示器（docs/13：视野外食物在边缘显示箭头，屏幕空间）----
    this.drawFoodIndicators(ctx, theme)

    // ---- 食物方位常驻条（docs/13 第 3 点：单人/双人都显示最近食物距离方向）----
    this.drawFoodBar(ctx, theme, view)

    // ---- 开局倒计时（docs/13 第 2 点）----
    if (view.countdown > 0) {
      this.drawCountdown(ctx, view.countdown)
    }

    // ---- 主题边缘光 vignette（屏幕空间，docs/02 3.3）----
    this.drawVignette(ctx, theme)

    // ---- scale 档位切换遮罩（docs/13：0.35s 黑场过渡，掩盖档位跳变）----
    if (this.shade > 0) {
      this.shade = Math.max(0, this.shade - dt / 0.35)
      ctx.fillStyle = "#000000"
      ctx.globalAlpha = this.shade * 0.55
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ctx.globalAlpha = 1
    }
  }

  /** 地图边界线：视野贴地图边缘时在对应视野边缘画亮线（docs/13 第 1 点） */
  private drawMapBorder(
    ctx: CanvasRenderingContext2D,
    theme: Theme,
    map: MapData,
  ): void {
    const vw = this.canvas.width
    const vh = this.canvas.height
    // 世界范围（地图 + 3 格边界带，docs/13 第 1 点）
    const mapPxW = (map.grid.w + 6) * CELL
    const mapPxH = (map.grid.h + 6) * CELL
    ctx.strokeStyle = theme.palette.accent
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    if (this.camX <= 1) { ctx.moveTo(1.5, 0); ctx.lineTo(1.5, vh) }
    if (this.camX + vw >= mapPxW - 1) { ctx.moveTo(vw - 1.5, 0); ctx.lineTo(vw - 1.5, vh) }
    if (this.camY <= 1) { ctx.moveTo(0, 1.5); ctx.lineTo(vw, 1.5) }
    if (this.camY + vh >= mapPxH - 1) { ctx.moveTo(0, vh - 1.5); ctx.lineTo(vw, vh - 1.5) }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  /** 食物方位常驻条：左上角显示最近食物距离 + 方向（docs/13 第 3 点） */
  private drawFoodBar(
    ctx: CanvasRenderingContext2D,
    theme: Theme,
    view: EngineView,
  ): void {
    if (view.foods.length === 0) return
    const head = view.snakes[0]?.body[0]
    if (!head) return
    let best = view.foods[0]
    let bestD = Infinity
    for (const f of view.foods) {
      const d = Math.abs(f.x - head.x) + Math.abs(f.y - head.y)
      if (d < bestD) { bestD = d; best = f }
    }
    const x = 10
    const y = 34
    // 食物小圆
    ctx.fillStyle = theme.palette.food
    ctx.beginPath()
    ctx.arc(x + 5, y, 4, 0, Math.PI * 2)
    ctx.fill()
    // 距离文本
    ctx.font = '12px "Fusion Pixel 12px Proportional", monospace'
    ctx.textBaseline = "middle"
    ctx.fillStyle = theme.palette.uiText
    ctx.globalAlpha = 0.9
    ctx.fillText(`${bestD} 格`, x + 12, y + 1)
    // 方向箭头（指向食物）
    const ang = Math.atan2(best.y - head.y, best.x - head.x)
    ctx.save()
    ctx.translate(x + 58, y + 1)
    ctx.rotate(ang)
    ctx.fillStyle = theme.palette.food
    ctx.beginPath()
    ctx.moveTo(6, 0)
    ctx.lineTo(-2, -4)
    ctx.lineTo(-2, 4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.globalAlpha = 1
  }

  /** 开局倒计时大数字（docs/13 第 2 点） */
  private drawCountdown(ctx: CanvasRenderingContext2D, countdown: number): void {
    const n = Math.ceil(countdown)
    const w = this.canvas.width
    const h = this.canvas.height
    ctx.save()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = '32px "Fusion Pixel 12px Proportional", monospace'
    // 深色底圆
    ctx.fillStyle = "rgba(0,0,0,0.45)"
    ctx.beginPath()
    ctx.arc(w / 2, h / 2 - 8, 30, 0, Math.PI * 2)
    ctx.fill()
    // 数字（白字 + 深描边）
    ctx.fillStyle = "#000000"
    ctx.fillText(String(n), w / 2 + 1.5, h / 2 - 5.5)
    ctx.fillText(String(n), w / 2 - 1.5, h / 2 - 5.5)
    ctx.fillText(String(n), w / 2, h / 2 - 8 + 1.5)
    ctx.fillText(String(n), w / 2, h / 2 - 8 - 1.5)
    ctx.fillStyle = "#ffffff"
    ctx.fillText(String(n), w / 2, h / 2 - 8)
    ctx.restore()
  }

  /** 视野外食物的边缘指示器（箭头 + 食物色点，docs/13） */
  private drawFoodIndicators(
    ctx: CanvasRenderingContext2D,
    theme: Theme,
  ): void {
    const view = this.view
    if (!view) return
    const w = this.canvas.width
    const h = this.canvas.height
    const cx = w / 2
    const cy = h / 2
    for (const f of view.foods) {
      const fx = f.x * CELL + CELL / 2 - this.camX
      const fy = f.y * CELL + CELL / 2 - this.camY
      const pad = 16
      // 食物在视野内 → 不需要指示
      if (fx >= -pad && fx <= w + pad && fy >= -pad && fy <= h + pad) continue
      const ang = Math.atan2(fy - cy, fx - cx)
      // 边缘点（画布矩形边缘内缩 12px）
      const halfW = w / 2 - 12
      const halfH = h / 2 - 12
      const t = Math.min(
        Math.abs(halfW / (Math.cos(ang) || 1e-6)),
        Math.abs(halfH / (Math.sin(ang) || 1e-6)),
      )
      const ex = cx + Math.cos(ang) * t
      const ey = cy + Math.sin(ang) * t
      // 指示器：食物色三角箭头 + 中心点（脉动）
      ctx.save()
      ctx.translate(ex, ey)
      ctx.rotate(ang)
      ctx.fillStyle = theme.palette.food
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.moveTo(8, 0)
      ctx.lineTo(-3, -5)
      ctx.lineTo(-3, 5)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
      // 描边（深色轮廓保证任何背景下可见）
      ctx.strokeStyle = theme.palette.outline
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(8, 0)
      ctx.lineTo(-3, -5)
      ctx.lineTo(-3, 5)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
      // 食物色点（脉动提醒）
      const g = 0.5 + 0.5 * Math.sin(view.elapsed * 4)
      ctx.fillStyle = theme.palette.food
      ctx.globalAlpha = 0.5 + 0.4 * g
      ctx.beginPath()
      ctx.arc(ex, ey, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  // ---------- 事件特效（由桥接层订阅 engine 事件调用） ----------

  spawnEat(px: number, py: number, theme: Theme): void {
    this.particles.spawn(theme.anim.eatParticle, px, py, 10, eatPalette(theme))
  }

  spawnDeath(px: number, py: number, theme: Theme): void {
    this.particles.spawnBurst(px, py, [theme.palette.snakeA, theme.palette.snakeB, theme.palette.food])
    this.shake = 4 // 幅度适中（docs/13：原 6 过大）
  }

  spawnRevive(px: number, py: number, theme: Theme): void {
    this.particles.spawnRevive(px, py, theme.palette.accent)
  }

  spawnCombo(px: number, py: number, theme: Theme): void {
    this.particles.spawn("starburst", px, py, 6, [theme.palette.food, "#ffffff"], { maxLife: 0.5 })
  }

  // ---------- 内部绘制 ----------

  private drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: SnakeState,
    theme: Theme,
    t: number,
    dt: number,
    view: EngineView,
  ): void {
    let anim = this.snakeAnims.get(snake.player)
    if (!anim) {
      anim = { prevBody: snake.body.map((c) => ({ ...c })), t: 1, angle: DIR_ANGLE[snake.dir], scale: 1 }
      this.snakeAnims.set(snake.player, anim)
    }

    // 插值推进（docs/05 1.1：两格间滑动；docs/13 修复：prevBody 插值完成前保持旧位置）
    const cur = snake.body
    const moved = anim.prevBody.length > 0 &&
      (cur[0].x !== anim.prevBody[0].x || cur[0].y !== anim.prevBody[0].y)
    if (moved) {
      anim.t = 0
    } else if (snake.phase !== "ghost") {
      // 插值周期 = 引擎实际移动间隔（含加速，docs/13 与引擎同步）
      const interval = view.moveInterval > 0 ? view.moveInterval : 1 / DIFFICULTY_PRESETS[view.difficulty].initialSpeed
      anim.t = Math.min(1, anim.t + dt / interval)
    }
    // 头朝向平滑（docs/05 1.1）
    const target = DIR_ANGLE[snake.dir]
    let diff = target - anim.angle
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    anim.angle += diff * Math.min(1, dt * 12)

    const ease = easeOutQuad(anim.t)
    const color = snake.player === 1 ? theme.palette.snakeA : theme.palette.snakeB
    const outline = theme.palette.outline

    // 幽灵/保护期状态特效
    let alpha = 1
    let lift = 0
    if (snake.phase === "ghost") {
      alpha = 0.35 + 0.15 * Math.sin(t * 6)
      lift = Math.sin(t * 3) * 2
    } else if (snake.phase === "invincible") {
      alpha = 0.55 + 0.45 * Math.sin(t * 14)
    }

    const len = cur.length
    const u = CELL / 16 // 12px 格缩放因子
    const size = CELL - 2 // 蛇身节尺寸（留 1px 格间距更精细）
    ctx.save()
    ctx.globalAlpha = alpha
    for (let i = len - 1; i >= 0; i--) {
      const start = anim.prevBody[i] ?? cur[i]
      const px = (start.x + (cur[i].x - start.x) * ease) * CELL + CELL / 2
      const py = (start.y + (cur[i].y - start.y) * ease) * CELL + CELL / 2 - (i === 0 ? lift : 0)
      ctx.fillStyle = outline
      ctx.beginPath()
      ctx.roundRect(px - size / 2 + 1, py - size / 2 + 1, size, size, 4)
      ctx.fill() // 硬阴影
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(px - size / 2, py - size / 2, size, size, 4)
      ctx.fill()
      // 高光（立体感，docs/09 精细度升级）
      ctx.fillStyle = "rgba(255,255,255,0.18)"
      ctx.beginPath()
      ctx.roundRect(px - size / 2 + 1, py - size / 2 + 1, size - 2, Math.max(1, size * 0.3), 2)
      ctx.fill()
      // 花纹（docs/09 蛇身外观）
      this.drawPattern(ctx, theme.snakeStyle.pattern, px, py, size, i, len, color, u)
    }
    // 卡通头
    const headPos = cur[0]
    const hpx = (headPos.x + (cur[0].x - headPos.x) * ease) * CELL + CELL / 2
    const hpy = (headPos.y + (cur[0].y - headPos.y) * ease) * CELL + CELL / 2 - lift
    this.drawHead(ctx, theme.snakeStyle.head, hpx, hpy, anim.angle, color, outline, t, u)
    ctx.restore()

    // 帧尾：插值完成后才同步 prevBody（docs/13 修复"跳格"：移动后旧位置保持为插值起点）
    if (anim.t >= 1 && !moved) {
      anim.prevBody = cur.map((c) => ({ ...c }))
    }
  }

  private drawPattern(
    ctx: CanvasRenderingContext2D,
    pattern: Theme["snakeStyle"]["pattern"],
    px: number,
    py: number,
    size: number,
    i: number,
    len: number,
    color: string,
    u: number,
  ): void {
    switch (pattern) {
      case "stripe": // 条纹
        ctx.fillStyle = "rgba(0,0,0,0.25)"
        ctx.fillRect(px - size / 2 + 1, py + size / 2 - 4 * u, size - 2, 2)
        break
      case "scale": // 鳞片
        ctx.fillStyle = "rgba(255,255,255,0.2)"
        ctx.beginPath()
        ctx.arc(px, py + 1, 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px - 2.5, py + 2.5, 1.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px + 2.5, py + 2.5, 1.2, 0, Math.PI * 2)
        ctx.fill()
        break
      case "block": // 方块拼接：节间缝隙 + 内发光
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        ctx.fillRect(px - size / 2 + 1, py - size / 2 + 1, size - 2, 1)
        ctx.fillStyle = "rgba(255,255,255,0.15)"
        ctx.beginPath()
        ctx.arc(px, py, size / 2 - 2.5, 0, Math.PI * 2)
        ctx.fill()
        break
      case "gradient": // 渐变蛇：节间明度递进
        if (i > 0) {
          const f = 1 - i / len
          ctx.fillStyle = `rgba(255,255,255,${0.15 * f})`
          ctx.beginPath()
          ctx.roundRect(px - size / 2, py - size / 2, size, size, 4)
          ctx.fill()
        }
        break
    }
    void color
  }

  private drawHead(
    ctx: CanvasRenderingContext2D,
    head: Theme["snakeStyle"]["head"],
    px: number,
    py: number,
    angle: number,
    color: string,
    outline: string,
    t: number,
    u: number,
  ): void {
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(angle)
    ctx.scale(u, u) // 12px 格缩放（内部按 16px 格设计）
    const blink = Math.sin(t * 0.8) > 0.97 ? 0.2 : 1 // 眨眼（周期 ~8s）
    switch (head) {
      case "cat": {
        // 三角耳
        ctx.fillStyle = outline
        ctx.beginPath()
        ctx.moveTo(-6, -8); ctx.lineTo(-2, -2); ctx.lineTo(-10, -3); ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(6, -8); ctx.lineTo(2, -2); ctx.lineTo(10, -3); ctx.closePath()
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 1, 7, 0, Math.PI * 2)
        ctx.fill()
        // 眼睛
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(3, 0, 2.4 * blink, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#222"
        ctx.beginPath()
        ctx.arc(3.6, 0, 1.2 * blink, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case "dragon": {
        // 方头 + 双角 + 竖瞳
        ctx.fillStyle = outline
        ctx.beginPath()
        ctx.moveTo(-5, -9); ctx.lineTo(-2, -3); ctx.lineTo(-9, -4); ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(5, -9); ctx.lineTo(2, -3); ctx.lineTo(9, -4); ctx.closePath()
        ctx.fill()
        ctx.fillStyle = color
        ctx.fillRect(-7, -6, 14, 12)
        ctx.fillStyle = "#ffe9a8"
        ctx.fillRect(2, -2, 4, 2)
        // 竖瞳
        ctx.fillStyle = "#ffd166"
        ctx.fillRect(4, -4, 2, 4)
        ctx.fillStyle = "#111"
        ctx.fillRect(4.5, -3.5, 1, 3)
        break
      }
      case "robot": {
        // 方头 + 单眼扫描 + 天线
        ctx.fillStyle = outline
        ctx.fillRect(-7, -8, 14, 14)
        ctx.fillStyle = color
        ctx.fillRect(-6, -7, 12, 12)
        ctx.fillStyle = "#ffd24d"
        ctx.fillRect(-2, -10, 4, 2) // 天线
        const scan = Math.sin(t * 5) // 扫描眼
        ctx.fillStyle = "#222"
        ctx.fillRect(-4, -2, 8, 4)
        ctx.fillStyle = "#7ff0ff"
        ctx.fillRect(scan * 2, -2, 3, 4)
        break
      }
      case "fish": {
        // 圆头 + 大眼 + 背鳍
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = outline
        ctx.beginPath()
        ctx.moveTo(-2, -6); ctx.lineTo(1, -10); ctx.lineTo(4, -5); ctx.closePath()
        ctx.fill() // 背鳍
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(3, -1, 3 * blink, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#0a1e3c"
        ctx.beginPath()
        ctx.arc(3.8, -1, 1.6 * blink, 0, Math.PI * 2)
        ctx.fill()
        break
      }
    }
    ctx.restore()
  }

  private drawFood(
    ctx: CanvasRenderingContext2D,
    f: Cell,
    theme: Theme,
    t: number,
  ): void {
    const u = CELL / 16
    const px = f.x * CELL + CELL / 2
    const py = f.y * CELL + CELL / 2
    const color = theme.palette.food
    ctx.save()
    ctx.translate(px, py)
    ctx.scale(u, u)
    switch (theme.foodStyle) {
      case "berry": {
        // 红浆果：圆 + 高光 + 叶柄 + 底部阴影
        const s = 1 + 0.08 * Math.sin(t * 5.2)
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        ctx.beginPath()
        ctx.ellipse(0, 2.5, 4 * s, 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 1, 4.5 * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "rgba(255,255,255,0.55)"
        ctx.beginPath()
        ctx.arc(-1.5, -0.5, 1.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = theme.palette.obstacle
        ctx.fillRect(-1, -5, 2, 2)
        break
      }
      case "gold": {
        // 金块：方块 + 斜面高光 + 闪光 + 阴影
        ctx.fillStyle = "rgba(0,0,0,0.35)"
        ctx.fillRect(-4, 1, 10, 10)
        ctx.fillStyle = color
        ctx.fillRect(-5, -5, 10, 10)
        ctx.fillStyle = "rgba(255,255,255,0.4)"
        ctx.fillRect(-5, -5, 10, 3)
        ctx.fillStyle = "rgba(255,255,255,0.2)"
        ctx.fillRect(-5, -2, 10, 1)
        const shine = triangleWave(t, 0.8)
        ctx.fillStyle = "rgba(255,255,255,0.55)"
        ctx.fillRect(-5 + shine * 10, -4, 1.5, 8)
        break
      }
      case "energy": {
        // 能量块：菱形 + 内发光 + 脉冲 + 外晕
        const s = 1 + 0.12 * Math.sin(t * 7)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 7)
        ctx.beginPath()
        ctx.arc(0, 0, 8.5 * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.moveTo(0, -5.5 * s)
        ctx.lineTo(5.5 * s, 0)
        ctx.lineTo(0, 5.5 * s)
        ctx.lineTo(-5.5 * s, 0)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#ffffff"
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 7)
        ctx.beginPath()
        ctx.moveTo(0, -2.5 * s)
        ctx.lineTo(2.5 * s, 0)
        ctx.lineTo(0, 2.5 * s)
        ctx.lineTo(-2.5 * s, 0)
        ctx.closePath()
        ctx.fill()
        break
      }
      case "pearl": {
        // 珍珠：白圆 + 晕光 + 呼吸 + 高光
        const s = 1 + 0.1 * Math.sin(t * 4.2)
        ctx.fillStyle = theme.palette.accent
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4.2)
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(0, 0, 4.5 * s, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(-1.5, -1.5, 1.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "rgba(120,180,255,0.35)"
        ctx.beginPath()
        ctx.arc(1, 1.5, 1.2, 0, Math.PI * 2)
        ctx.fill()
        break
      }
    }
    ctx.restore()
  }

  private drawVignette(
    ctx: CanvasRenderingContext2D,
    theme: Theme,
  ): void {
    const w = this.canvas.width
    const h = this.canvas.height
    // 渐变缓存（docs/13 帧率优化：避免每帧创建渐变对象）
    const key = `${w}x${h}`
    if (!this.vignetteGrad || this.vignetteKey !== key) {
      this.vignetteKey = key
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75)
      g.addColorStop(0, "rgba(0,0,0,0)")
      g.addColorStop(1, "rgba(0,0,0,0.35)")
      this.vignetteGrad = g
    }
    ctx.fillStyle = this.vignetteGrad
    ctx.fillRect(0, 0, w, h)
    void theme
  }

  /** 蛇头像素位置（复活/死亡特效用；越界时退回最后一个合法节，防粒子画在界外） */
  headPixel(player: number): { x: number; y: number } | null {
    const s = this.view?.snakes.find((x) => x.player === player)
    const map = this.view?.map
    if (!s || !map) return null
    const h = s.body[0]
    const inGrid = h.x >= 0 && h.y >= 0 && h.x < map.grid.w && h.y < map.grid.h
    const c = inGrid ? h : (s.body[1] ?? h)
    return { x: c.x * CELL + CELL / 2, y: c.y * CELL + CELL / 2 }
  }

  /** 清理（切图/销毁） */
  clearFx(): void {
    this.particles.clear()
    this.shake = 0
  }
}
