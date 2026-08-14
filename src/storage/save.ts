// ============================================================
// storage/save.ts —— 存档读写（localStorage，docs/04 第 6 节）
// 防坑：隐私模式/配额满 → try/catch + 内存兜底（docs/08 已知坑 #7）
// ============================================================
import { defaultSave, validateSave, type SaveData } from "./schema"

const KEY = "greedy-snake-save-v1"

let memoryFallback: SaveData | null = null // 内存兜底

export function loadSave(): SaveData {
  const def = defaultSave()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return def
    const parsed: unknown = JSON.parse(raw)
    const errors = validateSave(parsed)
    if (errors.length > 0) {
      console.warn("[save] 存档校验失败，使用默认存档:", errors)
      return def
    }
    return parsed as SaveData
  } catch (err) {
    console.warn("[save] 读取失败，使用内存兜底:", err)
    return memoryFallback ?? def
  }
}

export function persistSave(data: SaveData): boolean {
  memoryFallback = data // 内存兜底始终更新
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch (err) {
    console.warn("[save] 写入失败（隐私模式/配额满），本次仅内存生效:", err)
    return false
  }
}

export function deleteSave(): void {
  memoryFallback = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 忽略 */
  }
}

/** 页面隐藏时强制 flush（docs/04 第 6 节） */
export function flushSave(data: SaveData): void {
  persistSave(data)
}
