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

/** 接触阴影（整体底部）+ 底座填充（消灭"看不见的障碍点"，docs/10 坑 22） */
export function drawEntityAo(
  ctx: CanvasRenderingContext2D,
  e: ObstacleEntity,
  theme: Theme,
): void {
  const b = entityBounds(e)
  const a = theme.texture.ao
  // 底座填充：覆盖全部碰撞格，保证碰撞区可见（0.35 保证深背景下可辨）
  ctx.fillStyle = "#000000"
  ctx.globalAlpha = 0.35
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

/** 主绘制入口（注意：switch 内禁止 return 退出——必须执行末尾 restore，docs/10 坑 23） */
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
    case "tree": drawTree(ctx, b.w, b.h, theme, t); break
    case "boulder": drawBoulder(ctx, b.w, b.h, theme); break
    case "vinewall": drawVineWall(ctx, b.w, b.h, theme, t); break
    case "pillar": drawPillar(ctx, b.w, b.h, theme); break
    case "altar": drawAltar(ctx, b.w, b.h, theme, t); break
    case "cage": drawCage(ctx, b.w, b.h, theme, t); break
    case "prismBig": drawPrismBig(ctx, b.w, b.h, theme, t); break
    case "obelisk": drawObelisk(ctx, b.w, b.h, theme, t); break
    case "ring": drawRing(ctx, b.w, b.h, theme, t); break
    case "reef": drawReef(ctx, b.w, b.h, theme, t); break
    case "wreck": drawWreck(ctx, b.w, b.h, theme, t); break
    case "anemone": drawAnemone(ctx, b.w, b.h, theme, t); break
    // 地形（平铺，docs/12 第 3 节）
    case "pond": drawPond(ctx, b.w, b.h, theme, t); break
    case "brambles": drawBrambles(ctx, b.w, b.h, theme, t); break
    case "lavacrack": drawLava(ctx, b.w, b.h, theme, t); break
    case "rubble": drawRubble(ctx, b.w, b.h, theme); break
    case "crystal": drawCrystal(ctx, b.w, b.h, theme, t); break
    case "voidpit": drawVoidpit(ctx, b.w, b.h, theme, t); break
    case "sandbank": drawSandbank(ctx, b.w, b.h, theme); break
    case "kelpfield": drawKelpfield(ctx, b.w, b.h, theme, t); break
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
  // 门内光膜（明显可见的能量场，docs/10 坑 22：碰撞=可见）
  ctx.fillStyle = theme.palette.accent
  ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t * 2)
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
  // 船体（倾斜弧线，占满上半格——docs/10 坑 22：碰撞=可见）
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.moveTo(2, h - 3)
  ctx.quadraticCurveTo(w * 0.3, h * 0.28, w * 0.75, h * 0.45)
  ctx.lineTo(w - 3, h - 3)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = "#6b4a2f"
  ctx.beginPath()
  ctx.moveTo(3, h - 4)
  ctx.quadraticCurveTo(w * 0.3, h * 0.32, w * 0.75, h * 0.5)
  ctx.lineTo(w - 4, h - 4)
  ctx.closePath()
  ctx.fill()
  // 甲板木纹
  ctx.strokeStyle = "rgba(0,0,0,0.3)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(w * 0.2, h - 4)
  ctx.lineTo(w * 0.32, h * 0.38)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(w * 0.5, h - 4)
  ctx.lineTo(w * 0.55, h * 0.42)
  ctx.stroke()
  // 破洞
  ctx.fillStyle = dark
  ctx.beginPath()
  ctx.arc(w * 0.55, h - 4, 3, 0, Math.PI * 2)
  ctx.fill()
  // 斜插桅杆（顶部可见，填充上半格）
  ctx.fillStyle = "#4a3a28"
  ctx.save()
  ctx.translate(w * 0.28, h * 0.5)
  ctx.rotate(-0.7)
  ctx.fillRect(-1, -h * 0.45, 2, h * 0.45)
  ctx.restore()
  // 破帆布（覆盖右上格，docs/10 坑 22：全格可见）
  ctx.fillStyle = "rgba(200,190,170,0.5)"
  ctx.beginPath()
  ctx.moveTo(w * 0.28, h * 0.08)
  ctx.lineTo(w * 0.8, h * 0.05)
  ctx.lineTo(w * 0.78, h * 0.52)
  ctx.lineTo(w * 0.28, h * 0.52)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = "rgba(255,255,255,0.15)"
  ctx.beginPath()
  ctx.moveTo(w * 0.32, h * 0.12)
  ctx.lineTo(w * 0.42, h * 0.1)
  ctx.lineTo(w * 0.4, h * 0.3)
  ctx.lineTo(w * 0.32, h * 0.32)
  ctx.closePath()
  ctx.fill()
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

// ---------- 地形（平铺，docs/12 第 3 节） ----------

/** 水塘：深蓝水面 + 波光 + 岸边亮边（提亮水面，docs/10 坑 22：与背景区分） */
function drawPond(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 水底（提亮，与背景明显区分）
  ctx.fillStyle = "#1d3a66"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 5)
  ctx.fill()
  // 岸边亮边（双圈）
  ctx.strokeStyle = "#3a6ea5"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(2, 2, w - 4, h - 4, 4)
  ctx.stroke()
  ctx.strokeStyle = "rgba(255,255,255,0.25)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(3, 3, w - 6, h - 6, 3)
  ctx.stroke()
  // 波光（sin 闪烁）
  for (let i = 0; i < 5; i++) {
    const x = 4 + (i / 4) * (w - 8)
    const y = 4 + ((i * 7) % Math.max(1, h - 8))
    const g = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.3)
    ctx.fillStyle = "#8fd8ff"
    ctx.globalAlpha = 0.35 + 0.45 * g
    ctx.fillRect(x, y, 3, 1)
  }
  ctx.globalAlpha = 1
  void dark
}

/** 荆棘丛：深绿刺丛 + 亮绿轮廓 + 刺点 + 浆果警告色（docs/10 坑 22 对比度） */
function drawBrambles(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 刺丛底（提亮）
  ctx.fillStyle = "#2a4a30"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 4)
  ctx.fill()
  // 亮绿轮廓（与背景区分）
  ctx.strokeStyle = "#4a7a4f"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, 3)
  ctx.stroke()
  // 刺簇
  for (let i = 0; i < 8; i++) {
    const x = 3 + ((i * 13) % Math.max(1, w - 8))
    const y = 3 + ((i * 29) % Math.max(1, h - 8))
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.moveTo(x, y + 3)
    ctx.lineTo(x + 2, y - 1)
    ctx.lineTo(x + 4, y + 3)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "#4f8a58"
    ctx.beginPath()
    ctx.moveTo(x + 0.5, y + 3)
    ctx.lineTo(x + 2, y)
    ctx.lineTo(x + 3.5, y + 3)
    ctx.closePath()
    ctx.fill()
  }
  // 浆果（警告色）
  const g = 0.5 + 0.5 * Math.sin(t * 3)
  ctx.fillStyle = theme.palette.food
  ctx.globalAlpha = 0.7 + 0.3 * g
  ctx.beginPath()
  ctx.arc(w * 0.3, h * 0.4, 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

/** 熔岩裂缝：黑缝 + 发光内核（脉动）+ 火星（底提亮+橙红描边，docs/10 坑 22） */
function drawLava(ctx: CanvasRenderingContext2D, w: number, h: number, _theme: Theme, t: number): void {
  // 裂缝底（提亮）
  ctx.fillStyle = "#2a1a12"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 3)
  ctx.fill()
  // 橙红描边（与地牢 bg 区分）
  ctx.strokeStyle = "#b85a2a"
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, 2)
  ctx.stroke()
  ctx.globalAlpha = 1
  // 发光内核（波浪脉动）
  const g = 0.5 + 0.5 * Math.sin(t * 4)
  ctx.fillStyle = "#e07b39"
  ctx.globalAlpha = 0.4 + 0.5 * g
  ctx.beginPath()
  for (let x = 2; x <= w - 2; x += 3) {
    const y = h / 2 + Math.sin(x / 5 + t * 3) * (h * 0.22)
    if (x === 2) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.fillStyle = "#ffb347"
  ctx.globalAlpha = 0.5 + 0.4 * g
  ctx.beginPath()
  for (let x = 3; x <= w - 3; x += 4) {
    const y = h / 2 + Math.sin(x / 5 + t * 3) * (h * 0.22)
    if (x === 3) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.globalAlpha = 1
  // 火星（上飘）
  const mx = ((t * 6) % w)
  ctx.fillStyle = "#ffd166"
  ctx.globalAlpha = 0.8
  ctx.fillRect(mx, 2, 1, 2)
  ctx.globalAlpha = 1
}

/** 碎石堆：灰石块 + 深缝 + 高光 + 亮轮廓（docs/10 坑 22 对比度） */
function drawRubble(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme): void {
  const dark = theme.palette.outline
  ctx.fillStyle = "#352e24"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 4)
  ctx.fill()
  // 亮灰轮廓
  ctx.strokeStyle = "#6a5f50"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, 3)
  ctx.stroke()
  // 碎石块
  const stones = [[3, 3, 7, 6], [11, 2, 8, 5], [5, 10, 9, 7], [15, 9, 6, 6], [2, 16, 8, 5], [12, 16, 7, 5]]
  for (const [sx, sy, sw, sh] of stones) {
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.roundRect(sx + 1, sy + 1, sw, sh, 2)
    ctx.fill()
    ctx.fillStyle = "#4a4036"
    ctx.beginPath()
    ctx.roundRect(sx, sy, sw, sh, 2)
    ctx.fill()
    // 高光
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.fillRect(sx + 1, sy + 1, sw - 2, 2)
  }
  // 骨白点缀
  ctx.fillStyle = "#d8cfc0"
  ctx.globalAlpha = 0.6
  ctx.fillRect(w * 0.62, h * 0.35, 2, 2)
  ctx.fillRect(w * 0.3, h * 0.7, 2, 2)
  ctx.globalAlpha = 1
}

/** 水晶簇：基岩 + 多根晶柱 + 棱线高光 + 微光（基岩提亮，docs/10 坑 22） */
function drawCrystal(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 基岩（提亮 + 亮边）
  ctx.fillStyle = "#2e3348"
  ctx.beginPath()
  ctx.roundRect(1, h * 0.6, w - 2, h * 0.4, 3)
  ctx.fill()
  ctx.strokeStyle = "#4a5270"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(1.5, h * 0.6, w - 3, h * 0.4, 3)
  ctx.stroke()
  // 晶柱（青/品红/蓝）：[x比例, 高度比例, 半宽, 颜色]
  const crystals: [number, number, number, string][] = [
    [w * 0.2, 0.55, 5, "#29c4c4"],
    [w * 0.42, 0.4, 7, "#e86aff"],
    [w * 0.66, 0.5, 6, "#4da6ff"],
    [w * 0.85, 0.65, 4, "#29c4c4"],
  ]
  const g = 0.5 + 0.5 * Math.sin(t * 2)
  for (const [cx, ch, cw, col] of crystals) {
    const hh = h * ch
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.moveTo(cx - cw / 2 - 1, h * 0.6)
    ctx.lineTo(cx, h * 0.6 - hh - 1)
    ctx.lineTo(cx + cw / 2 + 1, h * 0.6)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.moveTo(cx - cw / 2, h * 0.6)
    ctx.lineTo(cx, h * 0.6 - hh)
    ctx.lineTo(cx + cw / 2, h * 0.6)
    ctx.closePath()
    ctx.fill()
    // 棱线高光
    ctx.fillStyle = "rgba(255,255,255,0.35)"
    ctx.beginPath()
    ctx.moveTo(cx - cw * 0.18, h * 0.6)
    ctx.lineTo(cx - cw * 0.05, h * 0.6 - hh * 0.9)
    ctx.lineTo(cx + cw * 0.1, h * 0.6)
    ctx.closePath()
    ctx.fill()
    // 顶部光点
    ctx.fillStyle = "#ffffff"
    ctx.globalAlpha = 0.4 + 0.5 * g
    ctx.fillRect(cx - 1, h * 0.6 - hh - 2, 2, 2)
    ctx.globalAlpha = 1
  }
}

/** 虚空坑：黑洞 + 边缘亮线 + 旋纹（环形中空形状由 shape 决定） */
function drawVoidpit(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  // 洞底
  ctx.fillStyle = "#05060d"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 4)
  ctx.fill()
  // 边缘亮线（青）
  ctx.strokeStyle = theme.palette.accent
  ctx.globalAlpha = 0.6
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(2, 2, w - 4, h - 4, 3)
  ctx.stroke()
  ctx.globalAlpha = 1
  // 内旋光纹
  for (let i = 0; i < 3; i++) {
    const ang = t * 1.5 + (i * Math.PI * 2) / 3
    const r = Math.min(w, h) * 0.28
    const x = w / 2 + Math.cos(ang) * r * 0.5
    const y = h / 2 + Math.sin(ang) * r * 0.5
    ctx.fillStyle = "#4da6ff"
    ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 3 + i)
    ctx.beginPath()
    ctx.arc(x, y, 1.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  // 边缘碎块
  ctx.fillStyle = dark
  ctx.fillRect(3, h / 2, 3, 2)
  ctx.fillRect(w - 6, h * 0.3, 3, 2)
}

/** 沙洲：沙底 + 斑点 + 湿边 + 贝壳 */
function drawSandbank(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme): void {
  const dark = theme.palette.outline
  ctx.fillStyle = "#8a7a4a"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 4)
  ctx.fill()
  // 斑点纹理
  for (let i = 0; i < 12; i++) {
    const x = 3 + ((i * 17) % Math.max(1, w - 6))
    const y = 3 + ((i * 31) % Math.max(1, h - 6))
    ctx.fillStyle = i % 2 ? "#a08a55" : "#7a6a40"
    ctx.fillRect(x, y, 2, 2)
  }
  // 湿沙暗边（右下）
  ctx.fillStyle = "rgba(0,0,0,0.2)"
  ctx.fillRect(1, h - 3, w - 2, 2)
  ctx.fillRect(w - 3, 1, 2, h - 2)
  // 贝壳点
  ctx.fillStyle = "#e8dcc0"
  ctx.beginPath()
  ctx.arc(w * 0.3, h * 0.35, 1.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(w * 0.7, h * 0.65, 1.2, 0, Math.PI * 2)
  ctx.fill()
  void dark
}

/** 海藻林：暗绿海藻丛 + 顶部摇曳 + 气泡（提亮+亮边，docs/10 坑 22） */
function drawKelpfield(ctx: CanvasRenderingContext2D, w: number, h: number, theme: Theme, t: number): void {
  const dark = theme.palette.outline
  ctx.fillStyle = "#1a4a30"
  ctx.beginPath()
  ctx.roundRect(1, 1, w - 2, h - 2, 4)
  ctx.fill()
  // 亮边（与深海 bg 区分）
  ctx.strokeStyle = "#2e7a4a"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(1.5, 1.5, w - 3, h - 3, 3)
  ctx.stroke()
  // 海藻条（摇摆）
  for (let i = 0; i < 6; i++) {
    const x = 3 + (i / 5) * (w - 6)
    const sway = Math.sin(t * 2 + i * 0.9) * 3
    ctx.strokeStyle = i % 2 ? "#2e7a48" : "#3a9a58"
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(x, h - 1)
    ctx.quadraticCurveTo(x + sway * 0.5, h * 0.55, x + sway, h * 0.2)
    ctx.stroke()
  }
  // 气泡
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.3 + i / 3) % 1
    ctx.strokeStyle = "#8fd8ff"
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.arc(w * (0.25 + 0.5 * (i / 2)), h * (1 - p * 0.8), 1.2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  void dark
}
