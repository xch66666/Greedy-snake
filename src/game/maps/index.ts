// ============================================================
// maps/index.ts —— 地图与主题注册表（加图 = 在此登记）
// ============================================================
import type { MapData, Theme } from "../core/types"
import { jungleMap } from "./jungle"
import { dungeonMap } from "./dungeon"
import { geometryMap } from "./geometry"
import { deepseaMap } from "./deepsea"
import { jungleTheme } from "../themes/jungle"
import { dungeonTheme } from "../themes/dungeon"
import { geometryTheme } from "../themes/geometry"
import { deepseaTheme } from "../themes/deepsea"

export const MAPS: MapData[] = [jungleMap, dungeonMap, geometryMap, deepseaMap]
export const THEMES: Theme[] = [jungleTheme, dungeonTheme, geometryTheme, deepseaTheme]

export function getMap(id: string): MapData | undefined {
  return MAPS.find((m) => m.id === id)
}

export function getTheme(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id)
}

export function themeForMap(map: MapData): Theme | undefined {
  return getTheme(map.themeId)
}
