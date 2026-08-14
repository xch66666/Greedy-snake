// ============================================================
// ui/Menu.tsx —— 第 1 层主菜单（docs/07 第 1 节：Minecraft 式极简）
// ============================================================
import { useGame } from "./store"
import { audio } from "../audio/audio"

export function Menu(): React.JSX.Element {
  const setScreen = useGame((s) => s.setScreen)
  const setMode = useGame((s) => s.setMode)
  const setSettingsOpen = useGame((s) => s.setSettingsOpen)

  const goMapSelect = (mode: "solo" | "coop"): void => {
    audio.ensure()
    audio.click()
    setMode(mode)
    setScreen("mapselect")
  }

  return (
    <div className="screen" style={{ gap: 26 }}>
      <div style={{ textAlign: "center" }}>
        <div className="px-title">🐍 像素贪吃蛇</div>
        <div className="px-subtitle">PIXEL SNAKE</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <button className="px-btn" style={{ width: 220 }} onClick={() => goMapSelect("solo")}>
          单人游戏
        </button>
        <button className="px-btn secondary" style={{ width: 220 }} onClick={() => goMapSelect("coop")}>
          双人游戏
        </button>
        <button className="px-btn secondary" style={{ width: 220 }} onClick={() => { audio.ensure(); audio.click(); setSettingsOpen(true) }}>
          设 置
        </button>
      </div>
      <div style={{ fontSize: 12, opacity: 0.55, marginTop: 20 }}>
        v1.0 · 本地存档 · 4 张地图
      </div>
    </div>
  )
}
