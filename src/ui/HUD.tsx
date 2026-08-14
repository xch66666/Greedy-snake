// ============================================================
// ui/HUD.tsx —— 游戏 HUD（docs/07 4.1/4.2：三列；双人左右分列）
// ============================================================
import { useGame } from "./store"
import { getMap } from "../game/maps"

export function HUD(): React.JSX.Element {
  const hud = useGame((s) => s.hud)
  const mode = useGame((s) => s.mode)
  const difficulty = useGame((s) => s.difficulty)
  const selectedMapId = useGame((s) => s.selectedMapId)

  const map = getMap(selectedMapId)
  const diffLabel = difficulty === "casual" ? "休闲" : difficulty === "normal" ? "标准" : "困难"
  const centerText = `${map?.name ?? ""} · ${diffLabel} · ${mode === "solo" ? "单人" : "双人"}`

  const scoreBlock = (p: 1 | 2, align: "left" | "right"): React.JSX.Element => (
    <div style={{ textAlign: align }}>
      <div className="hud-score">P{p} {hud.scores[p]}</div>
      <div className={`hud-combo${hud.multipliers[p] > 1 ? " hot" : ""}`}>
        {hud.combos[p] > 0 ? `连击 ${hud.combos[p]} · x${hud.multipliers[p]}` : "连击 0"}
      </div>
    </div>
  )

  return (
    <div className="game-hud">
      {mode === "coop" ? (
        <>
          <div>{scoreBlock(1, "left")}</div>
          <div className="center" style={{ fontSize: 14 }}>{centerText}</div>
          <div>{scoreBlock(2, "right")}</div>
        </>
      ) : (
        <>
          <div>{scoreBlock(1, "left")}</div>
          <div className="center" style={{ fontSize: 14 }}>{centerText}</div>
          <div className="right" style={{ fontSize: 13, opacity: 0.7 }}>P:暂停 · R:重开 · M:静音</div>
        </>
      )}
    </div>
  )
}

/** 复活倒计时浮条（docs/07 4.2） */
export function ReviveBanner(): React.JSX.Element | null {
  const revive = useGame((s) => s.hud.revive)
  if (!revive) return null
  return (
    <div className="revive-banner">
      💀 P{revive.player} 幽灵中 · 复活 {revive.remaining}s
      <div style={{ fontSize: 12, opacity: 0.75, textAlign: "center" }}>
        （期间另一条死亡则结束）
      </div>
    </div>
  )
}
