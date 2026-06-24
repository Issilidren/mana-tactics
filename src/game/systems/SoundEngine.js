// SoundEngine.js — Web Audio API chiptune synthesizer (no files needed)
// Singleton: import { SoundEngine } from './SoundEngine.js'

class SoundEngineClass {
  constructor() {
    this._ctx         = null
    this._bgmTimeout  = null
    this._bgmTheme    = null
    this._muted       = false
    this._lastBump    = 0
  }

  // ── Internal: lazy AudioContext (respects browser autoplay policy) ───────────
  _ctx_get() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }

  // ── Base primitive: single oscillator tone ────────────────────────────────────
  _tone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
    if (this._muted) return
    try {
      const ctx  = this._ctx_get()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur + 0.01)
    } catch (_) {}
  }

  // ── Frequency sweep (for spell / card effects) ────────────────────────────────
  _sweep(f0, f1, dur, type = 'sine', vol = 0.12, delay = 0) {
    if (this._muted) return
    try {
      const ctx  = this._ctx_get()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(f0, ctx.currentTime + delay)
      osc.frequency.exponentialRampToValueAtTime(f1, ctx.currentTime + delay + dur)
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur + 0.01)
    } catch (_) {}
  }

  // ── SFX ──────────────────────────────────────────────────────────────────────

  bump() {
    const now = Date.now()
    if (now - this._lastBump < 250) return   // debounce
    this._lastBump = now
    this._tone(90,  0.06, 'sawtooth', 0.18)
    this._tone(60,  0.08, 'sawtooth', 0.10, 0.05)
  }

  footstep() {
    this._tone(120, 0.04, 'square', 0.04)
  }

  cardPlay() {
    // Soft "fwoosh" rising sweep
    this._sweep(180, 540, 0.14, 'square', 0.10)
    this._tone(540,  0.08, 'square', 0.06, 0.12)
  }

  spellCast() {
    // Magical rise + sparkle
    this._sweep(320, 1280, 0.25, 'sine', 0.12)
    this._tone(1280, 0.12, 'sine',  0.07, 0.22)
    this._tone(1600, 0.10, 'sine',  0.05, 0.28)
  }

  attackHit() {
    // Sharp impact: noise burst via sawtooth + sub thump
    this._tone(200, 0.04, 'sawtooth', 0.28)
    this._tone(140, 0.07, 'sawtooth', 0.18, 0.03)
    this._tone(80,  0.12, 'square',   0.14, 0.06)
  }

  lifelinkHeal() {
    // Ascending gentle arpeggio
    [523, 659, 784].forEach((f, i) => this._tone(f, 0.18, 'sine', 0.09, i * 0.09))
  }

  gainLife() {
    [523, 659].forEach((f, i) => this._tone(f, 0.14, 'sine', 0.09, i * 0.08))
  }

  dialogTick() {
    this._tone(880, 0.03, 'square', 0.06)
  }

  openMenu() {
    this._tone(440, 0.06, 'square', 0.08)
    this._tone(660, 0.06, 'square', 0.06, 0.07)
  }

  goldEarn() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.11, 'square', 0.09, i * 0.07))
  }

  sealEarn() {
    // Triumphant arpeggio
    [392, 523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.18, 'square', 0.12, i * 0.10))
  }

  victory() {
    // Short fanfare
    const notes = [523, 659, 784, 659, 784, 1047]
    notes.forEach((f, i) => this._tone(f, i === 5 ? 0.35 : 0.14, 'square', 0.13, i * 0.12))
  }

  defeat() {
    [330, 277, 220, 185].forEach((f, i) => this._tone(f, 0.28, 'sawtooth', 0.11, i * 0.18))
  }

  sceneTransition() {
    this._sweep(400, 200, 0.2, 'sine', 0.08)
  }

  // ── BGM ──────────────────────────────────────────────────────────────────────
  // Patterns: [[freq, durationSeconds], ...]  freq=0 means rest

  static THEMES = {
    hub: [
      [261,0.18],[329,0.18],[392,0.18],[523,0.27],
      [440,0.18],[392,0.18],[329,0.18],[261,0.27],
      [0,  0.18],[329,0.18],[392,0.18],[440,0.18],
      [523,0.27],[440,0.18],[392,0.18],[0,  0.27],
    ],
    archives: [
      [294,0.27],[349,0.27],[392,0.27],[440,0.45],
      [392,0.27],[349,0.27],[294,0.27],[0,  0.45],
      [261,0.27],[294,0.27],[349,0.27],[392,0.45],
      [349,0.27],[294,0.27],[261,0.27],[0,  0.45],
    ],
    world: [
      [392,0.18],[523,0.18],[659,0.18],[784,0.27],
      [659,0.18],[523,0.18],[392,0.18],[0,  0.18],
      [349,0.18],[440,0.18],[523,0.18],[659,0.27],
      [523,0.18],[440,0.18],[349,0.27],[0,  0.27],
    ],
    battle: [
      [220,0.12],[220,0.12],[277,0.12],[220,0.12],
      [185,0.12],[196,0.24],[0,  0.12],
      [220,0.12],[261,0.12],[294,0.12],[261,0.12],
      [220,0.12],[196,0.24],[0,  0.12],
      [165,0.12],[185,0.12],[196,0.12],[220,0.24],
      [196,0.12],[185,0.12],[165,0.24],[0,  0.12],
    ],
    club: [
      [330,0.14],[392,0.14],[494,0.14],[392,0.14],
      [330,0.14],[294,0.27],[0,  0.14],
      [294,0.14],[330,0.14],[392,0.14],[440,0.14],
      [494,0.14],[440,0.27],[0,  0.14],
    ],
  }

  startBGM(theme = 'hub') {
    if (this._bgmTheme === theme) return  // already playing this theme
    this.stopBGM()
    this._bgmTheme = theme
    if (this._muted) return
    const pattern = SoundEngineClass.THEMES[theme] || SoundEngineClass.THEMES.hub

    const loop = () => {
      if (this._bgmTheme !== theme) return  // theme changed
      try {
        const ctx = this._ctx_get()
        let t = ctx.currentTime + 0.02
        for (const [freq, dur] of pattern) {
          if (freq > 0) {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'square'
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.055, t)
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.88)
            osc.start(t)
            osc.stop(t + dur)
          }
          t += dur
        }
        const totalMs = pattern.reduce((s, [, d]) => s + d, 0) * 1000
        this._bgmTimeout = setTimeout(loop, totalMs - 60)
      } catch (_) {}
    }
    loop()
  }

  stopBGM() {
    this._bgmTheme = null
    if (this._bgmTimeout) {
      clearTimeout(this._bgmTimeout)
      this._bgmTimeout = null
    }
  }

  setMuted(v) {
    this._muted = v
    if (v) this.stopBGM()
  }

  toggleMute() {
    this.setMuted(!this._muted)
    return this._muted
  }
}

export const SoundEngine = new SoundEngineClass()
