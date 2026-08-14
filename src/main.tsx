// ============================================================
// main.tsx —— 装配入口（docs/07 第 7 节：BOOTING 加载动画 → 主菜单）
// ============================================================
import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./ui/App"
import { ErrorBoundary } from "./ui/ErrorBoundary"
import { useGame } from "./ui/store"
import { loadGameAssets } from "./boot/loadingManager"
import { applyThemeVars, setBodyBg } from "./ui/GameCanvas"
import "./ui/fonts.css"
import "./ui/theme.css"

function Boot(): React.JSX.Element {
  const progress = useGame((s) => s.bootProgress)
  return (
    <div className="screen boot-screen">
      <div className="px-title">🐍 像素贪吃蛇</div>
      <div className="px-subtitle">PIXEL SNAKE</div>
      <div className="px-progress" style={{ marginTop: 24 }}>
        <div style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
        {Math.round(progress * 100)}% · 正在加载资源…
      </div>
    </div>
  )
}

function Root(): React.JSX.Element {
  const screen = useGame((s) => s.screen)

  useEffect(() => {
    let cancelled = false
    const st = useGame.getState()
    loadGameAssets((p) => {
      if (!cancelled) st.setBootProgress(p.progress)
    }).then(() => {
      if (cancelled) return
      applyThemeVars("jungle")
      setBodyBg("jungle")
      st.setScreen("menu")
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (screen === "boot") return <Boot />
  return <App />
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>,
)
