// ============================================================
// core/constants.ts —— 全局常量（docs/02 1.4 风格量化规范 + docs/03 规则）
// ============================================================
import type { DifficultyPreset } from "./types"

/** 逻辑 tick 频率（固定时间步长，docs/04 第 4 节） */
export const TICK_HZ = 60

/** 累积器上限（ms，防切页签后追赶瞬移，docs/08 已知坑 #8） */
export const MAX_ACCUMULATED_MS = 250

/** 蛇的输入缓冲长度（docs/03 第 2 节：2 帧） */
export const INPUT_BUFFER_MAX = 2

/** 蛇初始长度（含头） */
export const INITIAL_SNAKE_LENGTH = 3

/** 食物基础分（docs/03 第 3 节） */
export const FOOD_SCORE = 10

/** 连击：每 N 个 +1 倍 */
export const COMBO_STEP = 5

/** 连击上限倍数 */
export const COMBO_MAX_MULTIPLIER = 5

/** 双人复活等待（秒，docs/03 第 5.3 节） */
export const REVIVE_WAIT_SECONDS = 10

/** 复活保护期（秒） */
export const INVINCIBLE_SECONDS = 2

/** 场上食物数量（docs/03 第 8 节） */
export const FOOD_COUNT = 1

/** 难度预设（数值为占位，阶段 5 调优后回填 docs/03） */
export const DIFFICULTY_PRESETS: Record<string, DifficultyPreset> = {
  casual: {
    id: "casual",
    label: "休闲",
    initialSpeed: 4,
    accelPerFood: 8,
    accelStep: 0.4,
    maxSpeed: 8,
  },
  normal: {
    id: "normal",
    label: "标准",
    initialSpeed: 6,
    accelPerFood: 6,
    accelStep: 0.5,
    maxSpeed: 11,
  },
  hard: {
    id: "hard",
    label: "困难",
    initialSpeed: 8,
    accelPerFood: 5,
    accelStep: 0.6,
    maxSpeed: 14,
  },
}
