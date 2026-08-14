// ============================================================
// core/eventBus.ts —— 类型安全事件总线（docs/04 第 3 节）
// ============================================================
import type { GameEvent } from "./types"

export type GameEventHandler = (e: GameEvent) => void

export class EventBus {
  private handlers = new Set<GameEventHandler>()

  on(handler: GameEventHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  emit(e: GameEvent): void {
    for (const h of this.handlers) {
      try {
        h(e)
      } catch (err) {
        // 单监听器异常不影响其他监听器（docs/05 第 4 节帧级隔离精神）
        console.error("[eventBus] listener error:", err)
      }
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}
