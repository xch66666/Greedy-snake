// ============================================================
// ui/store.ts —— Zustand 低频状态（docs/04 第 3 节：Canvas 高频状态不进 React）
// ============================================================
import { create } from "zustand"
import type { Difficulty, GameMode, PlayerId } from "../game/core/types"

export type Screen = "boot" | "menu" | "mapselect" | "playing" | "gameover"

export interface HudState {
  scores: Record<PlayerId, number>
  combos: Record<PlayerId, number>
  multipliers: Record<PlayerId, number>
  revive: { player: PlayerId; remaining: number } | null
  paused: boolean
}

export interface GameResult {
  scores: Record<PlayerId, number>
  winner?: PlayerId | "draw"
  isRecord: boolean
  mapName: string
}

interface GameStore {
  screen: Screen
  mode: GameMode
  difficulty: Difficulty
  selectedMapId: string
  settingsOpen: boolean
  hud: HudState
  result: GameResult | null
  bootProgress: number

  setScreen(s: Screen): void
  setMode(m: GameMode): void
  setDifficulty(d: Difficulty): void
  setSelectedMap(id: string): void
  setSettingsOpen(open: boolean): void
  setBootProgress(p: number): void
  updateHud(h: Partial<HudState>): void
  setResult(r: GameResult | null): void
  resetHud(): void
}

export const useGame = create<GameStore>((set) => ({
  screen: "boot",
  mode: "solo",
  difficulty: "normal",
  selectedMapId: "jungle",
  settingsOpen: false,
  bootProgress: 0,
  hud: {
    scores: { 1: 0, 2: 0 },
    combos: { 1: 0, 2: 0 },
    multipliers: { 1: 1, 2: 1 },
    revive: null,
    paused: false,
  },
  result: null,

  setScreen: (screen) => set({ screen }),
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setSelectedMap: (selectedMapId) => set({ selectedMapId }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setBootProgress: (bootProgress) => set({ bootProgress }),
  updateHud: (h) => set((s) => ({ hud: { ...s.hud, ...h } })),
  setResult: (result) => set({ result }),
  resetHud: () => set({
    hud: {
      scores: { 1: 0, 2: 0 },
      combos: { 1: 0, 2: 0 },
      multipliers: { 1: 1, 2: 1 },
      revive: null,
      paused: false,
    },
    result: null,
  }),
}))
