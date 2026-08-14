// ============================================================
// ui/GameCanvas.tsx —— 桥接组件（docs/04 第 3 节：引擎 ↔ React 唯一通道）
// 持有 engine 实例；事件 → store/渲染特效；命令口 → engine
// ============================================================
import { useEffect, useRef } from "react"
import { useGame } from "./store"
import { SnakeEngine } from "../game/engine"
import { attachKeyboard } from "../game/input"
import { Renderer } from "../render/renderer"
import { audio } from "../audio/audio"
import { getMap, getTheme } from "../game/maps"
import type { GameEvent } from "../game/core/types"
import { loadSave, persistSave } from "../storage/save"

let engineSingleton: SnakeEngine | null = null
let rendererSingleton: Renderer | null = null

export function getEngine(): SnakeEngine {
  if (!engineSingleton) engineSingleton = new SnakeEngine()
  return engineSingleton
}

/** F1 调试面板用（docs/06 1.1） */
export function getRenderer(): Renderer | null {
  return rendererSingleton
}

/** 主题 → CSS 变量换肤（docs/02 1.2：换图 = 换整套皮肤） */
export function applyThemeVars(themeId: string): void {
  const theme = getTheme(themeId)
  if (!theme) return
  const root = document.documentElement.style
  const p = theme.palette
  root.setProperty("--bg", p.bg)
  root.setProperty("--grid", p.grid)
  root.setProperty("--border", p.border)
  root.setProperty("--accent", p.accent)
  root.setProperty("--food", p.food)
  root.setProperty("--snake-a", p.snakeA)
  root.setProperty("--snake-b", p.snakeB)
  root.setProperty("--obstacle", p.obstacle)
  root.setProperty("--outline", p.outline)
  root.setProperty("--ui-text", p.uiText)
  root.setProperty("--shadow", theme.shadow.color)
}

/** 换肤时 body 背景平滑过渡 */
export function setBodyBg(themeId: string): void {
  const theme = getTheme(themeId)
  if (theme) document.body.style.background = theme.palette.bg
}

export function GameCanvas(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const screen = useGame((s) => s.screen)
  const paused = useGame((s) => s.hud.paused)
  const mode = useGame((s) => s.mode)
  const difficulty = useGame((s) => s.difficulty)
  const selectedMapId = useGame((s) => s.selectedMapId)
  const settings = useGame((s) => s.settingsOpen)

  useEffect(() => {
    const engine = getEngine()
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const renderer = new Renderer(canvas)
    rendererRef.current = renderer
    rendererSingleton = renderer

    // 事件 → 渲染特效 / store / 音频
    const unsub = engine.on((e: GameEvent) => {
      const view = engine.getView()
      const theme = view.theme
      const st = useGame.getState()
      switch (e.type) {
        case "state":
          if (e.state === "playing") {
            st.resetHud() // 重开时清空上一局 HUD 残留
            if (theme) audio.switchTheme(theme)
          } else if (e.state === "paused") {
            st.updateHud({ paused: true })
            audio.stopAll()
          }
          break
        case "score": {
          st.updateHud({
            scores: { ...st.hud.scores, [e.player]: e.score },
            combos: { ...st.hud.combos, [e.player]: e.combo },
            multipliers: { ...st.hud.multipliers, [e.player]: e.multiplier },
          })
          if (theme && e.multiplier > 1) {
            const hp = renderer.headPixel(e.player)
            if (hp) {
              renderer.spawnCombo(hp.x, hp.y, theme)
              audio.combo()
            }
          }
          break
        }
        case "eat": {
          if (theme) {
            const hp = renderer.headPixel(e.player)
            if (hp) renderer.spawnEat(hp.x, hp.y, theme)
            audio.eat(st.hud.combos[e.player])
          }
          break
        }
        case "death": {
          if (theme) {
            const hp = renderer.headPixel(e.player)
            if (hp) renderer.spawnDeath(hp.x, hp.y, theme)
          }
          audio.death()
          break
        }
        case "revive": {
          if (theme) {
            const hp = renderer.headPixel(e.player)
            if (hp) renderer.spawnRevive(hp.x, hp.y, theme)
          }
          audio.revive()
          break
        }
        case "reviveCountdown":
          st.updateHud({ revive: { player: e.player, remaining: e.remaining } })
          break
        case "gameover": {
          st.updateHud({ revive: null })
          audio.stopAll()
          // 结算数据 + 存档更新（docs/04 第 6 节：只存结果不存瞬时状态）
          const save = loadSave()
          const mapId = st.selectedMapId
          const total = view.scores[1] + (view.scores[2] ?? 0)
          const key = st.mode === "coop" ? save.stats.bestScoresCoop : save.stats.bestScores
          const cur = key[mapId] ?? 0
          const isRecord = total > cur
          if (isRecord) key[mapId] = total
          save.stats.totalFood += st.hud.combos[1] + (st.hud.combos[2] ?? 0)
          save.stats.playCount += 1
          persistSave(save)
          st.setResult({
            scores: { 1: view.scores[1], 2: view.scores[2] },
            winner: e.winner,
            isRecord,
            mapName: getMap(mapId)?.name ?? "",
          })
          st.setScreen("gameover")
          break
        }
      }
    })

    // 渲染循环（独立于 React，docs/05 1.2）
    let raf = 0
    let last = performance.now()
    let fpsWindow: number[] = []
    let saveCache = loadSave()
    let saveTicks = 0
    const loop = (ts: number): void => {
      const dt = Math.min(0.1, (ts - last) / 1000)
      last = ts
      const view = engine.getView()
      renderer.render(view, dt, saveCache.settings.quality)
      raf = requestAnimationFrame(loop)

      // 帧率检测与自动降级（docs/05 第 5 节：连续 30 帧 < 50fps → 降一档）
      if (saveCache.settings.autoDowngrade) {
        fpsWindow.push(dt * 1000)
        if (fpsWindow.length >= 30) {
          const avg = fpsWindow.reduce((a, b) => a + b, 0) / fpsWindow.length
          fpsWindow = []
          if (avg > 20) {
            const q = saveCache.settings.quality
            if (q === "high") {
              saveCache.settings.quality = "mid"
              persistSave(saveCache)
              console.warn("[perf] 自动降级 → 中画质（可在设置中关闭）")
            } else if (q === "mid") {
              saveCache.settings.quality = "low"
              persistSave(saveCache)
              console.warn("[perf] 自动降级 → 低画质")
            }
          }
        }
      }
      // 定期刷新存档缓存（设置面板可能已修改）
      if (++saveTicks % 1800 === 0) saveCache = loadSave() // 每 ~30s
    }

    // 画布尺寸适配（整数倍）
    const fit = (): void => {
      const r = wrap.getBoundingClientRect()
      renderer.fit(r.width, r.height)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)

    // 切页签自动暂停（docs/05 1.1）
    const onVis = (): void => {
      if (document.hidden) engine.pause()
    }
    document.addEventListener("visibilitychange", onVis)

    // 键盘方向（P/R/M 在 App 层处理）
    const detach = attachKeyboard(engine)

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      detach()
      unsub()
      renderer.clearFx()
      rendererSingleton = null
    }
  }, [])

  // 开始/重开：engine.start（模式与难度变化时）
  useEffect(() => {
    if (screen !== "playing") return
    const engine = getEngine()
    engine.start(selectedMapId, mode, difficulty)
    applyThemeVars(getMap(selectedMapId)?.themeId ?? "jungle")
    setBodyBg(getMap(selectedMapId)?.themeId ?? "jungle")
    audio.ensure()
    // 新局重置特效状态（防上局死亡抖动/粒子残留，docs/10 坑 15）
    rendererRef.current?.clearFx()
    return () => {
      engine.pause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, difficulty, selectedMapId])

  // 暂停态同步
  useEffect(() => {
    const engine = getEngine()
    if (paused) engine.pause()
  }, [paused])

  void settings

  return (
    <div className="game-canvas-wrap" ref={wrapRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
