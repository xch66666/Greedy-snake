// ============================================================
// debug/debugPanel.tsx —— F1 调试面板（docs/06 1.1，仅 DEV 构建）
// 网格叠加 / 无敌 / 穿墙 / 调速 / 瞬移 / 刷食物 / 强制复活
// ============================================================
import { useEffect, useState } from "react"
import { getEngine, getRenderer } from "../ui/GameCanvas"
import { useGame } from "../ui/store"

export function DebugPanel(): React.JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [god, setGod] = useState(false)
  const [noWall, setNoWall] = useState(false)
  const [grid, setGrid] = useState(false)
  const [speed, setSpeed] = useState(1)
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "F1") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  if (!import.meta.env.DEV) return null
  if (!open) return null

  const engine = getEngine()
  const renderer = getRenderer()
  const inGame = screen === "playing"

  const toggle = (v: boolean, set: (b: boolean) => void, apply: (b: boolean) => void): void => {
    const nv = !v
    set(nv)
    apply(nv)
  }

  return (
    <div style={{
      position: "fixed", right: 12, bottom: 12, zIndex: 999,
      background: "rgba(0,0,0,0.85)", border: "2px solid #ffd24d",
      borderRadius: 8, padding: 12, fontSize: 13, fontFamily: "monospace",
      color: "#eee", display: "flex", flexDirection: "column", gap: 8, minWidth: 210,
    }}>
      <div style={{ color: "#ffd24d", fontWeight: "bold" }}>⚙ 调试面板 (F1)</div>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={god} onChange={() => toggle(god, setGod, (b) => { engine.debugGod = b })} />
        无敌模式
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={noWall} onChange={() => toggle(noWall, setNoWall, (b) => { engine.debugNoWall = b })} />
        穿墙模式
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={grid} onChange={() => toggle(grid, setGrid, (b) => { if (renderer) renderer.showGrid = b })} />
        网格叠加
      </label>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span>速度</span>
        <input type="range" min={0.5} max={3} step={0.5} value={speed}
          onChange={(e) => { const v = Number(e.target.value); setSpeed(v); engine.debugSpeedMul = v }} />
        <span>{speed}x</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button disabled={!inGame} style={{ flex: 1, fontSize: 12 }}
          onClick={() => { const v = engine.getView(); if (v.snakes[0]) engine.debugPlaceFood(v.snakes[0].body[0]) }}>
          刷食物
        </button>
        <button disabled={!inGame} style={{ flex: 1, fontSize: 12 }}
          onClick={() => {
            const v = engine.getView()
            const s = v.snakes[0]
            if (s && v.map) engine.debugTeleportHead(1, { x: Math.min(s.body[0].x + 2, v.map.grid.w - 1), y: s.body[0].y })
          }}>
          瞬移+
        </button>
      </div>
    </div>
  )
}
