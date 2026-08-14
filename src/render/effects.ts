// ============================================================
// render/effects.ts —— 粒子系统（对象池 + 数量上限，docs/05 1.1）
// 主题粒子：leaf / ember / shard / bubble
// ============================================================
import type { Theme } from "../game/core/types"

export type ParticleKind = "leaf" | "ember" | "shard" | "bubble" | "starburst"

interface Particle {
  active: boolean
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rot: number
  vrot: number
  hueShift: number
}

const MAX_PARTICLES = 120 // docs/02 3.5 上限
const POOL_SIZE = MAX_PARTICLES

export class ParticleSystem {
  private pool: Particle[] = []
  private cursor = 0

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push({
        active: false, kind: "leaf", x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 2, color: "#fff", rot: 0, vrot: 0, hueShift: 0,
      })
    }
  }

  /** 发射粒子（主题色），数量超限时丢弃最旧 */
  spawn(
    kind: ParticleKind,
    x: number,
    y: number,
    count: number,
    palette: string[],
    opts?: Partial<Pick<Particle, "vx" | "vy" | "size" | "maxLife" | "vrot">>,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.pool[this.cursor]
      this.cursor = (this.cursor + 1) % POOL_SIZE
      p.active = true
      p.kind = kind
      p.x = x
      p.y = y
      const ang = Math.random() * Math.PI * 2
      const spd = 20 + Math.random() * 40
      p.vx = opts?.vx ?? Math.cos(ang) * spd
      p.vy = opts?.vy ?? Math.sin(ang) * spd - 15
      p.maxLife = opts?.maxLife ?? 0.5 + Math.random() * 0.4
      p.life = p.maxLife
      p.size = opts?.size ?? 2 + Math.random() * 2
      p.color = palette[Math.floor(Math.random() * palette.length)]
      p.rot = Math.random() * Math.PI * 2
      p.vrot = opts?.vrot ?? (Math.random() - 0.5) * 6
      p.hueShift = Math.random() * 10
    }
  }

  /** 死亡碎裂（docs/02 3.3 事件反馈链） */
  spawnBurst(x: number, y: number, palette: string[]): void {
    this.spawn("shard", x, y, 14, palette, { maxLife: 0.7 })
  }

  /** 复活圣光 */
  spawnRevive(x: number, y: number, color: string): void {
    this.spawn("starburst", x, y, 16, [color, "#ffffff"], { maxLife: 0.8, size: 3 })
  }

  update(dt: number): void {
    for (const p of this.pool) {
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      p.vy += 60 * dt // 重力（bubble 反重力在 draw 用？统一重力）
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vrot * dt
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.pool) {
      if (!p.active) continue
      const alpha = Math.min(1, p.life / (p.maxLife * 0.6))
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      switch (p.kind) {
        case "leaf":
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          break
        case "ember":
          ctx.fillRect(-1, -p.size / 2, 2, p.size)
          break
        case "shard":
          ctx.beginPath()
          ctx.moveTo(0, -p.size / 2)
          ctx.lineTo(p.size / 2, 0)
          ctx.lineTo(0, p.size / 2)
          ctx.lineTo(-p.size / 2, 0)
          ctx.closePath()
          ctx.fill()
          break
        case "bubble":
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.strokeStyle = p.color
          ctx.lineWidth = 1
          ctx.stroke()
          break
        case "starburst":
          ctx.beginPath()
          ctx.arc(0, 0, p.size, 0, Math.PI * 2)
          ctx.fill()
          break
      }
      ctx.restore()
    }
  }

  clear(): void {
    for (const p of this.pool) p.active = false
  }
}

/** 吃食物粒子颜色板（按主题，docs/09） */
export function eatPalette(theme: Theme): string[] {
  switch (theme.anim.eatParticle) {
    case "leaf": return [theme.palette.snakeA, theme.palette.obstacle, theme.palette.food]
    case "ember": return ["#ff8c42", "#ffd166", theme.palette.accent]
    case "shard": return [theme.palette.snakeA, theme.palette.snakeB, theme.palette.food]
    case "bubble": return ["#7fd8ff", theme.palette.accent, "#ffffff"]
  }
}
