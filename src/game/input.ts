// ============================================================
// game/input.ts —— 键盘输入（docs/03 第 2 节）
// P1 = WASD，P2 = 方向键；key repeat 忽略（docs/08 已知坑 #4）
// 方向键交给 engine；P/Esc/R/M 由 UI 层处理（需联动菜单）
// ============================================================
import type { Direction, PlayerId } from "./core/types"
import type { SnakeEngine } from "./engine"

const KEY_TO_DIR: Record<string, Direction> = {
  w: "up", s: "down", a: "left", d: "right",
  arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
}

/** 按键 → (player, dir) */
export function keyToControl(key: string): { player: PlayerId; dir: Direction } | null {
  const k = key.toLowerCase()
  const dir = KEY_TO_DIR[k]
  if (!dir) return null
  if (k.startsWith("arrow")) return { player: 2, dir }
  return { player: 1, dir }
}

export function attachKeyboard(engine: SnakeEngine): () => void {
  const onKey = (e: KeyboardEvent): void => {
    if (e.repeat) return // 防 key repeat 干扰缓冲（docs/08 已知坑 #4）
    const ctrl = keyToControl(e.key)
    if (ctrl) {
      // 单人模式下 P2 的键输入由引擎侧忽略（无 P2 蛇）
      engine.setDir(ctrl.player, ctrl.dir)
    }
  }
  window.addEventListener("keydown", onKey)
  return () => window.removeEventListener("keydown", onKey)
}
