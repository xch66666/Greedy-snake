// ============================================================
// ui/App.tsx —— 屏幕路由 + 全局快捷键（docs/07 第 0 节三层导航）
// ============================================================
import { useEffect } from "react"
import { useGame } from "./store"
import { Menu } from "./Menu"
import { MapSelect } from "./MapSelect"
import { SettingsPanel } from "./SettingsPanel"
import { HUD, ReviveBanner } from "./HUD"
import { PauseOverlay, GameOverOverlay } from "./Overlays"
import { GameCanvas, getEngine, applyThemeVars, setBodyBg } from "./GameCanvas"
import { audio } from "../audio/audio"
import { getMap } from "../game/maps"
import { DebugPanel } from "../debug/debugPanel"

export function App(): React.JSX.Element | null {
  const screen = useGame((s) => s.screen)

  // 全局快捷键：P/Esc 暂停、R 重开、M 静音（docs/03 第 2 节）
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const st = useGame.getState()
      const engine = getEngine()
      const key = e.key.toLowerCase()
      if (e.repeat) return
      if (st.settingsOpen) {
        if (key === "escape") st.setSettingsOpen(false)
        return
      }
      if (key === "m") {
        audio.toggleMute()
        return
      }
      if (st.screen !== "playing") return
      if (key === "p" || key === "escape") {
        if (st.hud.paused) {
          engine.resume()
          st.updateHud({ paused: false })
        } else {
          engine.pause()
        }
      } else if (key === "r") {
        engine.restart()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // 初始主题（默认丛林）
  useEffect(() => {
    applyThemeVars("jungle")
    setBodyBg("jungle")
  }, [])

  const renderScreen = (): React.JSX.Element | null => {
    if (screen === "menu") return <Menu />
    if (screen === "mapselect") return <MapSelect />
    if (screen === "playing" || screen === "gameover") {
      return (
        <div className="game-layout">
          <HUD />
          <div style={{ position: "relative", minHeight: 0 }}>
            <GameCanvas />
            <ReviveBanner />
          </div>
          <div className="game-hint">
            P1: WASD · P2: 方向键 · P/Esc: 暂停 · R: 重开 · M: 静音
          </div>
          <PauseOverlay />
          <GameOverOverlay />
        </div>
      )
    }
    return null
  }

  return (
    <>
      {renderScreen()}
      <SettingsPanel />
      <DebugPanel />
    </>
  )
}

export function currentMapId(): string {
  return getMap(useGame.getState().selectedMapId)?.id ?? "jungle"
}
