// ============================================================
// ui/Overlays.tsx —— 暂停 / 结算覆盖层（docs/07 第 5/6 节）
// ============================================================
import { useGame } from "./store"
import { getEngine } from "./GameCanvas"
import { audio } from "../audio/audio"

/** 暂停菜单：继续 / 设置 / 重新开始 / 返回选图（docs/07 第 5 节） */
export function PauseOverlay(): React.JSX.Element | null {
  const paused = useGame((s) => s.hud.paused)
  const setSettingsOpen = useGame((s) => s.setSettingsOpen)
  const setScreen = useGame((s) => s.setScreen)
  const updateHud = useGame((s) => s.updateHud)

  if (!paused) return null

  const resume = (): void => {
    audio.click()
    getEngine().resume()
    updateHud({ paused: false })
  }
  const restart = (): void => {
    audio.click()
    getEngine().restart()
  }
  const quit = (): void => {
    audio.click()
    updateHud({ paused: false }) // 重置暂停态，防下一局自动暂停（docs/13 修复）
    setScreen("mapselect")
  }

  return (
    <div className="overlay" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="modal px-card" style={{ alignItems: "center", width: 320 }}>
        <div className="px-title" style={{ fontSize: 24 }}>⏸ 已暂停</div>
        <button className="px-btn" style={{ width: 220 }} onClick={resume}>继续 (P)</button>
        <button className="px-btn secondary" style={{ width: 220 }}
          onClick={() => { audio.click(); setSettingsOpen(true) }}>设置</button>
        <button className="px-btn secondary" style={{ width: 220 }} onClick={restart}>重新开始 (R)</button>
        <button className="px-btn secondary" style={{ width: 220 }} onClick={quit}>返回选图</button>
      </div>
    </div>
  )
}

/** 结算界面（docs/07 第 6 节：单人/双人） */
export function GameOverOverlay(): React.JSX.Element | null {
  const screen = useGame((s) => s.screen)
  const result = useGame((s) => s.result)
  const mode = useGame((s) => s.mode)
  const setScreen = useGame((s) => s.setScreen)
  const updateHud = useGame((s) => s.updateHud)

  if (screen !== "gameover" || !result) return null

  const replay = (): void => {
    audio.click()
    // 切回 playing 由 GameCanvas 的 screen effect 统一 start（避免双 start）
    setScreen("playing")
  }
  const toMapSelect = (): void => {
    audio.click()
    updateHud({ paused: false })
    setScreen("mapselect")
  }
  const toMenu = (): void => {
    audio.click()
    updateHud({ paused: false })
    setScreen("menu")
  }

  return (
    <div className="overlay">
      <div className="result-card px-card">
        <div className="px-title" style={{ fontSize: 24 }}>游戏结束</div>
        {mode === "coop" ? (
          <>
            <div className="score-line">
              P1 {result.scores[1]} <span style={{ opacity: 0.6 }}>vs</span> P2 {result.scores[2]}
            </div>
            <div style={{ fontSize: 12 }}>
              {result.winner === "draw" ? "平局！" : `🏆 P${result.winner} 获胜`}
            </div>
            {result.isRecord && <div className="record">★ 双人合计新纪录</div>}
          </>
        ) : (
          <>
            <div className="score-line">本局分数 {result.scores[1]}</div>
            {result.isRecord && <div className="record">★ 新纪录！</div>}
          </>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
          <button className="px-btn" onClick={replay}>再来一局 (R)</button>
          <button className="px-btn secondary" onClick={toMapSelect}>返回选图</button>
          <button className="px-btn secondary" onClick={toMenu}>主菜单</button>
        </div>
      </div>
    </div>
  )
}
