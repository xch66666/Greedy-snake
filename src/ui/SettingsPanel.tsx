// ============================================================
// ui/SettingsPanel.tsx —— 设置弹窗（docs/07 第 2 节：模态，主菜单/暂停复用）
// ============================================================
import { useGame } from "./store"
import { audio } from "../audio/audio"
import { loadSave, persistSave, deleteSave } from "../storage/save"
import { useState } from "react"
import type { Difficulty } from "../game/core/types"
import type { Quality } from "../storage/schema"

const DIFFS: { id: Difficulty; label: string }[] = [
  { id: "casual", label: "休闲" },
  { id: "normal", label: "标准" },
  { id: "hard", label: "困难" },
]
const QUALS: { id: Quality; label: string }[] = [
  { id: "high", label: "高" },
  { id: "mid", label: "中" },
  { id: "low", label: "低" },
]

export function SettingsPanel(): React.JSX.Element | null {
  const settingsOpen = useGame((s) => s.settingsOpen)
  const setSettingsOpen = useGame((s) => s.setSettingsOpen)
  const [save, setSave] = useState(() => loadSave())
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!settingsOpen) return null

  const update = (patch: Partial<typeof save.settings>): void => {
    const next = { ...save, settings: { ...save.settings, ...patch } }
    setSave(next)
    persistSave(next)
    audio.setVolumes(next.settings.sfxVolume, next.settings.musicVolume)
  }

  const onDelete = (): void => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteSave()
    setConfirmDelete(false)
    setSave(loadSave())
    audio.click()
  }

  return (
    <div className="overlay" onClick={() => setSettingsOpen(false)}>
      <div className="modal px-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", fontSize: 24 }}>设 置</div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>音效音量</span>
          <input type="range" className="px-slider" min={0} max={100} step={5}
            value={Math.round(save.settings.sfxVolume * 100)}
            onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })} />
          <span style={{ width: 44, textAlign: "right", fontSize: 12 }}>{Math.round(save.settings.sfxVolume * 100)}%</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>音乐音量</span>
          <input type="range" className="px-slider" min={0} max={100} step={5}
            value={Math.round(save.settings.musicVolume * 100)}
            onChange={(e) => update({ musicVolume: Number(e.target.value) / 100 })} />
          <span style={{ width: 44, textAlign: "right", fontSize: 12 }}>{Math.round(save.settings.musicVolume * 100)}%</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>画质</span>
          <div className="seg">
            {QUALS.map((q) => (
              <button key={q.id} className={save.settings.quality === q.id ? "on" : ""}
                onClick={() => { audio.click(); update({ quality: q.id }) }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>难度</span>
          <div className="seg">
            {DIFFS.map((d) => (
              <button key={d.id} className={save.settings.difficulty === d.id ? "on" : ""}
                onClick={() => { audio.click(); update({ difficulty: d.id }) }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>自动降级</span>
          <button className="px-btn" style={{ padding: "4px 12px", fontSize: 12, boxShadow: "none" }}
            onClick={() => { audio.click(); update({ autoDowngrade: !save.settings.autoDowngrade }) }}>
            {save.settings.autoDowngrade ? "开" : "关"}
          </button>
        </div>

        <hr style={{ border: "1px solid rgba(255,255,255,0.15)" }} />

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className="px-btn danger" style={{ padding: "6px 16px", fontSize: 12 }}
            onClick={onDelete}>
            {confirmDelete ? "确认删除存档？" : "删除存档"}
          </button>
        </div>

        <button className="px-btn secondary" style={{ marginTop: 4 }}
          onClick={() => { audio.click(); setConfirmDelete(false); setSettingsOpen(false) }}>
          返回
        </button>
      </div>
    </div>
  )
}
