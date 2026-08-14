// ============================================================
// debug/validate.ts —— 地图/主题数据校验器（docs/06 第 1.2 节）
// 强制 docs/02 1.4 风格量化规范 + docs/09 定案，数据写错开发期立刻报错
// ============================================================
import type { MapData, Theme, DynamicObstacle } from "../game/core/types"
import { MAPS, THEMES } from "../game/maps"

const HEX_RE = /^#[0-9a-fA-F]{6}$/
const PALETTE_SLOTS = [
  "bg", "grid", "border", "accent", "food",
  "snakeA", "snakeB", "obstacle", "outline", "uiText",
] as const

/** 全局风格量化值（docs/02 1.4，改动必须先改文档） */
export const STYLE_RULES = {
  radius: 4, // 16px 格画布圆角（docs/09：与星露谷 16px tile 同规格）
  shadowOffset: 4,
  animDurMin: 150,
  animDurMax: 450,
  decorTotalMin: 20,
  decorTotalMax: 60,
  parallaxLayers: 3,
} as const

const MOTIONS: DynamicObstacle["motion"][] = ["pulse", "patrol", "gate", "drift"]

export function validateMap(map: MapData): string[] {
  const e: string[] = []
  const tag = `[map:${map.id}]`
  if (!map.id) e.push(`${tag} 缺少 id`)
  if (!map.name) e.push(`${tag} 缺少 name`)
  if (map.grid.w <= 0 || map.grid.h <= 0) e.push(`${tag} 网格尺寸非法`)
  const inGrid = (c: { x: number; y: number }) =>
    c.x >= 0 && c.y >= 0 && c.x < map.grid.w && c.y < map.grid.h
  if (!inGrid(map.spawn)) e.push(`${tag} 出生点越界 ${JSON.stringify(map.spawn)}`)
  if (!THEMES.some((t) => t.id === map.themeId)) e.push(`${tag} themeId 不存在: ${map.themeId}`)
  if (typeof map.decorSeed !== "number") e.push(`${tag} decorSeed 缺失`)

  // 障碍重叠检查（静态+复合+动态）
  const occupied = new Set<string>()
  for (const c of map.staticObstacles) {
    if (!inGrid(c)) { e.push(`${tag} 静态障碍越界 ${JSON.stringify(c)}`); continue }
    const k = `${c.x},${c.y}`
    if (occupied.has(k)) e.push(`${tag} 静态障碍重叠 ${k}`)
    occupied.add(k)
  }
  // 复合障碍：shape 至少含 {0,0}、不越界、不重叠、id 唯一
  const entityIds = new Set<string>()
  for (const ent of map.entities) {
    if (entityIds.has(ent.id)) e.push(`${tag} 实体 id 重复: ${ent.id}`)
    entityIds.add(ent.id)
    if (!ent.shape.some((s) => s.x === 0 && s.y === 0)) e.push(`${tag} 实体 ${ent.id} shape 缺少锚点 {0,0}`)
    for (const s of ent.shape) {
      const abs = { x: ent.origin.x + s.x, y: ent.origin.y + s.y }
      if (!inGrid(abs)) e.push(`${tag} 实体 ${ent.id} 越界 ${JSON.stringify(abs)}`)
      const k = `${abs.x},${abs.y}`
      if (occupied.has(k)) e.push(`${tag} 实体 ${ent.id} 重叠 ${k}`)
      occupied.add(k)
    }
  }
  for (const d of map.dynamicObstacles) {
    if (!inGrid(d.cell)) e.push(`${tag} 动态障碍越界 ${JSON.stringify(d.cell)}`)
    if (!MOTIONS.includes(d.motion)) e.push(`${tag} motion 非法: ${d.motion}`)
    if (d.params.range < 0) e.push(`${tag} params.range 非法`)
    if (d.params.speed <= 0) e.push(`${tag} params.speed 非法`)
    if (d.params.phase < 0 || d.params.phase > Math.PI * 2) e.push(`${tag} params.phase 非法`)
    if (d.motion === "patrol" && d.target && !inGrid(d.target)) e.push(`${tag} patrol 目标越界`)
    const k = `${d.cell.x},${d.cell.y}`
    if (occupied.has(k)) e.push(`${tag} 动态障碍与静态重叠 ${k}`)
    occupied.add(k)
  }
  return e
}

export function validateTheme(t: Theme): string[] {
  const e: string[] = []
  const tag = `[theme:${t.id}]`
  for (const slot of PALETTE_SLOTS) {
    const v = t.palette[slot]
    if (!v) e.push(`${tag} 缺少色板槽 ${slot}`)
    else if (!HEX_RE.test(v)) e.push(`${tag} 色板槽 ${slot} 非法色值: ${v}`)
  }
  if (t.radius !== STYLE_RULES.radius) e.push(`${tag} radius 必须为 ${STYLE_RULES.radius}（docs/02 1.4）`)
  if (t.shadow.offset !== STYLE_RULES.shadowOffset) e.push(`${tag} shadow.offset 必须为 ${STYLE_RULES.shadowOffset}`)
  if (t.anim.dur < STYLE_RULES.animDurMin || t.anim.dur > STYLE_RULES.animDurMax)
    e.push(`${tag} anim.dur 超出范围（${STYLE_RULES.animDurMin}~${STYLE_RULES.animDurMax}）`)
  if (t.parallax.layers !== STYLE_RULES.parallaxLayers) e.push(`${tag} parallax.layers 必须为 3`)

  // 装饰实例数范围（docs/02 1.4：20~60）
  const total = t.bgDecor.reduce((s, d) => s + d.count, 0)
  if (total < STYLE_RULES.decorTotalMin || total > STYLE_RULES.decorTotalMax)
    e.push(`${tag} 装饰实例总数 ${total} 超出范围（20~60）`)
  if (t.bgDecor.length < 2) e.push(`${tag} 装饰种类必须 ≥ 2（docs/02 3.6）`)

  // 颜色合法性
  for (const c of [t.palette.bg, t.palette.grid, t.palette.border, t.palette.accent, t.palette.food,
    t.palette.snakeA, t.palette.snakeB, t.palette.obstacle, t.palette.outline, t.palette.uiText]) {
    if (c && !HEX_RE.test(c)) e.push(`${tag} 非法色值: ${c}`)
  }
  return e
}

/** 校验全部地图与主题，返回所有错误 */
export function validateAll(): string[] {
  const errors: string[] = []
  for (const m of MAPS) errors.push(...validateMap(m))
  for (const t of THEMES) errors.push(...validateTheme(t))

  // 跨图唯一性
  const mapIds = MAPS.map((m) => m.id)
  if (new Set(mapIds).size !== mapIds.length) errors.push("[registry] 地图 id 重复")
  const themeIds = THEMES.map((t) => t.id)
  if (new Set(themeIds).size !== themeIds.length) errors.push("[registry] 主题 id 重复")
  return errors
}
