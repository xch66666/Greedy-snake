// ============================================================
// render/entities.ts —— 复合障碍物整体绘制（docs/09：多格整体 + 细节）
// 每个 kind 按包围盒整体绘制（跨格），含阴影/高光/纹理细节
// ============================================================
import type { ObstacleEntity, Theme } from "../game/core/types"
import { CELL } from "./camera"

/** 实体包围盒（像素） */
export function entityBounds(e: ObstacleEntity): { x: number; y: number; w: number; h: number } {
  let minX = 0, minY = 0, maxX = 0, maxY = 0
  for (const s of e.shape) {
    if (s.x < minX) minX = s.x
    if (s.y < minY) minY = s.y
    if (s.x > maxX) maxX = s.x
    if (s.y > maxY) maxY = s.y
  }
  return {
    x: (e.origin.x + minX) * CELL,
    y: (e.origin.y + minY) * CELL,
    w: (maxX - minX + 1) * CELL,
    h: (maxY - minY + 1) * CELL,
  }
}

/** 接触阴影（整体底部）+ 底座填充（消灭"看不见的障碍点"，docs/10 坑 20） */
export function drawEntityAo(
  ctx: CanvasRenderingContext2D,
  e: ObstacleEntity,
  theme: Theme,
): void {
  const b = entityBounds(e)
  const a = theme.texture.ao
  // 底座填充：覆盖全部碰撞格，保证碰撞区可见（淡化为 0.2，避免"斑驳"）
  ctx.fillStyle = "#000000"
  ctx.globalAlpha = 0.2
  ctx.beginPath()
  ctx.roundRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 4)
  ctx.fill()
  // 椭圆底部阴影
  if (a > 0) {
    ctx.globalAlpha = a * 0.45
    ctx.beginPath()
    ctx.ellipse(b.x + b.w / 2, b.y + b.h - 1, b.w * 0.42, 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/** 主绘制入口 */
export function drawEntity(
  ctx: CanvasRenderingContext2D,
  e: ObstacleEntity,
  theme: Theme,
  t: number,
): void {
  const b = entityBounds(e)
  ctx.save()
  ctx.translate(b.x, b.y)
  switch (e.kind) {
    case "tree": return drawTree(ctx, b.w, b.h, theme, t)
    case "boulder": return drawBoulder(ctx, b.w, b.h, theme)
    case "vinewall": return drawVineWall(ctx, b.w, b.h, theme, t)
    case "pillar": return drawPillar(ctx, b.w, b.h, theme)
    case "altar": return drawAltar(ctx, b.w, b.h, theme, t)
    case "cage": return drawCage(ctx, b.w, b.h, theme, t)
    case "prismBig": return drawPrismBig(ctx, b.w, b.h, theme, t)
    case "obelisk": return drawObelisk(ctx, b.w, b.h, theme, t)
    case "ring": return drawRing(ctx, b.w, b.h, theme, t)
    case "reef": return drawReef(ctx, b.w, b.h, theme, t)
    case "wreck": return drawWreck(ctx, b.w, b.h, theme, t)
    case "anemone": return drawAnemone(ctx, b.w, b.h, theme, t)
  }
  ctx.restore()
}

// ---------- 丛林（树/巨石/藤蔓墙） ----------

function drawTree(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const leafDark = theme.palette.obstacle
  const leafLight = theme.palette.snakeA
  const sway = Math.sin(t * 0.8) * 0.6
  // 树干（木纹 + 树根展开）
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 4, h - 10, 9, 10)
  ctx.fillRect(w / 2 - 6, h - 3, 13, 3)
  ctx.fillStyle = "#6b4a2f"
  ctx.fillRect(w / 2 - 3, h - 9, 7, 9)
  // 木纹横线
  ctx.strokeStyle = "rgba(0,0,0,0.35)"
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    const y = h - 7 + i * 2.5
    ctx.beginPath()
    ctx.moveTo(w / 2 - 3, y)
    ctx.lineTo(w / 2 + 3, y)
    ctx.stroke()
  }
  // 树冠轮廓
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h - 9, 6)
  ctx.fill()
  // 中层（主色）
  ctx.fillStyle = leafDark
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 11, 5)
  ctx.fill()
  // 明暗分区：左下阴影区
  ctx.fillStyle = "rgba(0,0,0,0.2)"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 11, 5)
  ctx.fill()
  ctx.fillStyle = "rgba(0,0,0,0.18)"
  ctx.beginPath()
  ctx.ellipse(w * 0.3, (h - 10) * 0.7, w * 0.3, (h - 10) * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  // 上层亮色叶簇（受光面）
  ctx.fillStyle = leafLight
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.roundRect(3 + sway, 1, w - 10, (h - 12) * 0.5, 4)
  ctx.fill()
  ctx.globalAlpha = 1
  // 叶簇锯齿边缘（星露谷式叶簇点）
  ctx.fillStyle = leafLight
  for (let i = 0; i < 6; i++) {
    const ex = 3 + (i / 5) * (w - 12)
    const ey = 2 + ((i * 37) % 5)
    ctx.beginPath()
    ctx.arc(ex, ey, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.fillRect(4, 3, 4, 2)
  // 果实（带高光）
  ctx.fillStyle = theme.palette.food
  ctx.beginPath()
  ctx.arc(w * 0.3, h * 0.42, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.62, h * 0.5, 1.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.45, h * 0.62, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.beginPath()
  ctx.arc(w * 0.3 - 0.6, h * 0.42 - 0.6, 0.7, 0, Math.PI * 2)
  ctx.fill()
}

function drawBoulder(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme): void {
  const dark = theme.palette.outline
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.ellipse(w / 2 + 2, h / 2 + 2, w * 0.42, h * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.palette.obstacle
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w * 0.42, h * 0.42, 0, 0, Math.PI * 2)
  ctx.fill()
  // 暗面（左下，星露谷式明暗分区）
  ctx.fillStyle = "rgba(0,0,0,0.22)"
  ctx.beginPath()
  ctx.ellipse(w * 0.62, h * 0.62, w * 0.26, h * 0.26, 0.4, 0, Math.PI * 2)
  ctx.fill()
  // 裂纹
  ctx.strokeStyle = dark
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.moveTo(w * 0.45, h * 0.25)
  ctx.lineTo(w * 0.55, h * 0.5)
  ctx.lineTo(w * 0.42, h * 0.7)
  ctx.stroke()
  ctx.globalAlpha = 1
  // 高光（右上）
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.beginPath()
  ctx.ellipse(w * 0.38, h * 0.3, w * 0.14, h * 0.1, -0.4, 0, Math.PI * 2)
  ctx.fill()
  // 苔藓
  ctx.fillStyle = "rgba(90,150,80,0.4)"
  ctx.beginPath()
  ctx.arc(w * 0.72, h * 0.6, 2.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawVineWall(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 木桩
  ctx.fillStyle = "#6b4a2f"
  for (let i = 0; i < 4; i++) {
    const x = (i / 3) * (w - 5) + 2
    ctx.fillRect(x, 1, 3, h - 2)
    ctx.fillStyle = dark
    ctx.fillRect(x, 1, 3, 2)
    ctx.fillStyle = "#6b4a2f"
  }
  // 缠绕藤蔓（波浪）
  ctx.strokeStyle = theme.palette.obstacle
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x <= w; x += 3) {
    const y = h / 2 + Math.sin(x / 6 + t * 1.5) * 3.5
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  // 叶片
  ctx.fillStyle = theme.palette.snakeA
  for (let i = 0; i < 5; i++) {
    const x = (i / 4) * (w - 6) + 3
    const y = h / 2 + Math.sin(x / 6 + t * 1.5) * 3.5
    ctx.beginPath()
    ctx.ellipse(x, y - 3, 2, 1.2, 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---------- 地牢（石柱/祭坛/铁笼） ----------

function drawPillar(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme): void {
  const dark = theme.palette.outline
  const stone = theme.palette.obstacle
  // 柱头
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 5, 1, 10, 3)
  ctx.fillStyle = stone
  ctx.fillRect(w / 2 - 4, 2, 8, 3)
  // 柱身（带砖纹）
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 3, 4, 6, h - 8)
  ctx.fillStyle = stone
  ctx.fillRect(w / 2 - 2, 5, 4, h - 10)
  // 砖纹
  ctx.fillStyle = "rgba(0,0,0,0.3)"
  ctx.fillRect(w / 2 - 2, h / 2, 4, 1)
  // 高光条
  ctx.fillStyle = "rgba(255,255,255,0.18)"
  ctx.fillRect(w / 2 - 2, 5, 1.4, h - 10)
  // 裂纹
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(w / 2 + 1, h * 0.4)
  ctx.lineTo(w / 2 - 1, h * 0.6)
  ctx.strokeStyle = dark
  ctx.stroke()
  ctx.globalAlpha = 1
  // 柱基
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 5, h - 4, 10, 3)
  ctx.fillStyle = stone
  ctx.fillRect(w / 2 - 4, h - 3, 8, 2)
}

function drawAltar(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const stone = theme.palette.obstacle
  const fire = theme.palette.accent
  // 基座台阶
  ctx.fillStyle = dark
  ctx.fillRect(2, h - 6, w - 4, 5)
  ctx.fillStyle = stone
  ctx.fillRect(3, h - 5, w - 6, 4)
  // 台体
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 6, h * 0.45, 12, h * 0.5)
  ctx.fillStyle = stone
  ctx.fillRect(w / 2 - 5, h * 0.46, 10, h * 0.5)
  // 顶部台面
  ctx.fillStyle = "#6b6f78"
  ctx.fillRect(w / 2 - 8, h * 0.45 - 2, 16, 4)
  // 符文（火橙发光脉动）
  const glow = 0.5 + 0.5 * Math.sin(t * 2.2)
  ctx.fillStyle = fire
  ctx.globalAlpha = 0.5 + 0.4 * glow
  ctx.fillRect(w / 2 - 2, h * 0.6, 4, 3)
  ctx.fillRect(w / 2 - 4, h * 0.68, 8, 2)
  ctx.globalAlpha = 1
  // 火盆火焰
  ctx.fillStyle = dark
  ctx.fillRect(w / 2 - 3, h * 0.42 - 5, 6, 4)
  const fy = Math.sin(t * 6) * 1
  ctx.fillStyle = fire
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.42 - 7 + fy, 2.4, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#ffd166"
  ctx.beginPath()
  ctx.ellipse(w / 2, h * 0.42 - 6 + fy, 1.2, 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawCage(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const iron = "#4a5568"
  // 笼体（竖栅栏 + 横梁）
  ctx.fillStyle = dark
  ctx.fillRect(1, 1, w - 2, h - 2)
  ctx.fillStyle = iron
  ctx.fillRect(2, 2, w - 4, h - 4)
  ctx.fillStyle = dark
  for (let x = 3; x < w - 3; x += 5) ctx.fillRect(x, 2, 2, h - 4)
  ctx.fillRect(2, h / 2 - 1, w - 4, 2)
  // 顶部拱
  ctx.fillStyle = iron
  ctx.beginPath()
  ctx.ellipse(w / 2, 2, w * 0.28, 4, 0, Math.PI, 0)
  ctx.fill()
  // 内部微光（囚禁的光点）
  const g = 0.5 + 0.5 * Math.sin(t * 3)
  ctx.fillStyle = theme.palette.food
  ctx.globalAlpha = 0.25 + 0.2 * g
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.62, 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // 锁
  ctx.fillStyle = "#ffd166"
  ctx.fillRect(w / 2 - 1.5, h - 7, 3, 5)
}

// ---------- 几何（大棱柱/方尖碑/环形门） ----------

function drawPrismBig(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const color = theme.palette.obstacle
  // 底座
  ctx.fillStyle = dark
  ctx.fillRect(3, h - 5, w - 6, 4)
  ctx.fillStyle = color
  ctx.fillRect(4, h - 4, w - 8, 3)
  // 主体菱形（旋转）
  ctx.save()
  ctx.translate(w / 2, h * 0.45)
  ctx.rotate(t * 0.4)
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.36)
  ctx.lineTo(w * 0.32, 0)
  ctx.lineTo(0, h * 0.36)
  ctx.lineTo(-w * 0.32, 0)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.3)
  ctx.lineTo(w * 0.26, 0)
  ctx.lineTo(0, h * 0.3)
  ctx.lineTo(-w * 0.26, 0)
  ctx.closePath()
  ctx.fill()
  // 高光面
  ctx.fillStyle = theme.palette.accent
  ctx.globalAlpha = 0.65
  ctx.beginPath()
  ctx.moveTo(0, -h * 0.18)
  ctx.lineTo(w * 0.14, 0)
  ctx.lineTo(0, h * 0.18)
  ctx.lineTo(-w * 0.14, 0)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()
  // 顶部悬浮光点
  const g = 0.5 + 0.5 * Math.sin(t * 4)
  ctx.fillStyle = theme.palette.food
  ctx.globalAlpha = 0.6 + 0.4 * g
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.12, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawObelisk(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const color = theme.palette.obstacle
  // 底座
  ctx.fillStyle = dark
  ctx.fillRect(1, h - 5, w - 2, 4)
  ctx.fillStyle = color
  ctx.fillRect(2, h - 4, w - 4, 3)
  // 锥体
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.moveTo(w / 2 - 4, 2)
  ctx.lineTo(w / 2 + 4, 2)
  ctx.lineTo(w / 2 + 3, h - 5)
  ctx.lineTo(w / 2 - 3, h - 5)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(w / 2 - 3, 3)
  ctx.lineTo(w / 2 + 3, 3)
  ctx.lineTo(w / 2 + 2, h - 5)
  ctx.lineTo(w / 2 - 2, h - 5)
  ctx.closePath()
  ctx.fill()
  // 侧面高光
  ctx.fillStyle = "rgba(255,255,255,0.2)"
  ctx.fillRect(w / 2 - 3, 3, 1.5, h - 8)
  // 顶部光点
  const g = 0.5 + 0.5 * Math.sin(t * 3.5)
  ctx.fillStyle = theme.palette.accent
  ctx.globalAlpha = 0.5 + 0.5 * g
  ctx.fillRect(w / 2 - 1, 0, 2, 3)
  ctx.globalAlpha = 1
}

function drawRing(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const color = theme.palette.obstacle
  // 门框立柱
  ctx.fillStyle = dark
  ctx.fillRect(1, h * 0.3, 3, h * 0.7)
  ctx.fillRect(w - 4, h * 0.3, 3, h * 0.7)
  ctx.fillStyle = color
  ctx.fillRect(2, h * 0.32, 2, h * 0.68)
  ctx.fillRect(w - 4, h * 0.32, 2, h * 0.68)
  // 弧形门楣
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.32, w * 0.28, Math.PI, 0)
  ctx.stroke()
  ctx.strokeStyle = dark
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(w / 2, h * 0.32, w * 0.28 + 1, Math.PI, 0)
  ctx.stroke()
  // 能量流（光点沿门移动）
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.4 + i / 3) % 1
    const ang = Math.PI + p * Math.PI
    const x = w / 2 + Math.cos(ang) * w * 0.28
    const y = h * 0.32 + Math.sin(ang) * w * 0.28
    ctx.fillStyle = theme.palette.accent
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(x, y, 1.6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // 门内光膜
  ctx.fillStyle = theme.palette.accent
  ctx.globalAlpha = 0.08 + 0.04 * Math.sin(t * 2)
  ctx.fillRect(4, h * 0.3, w - 8, h * 0.7)
  ctx.globalAlpha = 1
}

// ---------- 深海（珊瑚礁/沉船/海葵） ----------

function drawReef(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  const coral = theme.palette.obstacle
  // 礁石基座
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.ellipse(w / 2 + 1, h - 2, w * 0.4, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#4a5d7a"
  ctx.beginPath()
  ctx.ellipse(w / 2, h - 2, w * 0.38, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()
  // 珊瑚分枝（多枝）
  const branches = [
    [w * 0.25, h * 0.55], [w * 0.42, h * 0.4], [w * 0.6, h * 0.5], [w * 0.75, h * 0.65],
  ]
  for (const [bx, by] of branches) {
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.roundRect(bx - 2, by - 4, 4, h - by + 2, 2)
    ctx.fill()
    ctx.fillStyle = coral
    ctx.beginPath()
    ctx.roundRect(bx - 1.5, by - 3, 3, h - by + 2, 1.5)
    ctx.fill()
    // 枝头小球
    ctx.fillStyle = "#ff9ecb"
    ctx.beginPath()
    ctx.arc(bx, by - 3, 2.4, 0, Math.PI * 2)
    ctx.fill()
  }
  // 荧光脉动
  const g = 0.5 + 0.5 * Math.sin(t * 2.8)
  ctx.fillStyle = "#ff9ecb"
  ctx.globalAlpha = 0.15 + 0.15 * g
  ctx.beginPath()
  ctx.arc(w * 0.5, h * 0.45, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  // 小鱼影（游过）
  const fishX = ((t * 4) % (w + 12)) - 6
  ctx.fillStyle = "rgba(180,220,255,0.5)"
  ctx.beginPath()
  ctx.ellipse(fishX, h * 0.7, 3, 1.5, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawWreck(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 船体（倾斜弧线）
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.moveTo(2, h - 3)
  ctx.quadraticCurveTo(w * 0.3, h * 0.5, w * 0.75, h * 0.62)
  ctx.lineTo(w - 3, h - 3)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = "#6b4a2f"
  ctx.beginPath()
  ctx.moveTo(3, h - 4)
  ctx.quadraticCurveTo(w * 0.3, h * 0.55, w * 0.75, h * 0.66)
  ctx.lineTo(w - 4, h - 4)
  ctx.closePath()
  ctx.fill()
  // 甲板木纹
  ctx.strokeStyle = "rgba(0,0,0,0.3)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h - 4)
  ctx.lineTo(w * 0.32, h * 0.62)
  ctx.stroke()
  // 破洞
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.arc(w * 0.55, h - 4, 3, 0, Math.PI * 2)
  ctx.fill()
  // 斜插桅杆
  ctx.fillStyle = "#4a3a28"
  ctx.save()
  ctx.translate(w * 0.28, h * 0.55)
  ctx.rotate(-0.7)
  ctx.fillRect(-1, -h * 0.5, 2, h * 0.5)
  ctx.restore()
  // 海藻覆盖
  ctx.fillStyle = theme.palette.snakeB
  ctx.globalAlpha = 0.7
  for (let i = 0; i < 4; i++) {
    const x = (i / 3) * w * 0.7 + 3
    ctx.beginPath()
    ctx.ellipse(x, h - 2, 2, 4 + Math.sin(t * 2 + i) * 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawAnemone(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 基座
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.ellipse(w / 2, h - 1, w * 0.4, 2.5, 0, 0, Math.PI * 2)
  ctx.fill()
  // 触手（半圆丛，荧光尖端）
  for (let i = 0; i < 5; i++) {
    const x = (i / 4) * (w - 4) + 2
    const sway = Math.sin(t * 2.4 + i * 1.1) * 1.5
    ctx.strokeStyle = theme.palette.obstacle
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(x, h - 1)
    ctx.quadraticCurveTo(x + sway, h * 0.55, x + sway * 1.4, h * 0.3)
    ctx.stroke()
    // 荧光尖端
    const g = 0.5 + 0.5 * Math.sin(t * 3 + i)
    ctx.fillStyle = theme.palette.accent
    ctx.globalAlpha = 0.5 + 0.5 * g
    ctx.beginPath()
    ctx.arc(x + sway * 1.4, h * 0.3, 1.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}
