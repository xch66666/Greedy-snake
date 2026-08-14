// ============================================================
// ui/MapSelect.tsx —— 第 2 层选图界面（docs/07 第 3 节）
// 4 卡片 + 难度切换 + 模式标签（第一层已定）+ 开始游戏
// ============================================================
import { useEffect, useRef } from "react"
import { useGame } from "./store"
import { MAPS, getMap, getTheme } from "../game/maps"
import { renderStaticLayer } from "../render/staticLayer"
import { CELL } from "../render/camera"
import { audio } from "../audio/audio"
import { applyThemeVars, setBodyBg } from "./GameCanvas"
import { loadSave } from "../storage/save"
import type { Difficulty } from "../game/core/types"

const DIFFS: { id: Difficulty; label: string }[] = [
  { id: "casual", label: "休闲" },
  { id: "normal", label: "标准" },
  { id: "hard", label: "困难" },
]

export function MapSelect(): React.JSX.Element {
  const mode = useGame((s) => s.mode)
  const difficulty = useGame((s) => s.difficulty)
  const setDifficulty = useGame((s) => s.setDifficulty)
  const selectedMapId = useGame((s) => s.selectedMapId)
  const setSelectedMap = useGame((s) => s.setSelectedMap)
  const setScreen = useGame((s) => s.setScreen)
  const setMode = useGame((s) => s.setMode)
  const thumbRefs = useRef(new Map<string, HTMLCanvasElement>())
  const save = loadSave()

  // 选中卡片换肤预览（docs/07 3：切换选中时整页预览换肤）
  useEffect(() => {
    const map = getMap(selectedMapId)
    if (map) {
      applyThemeVars(map.themeId)
      setBodyBg(map.themeId)
    }
  }, [selectedMapId])

  // 难度默认取设置存档值（docs/07 3：默认取设置弹窗中的难度值）
  useEffect(() => {
    setDifficulty(loadSave().settings.difficulty)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 程序化缩略图（真实地图数据小样，docs/07 3）
  useEffect(() => {
    for (const map of MAPS) {
      const canvas = thumbRefs.current.get(map.id)
      const theme = getTheme(map.themeId)
      if (!canvas || !theme) continue
      const layer = renderStaticLayer(map, theme)
      canvas.width = map.grid.w * CELL
      canvas.height = map.grid.h * CELL
      canvas.getContext("2d")!.drawImage(layer, 0, 0)
    }
  }, [])

  const start = (): void => {
    audio.ensure()
    audio.click()
    setScreen("playing")
  }

  const best = (mapId: string): number => {
    return mode === "solo" ? save.stats.bestScores[mapId] ?? 0 : save.stats.bestScoresCoop[mapId] ?? 0
  }

  return (
    <div className="screen" style={{ gap: 16 }}>
      <div style={{ width: "100%", maxWidth: 520, display: "flex", alignItems: "center", gap: 12 }}>
        <button className="px-btn secondary" style={{ padding: "6px 14px", fontSize: 14 }}
          onClick={() => { audio.click(); setMode("solo"); setScreen("menu") }}>
          ← 返回
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 22 }}>
          {mode === "solo" ? "单人游戏" : "双人游戏"} · 选择地图
        </div>
        <div className="seg">
          {DIFFS.map((d) => (
            <button key={d.id} className={difficulty === d.id ? "on" : ""}
              onClick={() => { audio.click(); setDifficulty(d.id) }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-grid">
        {MAPS.map((map) => (
          <div key={map.id}
            className={`map-card${selectedMapId === map.id ? " selected" : ""}`}
            onClick={() => { audio.click(); setSelectedMap(map.id) }}>
            <canvas ref={(el) => { if (el) thumbRefs.current.set(map.id, el) }}
              className="thumb" style={{ imageRendering: "pixelated" }} />
            <div>{map.name}</div>
            <div className="best">最高分 {best(map.id)}</div>
          </div>
        ))}
      </div>

      <button className="px-btn" style={{ width: 240, marginTop: 8 }} onClick={start}>
        开始游戏
      </button>
    </div>
  )
}
