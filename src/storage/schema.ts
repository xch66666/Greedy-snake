// ============================================================
// storage/schema.ts —— 存档定义（版本化，docs/04 第 6 节）
// ============================================================
import type { Difficulty } from "../game/core/types"

export const SAVE_VERSION = 1

export type Quality = "high" | "mid" | "low"

export interface SaveData {
  version: typeof SAVE_VERSION
  settings: {
    sfxVolume: number // 0~1
    musicVolume: number // 0~1（含氛围音）
    quality: Quality
    autoDowngrade: boolean
    difficulty: Difficulty
  }
  stats: {
    bestScores: Record<string, number> // 每图单人最高分（key = mapId）
    bestScoresCoop: Record<string, number> // 每图双人合计最高分
    totalFood: number
    playCount: number
  }
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    settings: {
      sfxVolume: 0.7,
      musicVolume: 0.5,
      quality: "high",
      autoDowngrade: true,
      difficulty: "normal",
    },
    stats: {
      bestScores: {},
      bestScoresCoop: {},
      totalFood: 0,
      playCount: 0,
    },
  }
}

/** 存档校验：返回错误信息数组，空 = 合法（docs/05 第 4 节） */
export function validateSave(data: unknown): string[] {
  const errors: string[] = []
  if (typeof data !== "object" || data === null) {
    return ["存档不是对象"]
  }
  const d = data as Record<string, unknown>
  if (d.version !== SAVE_VERSION) {
    errors.push(`存档版本 ${String(d.version)} 不匹配（当前 ${SAVE_VERSION}）`)
  }
  const s = d.settings as Record<string, unknown> | undefined
  if (!s) {
    errors.push("缺少 settings")
  } else {
    if (typeof s.sfxVolume !== "number" || s.sfxVolume < 0 || s.sfxVolume > 1) errors.push("sfxVolume 非法")
    if (typeof s.musicVolume !== "number" || s.musicVolume < 0 || s.musicVolume > 1) errors.push("musicVolume 非法")
    if (!["high", "mid", "low"].includes(s.quality as string)) errors.push("quality 非法")
    if (!["casual", "normal", "hard"].includes(s.difficulty as string)) errors.push("difficulty 非法")
  }
  const st = d.stats as Record<string, unknown> | undefined
  if (!st) {
    errors.push("缺少 stats")
  } else {
    if (typeof st.totalFood !== "number") errors.push("totalFood 非法")
    if (typeof st.playCount !== "number") errors.push("playCount 非法")
    if (typeof st.bestScores !== "object" || st.bestScores === null) errors.push("bestScores 非法")
    if (typeof st.bestScoresCoop !== "object" || st.bestScoresCoop === null) errors.push("bestScoresCoop 非法")
  }
  return errors
}
