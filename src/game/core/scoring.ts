// ============================================================
// core/scoring.ts —— 计分与连击（纯函数，docs/03 第 3 节）
// 食物 10 分；连击每 5 个 +1 倍，上限 X5
// ============================================================
import { COMBO_MAX_MULTIPLIER, COMBO_STEP, FOOD_SCORE } from "./constants"

export interface ScoreResult {
  score: number
  combo: number
  multiplier: number
  points: number // 本次获得的分数
}

/** 吃一个食物后的计分结果（combo 为吃之前的连击数） */
export function applyEat(score: number, combo: number): ScoreResult {
  const newCombo = combo + 1
  const multiplier = Math.min(1 + Math.floor(newCombo / COMBO_STEP), COMBO_MAX_MULTIPLIER)
  const points = FOOD_SCORE * multiplier
  return { score: score + points, combo: newCombo, multiplier, points }
}
