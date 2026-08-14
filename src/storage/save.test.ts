// ============================================================
// storage/save.test.ts —— 存档读写单测（docs/06 1.3：save.ts）
// 正常读写 / 坏档重建 / 删除 / 校验（localStorage 用内存 mock）
// ============================================================
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { loadSave, persistSave, deleteSave } from "./save"
import { defaultSave, validateSave, SAVE_VERSION } from "./schema"

function createStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("save", () => {
  it("空存储 → 默认存档", () => {
    const s = loadSave()
    expect(s.version).toBe(SAVE_VERSION)
    expect(s.settings.sfxVolume).toBe(0.7)
    expect(s.stats.bestScores).toEqual({})
  })

  it("写入后可读回（版本化 JSON）", () => {
    const s = defaultSave()
    s.stats.bestScores["jungle"] = 240
    s.settings.difficulty = "hard"
    expect(persistSave(s)).toBe(true)
    const back = loadSave()
    expect(back.stats.bestScores["jungle"]).toBe(240)
    expect(back.settings.difficulty).toBe("hard")
  })

  it("坏档 → 校验失败 → 默认存档（不崩溃）", () => {
    const mock = createStorageMock()
    mock.setItem("greedy-snake-save-v1", "{ 这不是合法 JSON")
    vi.stubGlobal("localStorage", mock)
    const s = loadSave()
    expect(s.version).toBe(SAVE_VERSION)
  })

  it("非法结构存档 → 校验失败 → 默认存档", () => {
    const mock = createStorageMock()
    mock.setItem("greedy-snake-save-v1", JSON.stringify({ version: 999, settings: {}, stats: {} }))
    vi.stubGlobal("localStorage", mock)
    const s = loadSave()
    expect(s.version).toBe(SAVE_VERSION) // 版本不符 → 默认
  })

  it("删除存档后回到默认", () => {
    const s = defaultSave()
    s.stats.playCount = 5
    persistSave(s)
    deleteSave()
    expect(loadSave().stats.playCount).toBe(0)
  })
})

describe("validateSave", () => {
  it("合法存档零错误", () => {
    expect(validateSave(defaultSave())).toEqual([])
  })

  it("非法音量被检出", () => {
    const s = defaultSave()
    s.settings.sfxVolume = 1.5
    const errors = validateSave(s)
    expect(errors.some((e) => e.includes("sfxVolume"))).toBe(true)
  })

  it("非对象返回错误", () => {
    expect(validateSave(null).length).toBeGreaterThan(0)
    expect(validateSave("str").length).toBeGreaterThan(0)
  })
})
