// ============================================================
// audio/audio.ts —— Web Audio 程序化音频（docs/03 第 9 节，docs/08 坑 #1）
// 首次用户手势后才创建 AudioContext；BGM 按主题换曲；氛围音归音乐通道
// ============================================================
import type { Theme } from "../game/core/types"

/** 音阶频率表（C 大调 / D 小调 / A 小调五声 / E 小调，docs/09） */
const SCALES: Record<string, number[]> = {
  "C-major": [262, 294, 330, 349, 392, 440, 494, 523],
  "D-minor": [294, 311, 349, 392, 440, 466, 523, 587],
  "A-minor-pentatonic": [220, 262, 294, 330, 392, 440, 523, 587],
  "E-minor": [165, 196, 220, 262, 330, 392, 440, 523],
}

const WAVE: Record<string, OscillatorType> = {
  jungle: "square",
  dungeon: "triangle",
  geometry: "sawtooth",
  deepsea: "sine",
}

class AudioManager {
  private ctx: AudioContext | null = null
  private masterSfx: GainNode | null = null
  private masterMusic: GainNode | null = null
  private bgmTimer: number | null = null
  private ambientTimer: number | null = null
  private theme: Theme | null = null
  private muted = false
  private sfxVol = 0.7
  private musicVol = 0.5

  /** 必须在用户手势后调用（docs/08 坑 #1） */
  ensure(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume()
      return
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    this.ctx = new Ctor()
    this.masterSfx = this.ctx.createGain()
    this.masterSfx.gain.value = this.muted ? 0 : this.sfxVol
    this.masterSfx.connect(this.ctx.destination)
    this.masterMusic = this.ctx.createGain()
    this.masterMusic.gain.value = this.muted ? 0 : this.musicVol
    this.masterMusic.connect(this.ctx.destination)
  }

  setVolumes(sfx: number, music: number): void {
    this.sfxVol = sfx
    this.musicVol = music
    const ctx = this.ctx
    if (this.masterSfx && this.masterMusic && ctx) {
      const t = ctx.currentTime
      this.masterSfx.gain.setTargetAtTime(this.muted ? 0 : sfx, t, 0.05)
      this.masterMusic.gain.setTargetAtTime(this.muted ? 0 : music, t, 0.05)
    }
  }

  setMuted(m: boolean): void {
    this.muted = m
    this.setVolumes(this.sfxVol, this.musicVol)
  }

  /** 静音切换（M 键，docs/03 第 2 节） */
  toggleMute(): boolean {
    this.muted = !this.muted
    this.setVolumes(this.sfxVol, this.musicVol)
    return this.muted
  }

  // ---------- 音效（docs/03 第 3 节：音高随连击上升） ----------

  private blip(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    if (!this.ctx || !this.masterSfx) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g)
    g.connect(this.masterSfx)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  eat(combo: number): void {
    const base = 440 * Math.pow(1.06, Math.min(combo, 20))
    this.blip(base, 0.09, "square", 0.25)
    this.blip(base * 1.5, 0.12, "square", 0.18)
  }

  combo(): void {
    this.blip(880, 0.15, "square", 0.22)
    this.blip(1174, 0.2, "square", 0.2)
  }

  death(): void {
    this.blip(220, 0.5, "sawtooth", 0.3, 55)
  }

  revive(): void {
    this.blip(523, 0.12, "sine", 0.25)
    this.blip(659, 0.12, "sine", 0.25)
    this.blip(784, 0.2, "sine", 0.25)
  }

  click(): void {
    this.blip(660, 0.05, "square", 0.12)
  }

  // ---------- BGM（每主题 chiptune 循环，docs/09 调性/音色） ----------

  startBgm(theme: Theme): void {
    if (!this.ctx || !this.masterMusic) return
    this.stopBgm()
    this.theme = theme
    const scale = SCALES[theme.audio.bgm.scale] ?? SCALES["C-major"]
    const wave = WAVE[theme.id] ?? "square"
    const beat = 60 / theme.audio.bgm.tempo
    let step = 0
    const stepDur = beat / 2 // 八分音符
    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || !this.masterMusic || !this.theme) return
      const t = this.ctx.currentTime + 0.05
      // 主旋律随机行走
      if (step % 2 === 0) {
        const note = scale[Math.floor(Math.random() * scale.length)]
        this.note(note, t, stepDur * 0.9, wave, 0.1)
      }
      // 低音每 4 拍
      if (step % 4 === 0) {
        this.note(scale[0] / 2, t, beat * 0.9, "triangle", 0.12)
      }
      step++
    }, stepDur * 1000)
  }

  private note(freq: number, t: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    if (!this.ctx || !this.masterMusic) return
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g)
    g.connect(this.masterMusic)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer)
      this.bgmTimer = null
    }
  }

  // ---------- 氛围音（docs/09：虫鸣/滴水/脉冲/鲸鸣） ----------

  startAmbient(theme: Theme): void {
    if (!this.ctx || !this.masterMusic) return
    this.stopAmbient()
    const kind = theme.audio.ambient
    this.ambientTimer = window.setInterval(() => {
      if (!this.ctx || !this.masterMusic) return
      const t = this.ctx.currentTime
      switch (kind) {
        case "insects": {
          // 虫鸣：高频颤音（随机）
          if (Math.random() < 0.5) {
            const osc = this.ctx.createOscillator()
            const lfo = this.ctx.createOscillator()
            const lfoG = this.ctx.createGain()
            const g = this.ctx.createGain()
            osc.type = "sine"
            osc.frequency.value = 2800 + Math.random() * 1200
            lfo.frequency.value = 28
            lfoG.gain.value = 400
            lfo.connect(lfoG)
            lfoG.connect(osc.frequency)
            g.gain.setValueAtTime(0.03, t)
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
            osc.connect(g)
            g.connect(this.masterMusic)
            osc.start(t); osc.stop(t + 0.3)
            lfo.start(t); lfo.stop(t + 0.3)
          }
          break
        }
        case "dungeon": {
          const r = Math.random()
          if (r < 0.4) {
            // 滴水
            this.note(1200 + Math.random() * 400, t, 0.08, "sine", 0.05)
          } else if (r < 0.7) {
            // 火把噼啪：噪声爆音
            const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate)
            const data = buf.getChannelData(0)
            for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
            const src = this.ctx.createBufferSource()
            src.buffer = buf
            const g = this.ctx.createGain()
            g.gain.value = 0.08
            src.connect(g); g.connect(this.masterMusic)
            src.start(t)
          }
          break
        }
        case "pulse": {
          // 电子脉冲：低频正弦
          this.note(55, t, 0.4, "sine", 0.06)
          break
        }
        case "abyss": {
          const r = Math.random()
          if (r < 0.6) {
            // 气泡：短上升滑音
            this.note(200 + Math.random() * 300, t, 0.1, "sine", 0.04, 600)
          } else if (r < 0.8) {
            // 低沉鲸鸣
            this.note(80, t, 2.5, "sine", 0.05, 55)
          }
          break
        }
      }
    }, 800)
  }

  stopAmbient(): void {
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer)
      this.ambientTimer = null
    }
  }

  /** 切主题：换 BGM 与氛围音 */
  switchTheme(theme: Theme): void {
    this.startBgm(theme)
    this.startAmbient(theme)
  }

  stopAll(): void {
    this.stopBgm()
    this.stopAmbient()
  }
}

export const audio = new AudioManager()
