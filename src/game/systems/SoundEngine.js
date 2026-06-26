// SoundEngine.js — Multi-voice chiptune engine (FFTA / GBA quality)
// Singleton: import { SoundEngine } from './SoundEngine.js'

// ── Note lookup (octave 0-7) ─────────────────────────────────────────────────
const NOTE = {}
const NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B']
for (let oct = 0; oct <= 7; oct++) {
  for (let i = 0; i < 12; i++) {
    NOTE[`${NAMES[i]}${oct}`] = 440 * Math.pow(2, (oct - 4) * 12 + i - 9) / 12
    // Fix: proper frequency calc
  }
}
// Direct frequency table for accuracy
const N = {
  C2:65.41, D2:73.42, E2:82.41, F2:87.31, G2:98.00, A2:110.0, B2:123.5,
  C3:130.8, Cs3:138.6, D3:146.8, Ds3:155.6, E3:164.8, F3:174.6, Fs3:185.0, G3:196.0, Gs3:207.7, A3:220.0, As3:233.1, B3:246.9,
  C4:261.6, Cs4:277.2, D4:293.7, Ds4:311.1, E4:329.6, F4:349.2, Fs4:370.0, G4:392.0, Gs4:415.3, A4:440.0, As4:466.2, B4:493.9,
  C5:523.3, Cs5:554.4, D5:587.3, Ds5:622.3, E5:659.3, F5:698.5, Fs5:740.0, G5:784.0, Gs5:830.6, A5:880.0, As5:932.3, B5:987.8,
  C6:1047, D6:1175, E6:1319, F6:1397, G6:1568, A6:1760,
  R:0 // rest
}

class SoundEngineClass {
  constructor() {
    this._ctx = null
    this._bgmNodes = []
    this._bgmTimers = []
    this._bgmTheme = null
    this._muted = false
    this._lastBump = 0
    this._masterGain = null
  }

  // ── Lazy AudioContext ──────────────────────────────────────────────────────
  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      this._masterGain = this._ctx.createGain()
      this._masterGain.gain.value = 0.7
      this._masterGain.connect(this._ctx.destination)
    }
    if (this._ctx.state === 'suspended') this._ctx.resume()
    return this._ctx
  }

  _getMaster() {
    this._getCtx()
    return this._masterGain
  }

  // ── Voice: oscillator with ADSR envelope ──────────────────────────────────
  _voice(freq, start, dur, type = 'square', vol = 0.08, dest = null) {
    if (this._muted || freq <= 0) return
    try {
      const ctx = this._getCtx()
      const out = dest || this._getMaster()
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.connect(env)
      env.connect(out)
      osc.type = type

      osc.frequency.setValueAtTime(freq, start)

      // ADSR: attack 8ms, sustain, release 15%
      const atk = Math.min(0.008, dur * 0.1)
      const rel = dur * 0.15
      const sus = dur - atk - rel

      env.gain.setValueAtTime(0.001, start)
      env.gain.linearRampToValueAtTime(vol, start + atk)
      if (sus > 0) env.gain.setValueAtTime(vol * 0.85, start + atk + sus)
      env.gain.exponentialRampToValueAtTime(0.001, start + dur)

      osc.start(start)
      osc.stop(start + dur + 0.01)
    } catch (_) {}
  }

  // ── Noise burst (for percussion) ──────────────────────────────────────────
  _noise(start, dur, vol = 0.06) {
    if (this._muted) return
    try {
      const ctx = this._getCtx()
      const bufSize = ctx.sampleRate * dur
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1)

      const src = ctx.createBufferSource()
      src.buffer = buf
      const env = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = 3000

      src.connect(filter)
      filter.connect(env)
      env.connect(this._getMaster())

      env.gain.setValueAtTime(vol, start)
      env.gain.exponentialRampToValueAtTime(0.001, start + dur)

      src.start(start)
      src.stop(start + dur + 0.01)
    } catch (_) {}
  }

  // ── Simple reverb via feedback delay ──────────────────────────────────────
  _createReverbBus() {
    const ctx = this._getCtx()
    const input = ctx.createGain()
    const delay = ctx.createDelay()
    const feedback = ctx.createGain()
    const wetGain = ctx.createGain()

    delay.delayTime.value = 0.12
    feedback.gain.value = 0.25
    wetGain.gain.value = 0.3

    input.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    wetGain.connect(this._getMaster())
    input.connect(this._getMaster()) // dry signal

    return input
  }

  // ── Play a voice pattern: [{f, dur, type?, vol?}, ...] ────────────────────
  _playPattern(pattern, startTime, type = 'square', vol = 0.08, dest = null) {
    let t = startTime
    for (const note of pattern) {
      const freq = typeof note.f === 'number' ? note.f : (N[note.f] || 0)
      if (freq > 0) {
        this._voice(freq, t, note.d, note.type || type, note.vol || vol, dest)
      }
      t += note.d
    }
    return t - startTime // total duration
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SFX — Refined game sounds
  // ══════════════════════════════════════════════════════════════════════════

  bump() {
    const now = Date.now()
    if (now - this._lastBump < 250) return
    this._lastBump = now
    const ctx = this._getCtx()
    const t = ctx.currentTime
    this._voice(200, t, 0.06, 'sawtooth', 0.15)
    this._voice(120, t + 0.03, 0.08, 'square', 0.12)
    this._noise(t, 0.04, 0.08)
  }

  footstep() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Soft tap + subtle crunch
    this._voice(100 + Math.random() * 40, t, 0.04, 'triangle', 0.04)
    this._noise(t, 0.02, 0.02)
  }

  cardPlay() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Card whoosh + magical chime
    this._voice(N.C4, t, 0.06, 'square', 0.08)
    this._voice(N.E4, t + 0.04, 0.06, 'square', 0.07)
    this._voice(N.G4, t + 0.08, 0.08, 'sine', 0.09)
    this._voice(N.C5, t + 0.12, 0.12, 'sine', 0.06)
    this._noise(t, 0.06, 0.03) // paper whoosh
  }

  spellCast() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    // Magical ascending arpeggio with shimmer
    this._voice(N.C4, t, 0.10, 'sine', 0.10, reverb)
    this._voice(N.E4, t + 0.06, 0.10, 'sine', 0.09, reverb)
    this._voice(N.G4, t + 0.12, 0.10, 'sine', 0.08, reverb)
    this._voice(N.C5, t + 0.18, 0.14, 'sine', 0.10, reverb)
    this._voice(N.E5, t + 0.24, 0.18, 'sine', 0.07, reverb)
    // Sparkle overtones
    this._voice(N.G5, t + 0.28, 0.10, 'sine', 0.04, reverb)
    this._voice(N.C6, t + 0.32, 0.12, 'sine', 0.03, reverb)
  }

  attackHit() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Sharp metallic impact
    this._noise(t, 0.08, 0.20)
    this._voice(180, t, 0.03, 'sawtooth', 0.22)
    this._voice(120, t + 0.02, 0.06, 'square', 0.16)
    this._voice(80, t + 0.04, 0.10, 'triangle', 0.12)
    // Sub thump
    this._voice(50, t + 0.02, 0.15, 'sine', 0.10)
  }

  creatureDeath() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Descending wail + shatter
    this._voice(N.A4, t, 0.12, 'sawtooth', 0.10)
    this._voice(N.F4, t + 0.08, 0.12, 'sawtooth', 0.09)
    this._voice(N.D4, t + 0.16, 0.12, 'sawtooth', 0.08)
    this._voice(N.A3, t + 0.24, 0.20, 'sawtooth', 0.07)
    this._noise(t + 0.10, 0.12, 0.08)
  }

  lifelinkHeal() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    // Gentle ascending with warm harmony
    this._voice(N.C4, t, 0.16, 'sine', 0.08, reverb)
    this._voice(N.E4, t, 0.16, 'triangle', 0.05, reverb)
    this._voice(N.E4, t + 0.12, 0.16, 'sine', 0.08, reverb)
    this._voice(N.G4, t + 0.12, 0.16, 'triangle', 0.05, reverb)
    this._voice(N.G4, t + 0.24, 0.20, 'sine', 0.09, reverb)
    this._voice(N.C5, t + 0.24, 0.20, 'triangle', 0.05, reverb)
  }

  gainLife() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Two-note warm chime
    this._voice(N.C4, t, 0.12, 'sine', 0.08)
    this._voice(N.E4, t, 0.12, 'triangle', 0.04)
    this._voice(N.G4, t + 0.10, 0.16, 'sine', 0.09)
    this._voice(N.C5, t + 0.10, 0.16, 'triangle', 0.04)
  }

  dialogTick() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Classic FF text blip — two quick pulses
    const pitch = 600 + Math.random() * 100
    this._voice(pitch, t, 0.025, 'square', 0.05)
  }

  openMenu() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // FF menu open — quick ascending two-tone
    this._voice(N.E4, t, 0.05, 'square', 0.08)
    this._voice(N.B4, t + 0.05, 0.08, 'square', 0.07)
  }

  closeMenu() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Reverse of open
    this._voice(N.B4, t, 0.05, 'square', 0.07)
    this._voice(N.E4, t + 0.05, 0.08, 'square', 0.06)
  }

  confirm() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // FF confirm ding
    this._voice(N.E5, t, 0.06, 'square', 0.09)
    this._voice(N.A5, t + 0.06, 0.10, 'square', 0.08)
  }

  cancel() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    this._voice(N.A4, t, 0.06, 'square', 0.07)
    this._voice(N.E4, t + 0.05, 0.10, 'square', 0.06)
  }

  goldEarn() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Classic FF coin sound — bright ascending
    const notes = [N.E5, N.G5, N.B5, N.E6]
    notes.forEach((f, i) => {
      this._voice(f, t + i * 0.055, 0.10, 'square', 0.08)
      this._voice(f * 2, t + i * 0.055, 0.06, 'sine', 0.03) // overtone
    })
  }

  sealEarn() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    // Triumphant fanfare snippet
    const melody = [N.G4, N.B4, N.D5, N.G5, N.B5]
    melody.forEach((f, i) => {
      this._voice(f, t + i * 0.09, 0.16, 'square', 0.10, reverb)
      this._voice(f * 0.5, t + i * 0.09, 0.16, 'triangle', 0.04, reverb)
    })
  }

  victory() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    // Classic FF victory fanfare (simplified)
    const melody = [
      { f: N.C5, d: 0.12 }, { f: N.C5, d: 0.12 }, { f: N.C5, d: 0.12 },
      { f: N.C5, d: 0.36 },
      { f: N.Gs4, d: 0.12 }, { f: N.As4, d: 0.12 },
      { f: N.C5, d: 0.12 }, { f: N.As4, d: 0.12 }, { f: N.C5, d: 0.50 },
    ]
    const bass = [
      { f: N.C3, d: 0.48 }, { f: N.C3, d: 0.36 },
      { f: N.Gs3, d: 0.12 }, { f: N.As3, d: 0.12 },
      { f: N.C3, d: 0.12 }, { f: N.As3, d: 0.12 }, { f: N.C3, d: 0.50 },
    ]
    let mt = t
    for (const n of melody) {
      this._voice(n.f, mt, n.d * 0.9, 'square', 0.11, reverb)
      this._voice(n.f * 1.5, mt, n.d * 0.5, 'sine', 0.03, reverb) // 5th harmony
      mt += n.d
    }
    let bt = t
    for (const n of bass) {
      this._voice(n.f, bt, n.d * 0.9, 'triangle', 0.07, reverb)
      bt += n.d
    }
  }

  defeat() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    // Sorrowful descending phrase
    const melody = [
      { f: N.D4, d: 0.25 }, { f: N.Cs4, d: 0.25 },
      { f: N.A3, d: 0.25 }, { f: N.E3, d: 0.50 },
    ]
    let mt = t
    for (const n of melody) {
      this._voice(n.f, mt, n.d * 0.9, 'sawtooth', 0.08, reverb)
      this._voice(n.f * 0.5, mt, n.d * 0.9, 'triangle', 0.05, reverb)
      mt += n.d
    }
  }

  sceneTransition() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Quick swoosh down
    this._voice(N.G4, t, 0.06, 'square', 0.06)
    this._voice(N.D4, t + 0.04, 0.06, 'square', 0.05)
    this._voice(N.G3, t + 0.08, 0.10, 'triangle', 0.05)
    this._noise(t, 0.10, 0.04)
  }

  purchase() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Register cha-ching
    this._voice(N.E5, t, 0.05, 'square', 0.09)
    this._voice(N.G5, t + 0.05, 0.05, 'square', 0.08)
    this._voice(N.E6, t + 0.10, 0.14, 'sine', 0.07)
    this._noise(t + 0.08, 0.04, 0.04) // coin clink
  }

  error() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    // Buzzer — two dissonant tones
    this._voice(N.E4, t, 0.12, 'square', 0.10)
    this._voice(N.Ds4, t, 0.12, 'square', 0.10)
  }

  levelUp() {
    const ctx = this._getCtx()
    const t = ctx.currentTime
    const reverb = this._createReverbBus()
    const notes = [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6]
    notes.forEach((f, i) => {
      this._voice(f, t + i * 0.07, 0.14, 'square', 0.09 - i * 0.008, reverb)
      this._voice(f, t + i * 0.07, 0.14, 'sine', 0.04, reverb)
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  BGM — Multi-voice chiptune themes
  // ══════════════════════════════════════════════════════════════════════════

  // Each theme has: melody, harmony, bass, optional percussion
  // Notes are { f: freq_or_name, d: duration_seconds }

  static THEMES = {
    // ── Academy Hub: warm, inviting, pastoral (Sakimoto style) ──────────
    hub: {
      bpm: 108,
      melody: [
        { f:N.E4, d:0.28 }, { f:N.G4, d:0.28 }, { f:N.A4, d:0.28 }, { f:N.B4, d:0.42 },
        { f:N.A4, d:0.28 }, { f:N.G4, d:0.28 }, { f:N.E4, d:0.28 }, { f:N.D4, d:0.42 },
        { f:N.C4, d:0.28 }, { f:N.D4, d:0.28 }, { f:N.E4, d:0.28 }, { f:N.G4, d:0.42 },
        { f:N.A4, d:0.28 }, { f:N.G4, d:0.28 }, { f:N.E4, d:0.56 }, { f:N.R, d:0.14 },

        { f:N.A4, d:0.28 }, { f:N.B4, d:0.28 }, { f:N.C5, d:0.28 }, { f:N.D5, d:0.42 },
        { f:N.C5, d:0.28 }, { f:N.B4, d:0.28 }, { f:N.A4, d:0.28 }, { f:N.G4, d:0.42 },
        { f:N.E4, d:0.28 }, { f:N.G4, d:0.28 }, { f:N.A4, d:0.42 }, { f:N.G4, d:0.28 },
        { f:N.E4, d:0.56 }, { f:N.R, d:0.42 },
      ],
      harmony: [
        { f:N.C4, d:0.56 }, { f:N.E4, d:0.56 }, { f:N.D4, d:0.56 }, { f:N.G3, d:0.56 },
        { f:N.A3, d:0.56 }, { f:N.C4, d:0.56 }, { f:N.E4, d:0.56 }, { f:N.D4, d:0.70 },

        { f:N.F4, d:0.56 }, { f:N.E4, d:0.56 }, { f:N.D4, d:0.56 }, { f:N.E4, d:0.56 },
        { f:N.C4, d:0.56 }, { f:N.D4, d:0.56 }, { f:N.C4, d:0.56 }, { f:N.R, d:0.42 },
      ],
      bass: [
        { f:N.C3, d:0.56 }, { f:N.C3, d:0.56 }, { f:N.G2, d:0.56 }, { f:N.G2, d:0.56 },
        { f:N.A2, d:0.56 }, { f:N.C3, d:0.56 }, { f:N.C3, d:0.56 }, { f:N.G2, d:0.70 },

        { f:N.F2, d:0.56 }, { f:N.E2, d:0.56 }, { f:N.G2, d:0.56 }, { f:N.C3, d:0.56 },
        { f:N.A2, d:0.56 }, { f:N.G2, d:0.56 }, { f:N.C3, d:0.56 }, { f:N.R, d:0.42 },
      ],
      perc: true,
      melVol: 0.09, harmVol: 0.04, bassVol: 0.06,
      melType: 'square', harmType: 'triangle', bassType: 'triangle',
    },

    // ── Archives: mysterious, scholarly, minor key ──────────────────────
    archives: {
      bpm: 80,
      melody: [
        { f:N.D4, d:0.38 }, { f:N.F4, d:0.38 }, { f:N.A4, d:0.38 }, { f:N.G4, d:0.56 },
        { f:N.F4, d:0.38 }, { f:N.E4, d:0.38 }, { f:N.D4, d:0.56 }, { f:N.R, d:0.38 },
        { f:N.A4, d:0.38 }, { f:N.G4, d:0.38 }, { f:N.F4, d:0.38 }, { f:N.E4, d:0.56 },
        { f:N.D4, d:0.38 }, { f:N.C4, d:0.38 }, { f:N.D4, d:0.76 }, { f:N.R, d:0.38 },
      ],
      harmony: [
        { f:N.A3, d:0.76 }, { f:N.D4, d:0.76 }, { f:N.C4, d:0.76 }, { f:N.A3, d:0.76 },
        { f:N.F3, d:0.76 }, { f:N.C4, d:0.76 }, { f:N.A3, d:0.76 }, { f:N.R, d:0.38 },
      ],
      bass: [
        { f:N.D2, d:0.76 }, { f:N.D2, d:0.76 }, { f:N.A2, d:0.76 }, { f:N.D2, d:0.76 },
        { f:N.F2, d:0.76 }, { f:N.C3, d:0.76 }, { f:N.D2, d:0.76 }, { f:N.R, d:0.38 },
      ],
      perc: false,
      melVol: 0.07, harmVol: 0.04, bassVol: 0.05,
      melType: 'sine', harmType: 'triangle', bassType: 'triangle',
    },

    // ── World Map: adventurous, heroic, soaring ─────────────────────────
    world: {
      bpm: 120,
      melody: [
        { f:N.G4, d:0.25 }, { f:N.A4, d:0.25 }, { f:N.B4, d:0.25 }, { f:N.D5, d:0.50 },
        { f:N.C5, d:0.25 }, { f:N.B4, d:0.25 }, { f:N.A4, d:0.25 }, { f:N.G4, d:0.50 },
        { f:N.E4, d:0.25 }, { f:N.G4, d:0.25 }, { f:N.A4, d:0.50 }, { f:N.B4, d:0.25 },
        { f:N.A4, d:0.25 }, { f:N.G4, d:0.50 }, { f:N.R, d:0.25 },

        { f:N.B4, d:0.25 }, { f:N.C5, d:0.25 }, { f:N.D5, d:0.25 }, { f:N.E5, d:0.50 },
        { f:N.D5, d:0.25 }, { f:N.C5, d:0.25 }, { f:N.B4, d:0.25 }, { f:N.A4, d:0.50 },
        { f:N.G4, d:0.25 }, { f:N.B4, d:0.25 }, { f:N.D5, d:0.50 },
        { f:N.G5, d:0.50 }, { f:N.R, d:0.25 },
      ],
      harmony: [
        { f:N.D4, d:0.50 }, { f:N.G4, d:0.50 }, { f:N.E4, d:0.50 }, { f:N.D4, d:0.50 },
        { f:N.C4, d:0.50 }, { f:N.E4, d:0.50 }, { f:N.D4, d:0.50 }, { f:N.R, d:0.25 },

        { f:N.G4, d:0.50 }, { f:N.A4, d:0.50 }, { f:N.G4, d:0.50 }, { f:N.E4, d:0.50 },
        { f:N.D4, d:0.50 }, { f:N.G4, d:0.50 },
        { f:N.D5, d:0.50 }, { f:N.R, d:0.25 },
      ],
      bass: [
        { f:N.G2, d:0.50 }, { f:N.G2, d:0.50 }, { f:N.C3, d:0.50 }, { f:N.G2, d:0.50 },
        { f:N.A2, d:0.50 }, { f:N.C3, d:0.50 }, { f:N.G2, d:0.50 }, { f:N.R, d:0.25 },

        { f:N.G2, d:0.50 }, { f:N.A2, d:0.50 }, { f:N.E2, d:0.50 }, { f:N.C3, d:0.50 },
        { f:N.G2, d:0.50 }, { f:N.G2, d:0.50 },
        { f:N.G2, d:0.50 }, { f:N.R, d:0.25 },
      ],
      perc: true,
      melVol: 0.09, harmVol: 0.04, bassVol: 0.06,
      melType: 'square', harmType: 'triangle', bassType: 'triangle',
    },

    // ── Battle: intense, driving, urgent ─────────────────────────────────
    battle: {
      bpm: 140,
      melody: [
        { f:N.A4, d:0.21 }, { f:N.A4, d:0.11 }, { f:N.C5, d:0.21 }, { f:N.A4, d:0.11 },
        { f:N.E4, d:0.21 }, { f:N.F4, d:0.21 }, { f:N.E4, d:0.43 },
        { f:N.A4, d:0.21 }, { f:N.A4, d:0.11 }, { f:N.C5, d:0.21 }, { f:N.D5, d:0.11 },
        { f:N.E5, d:0.21 }, { f:N.D5, d:0.21 }, { f:N.C5, d:0.43 },
        { f:N.F4, d:0.21 }, { f:N.G4, d:0.21 }, { f:N.A4, d:0.21 }, { f:N.G4, d:0.11 },
        { f:N.F4, d:0.21 }, { f:N.E4, d:0.21 }, { f:N.D4, d:0.43 },
        { f:N.E4, d:0.21 }, { f:N.F4, d:0.21 }, { f:N.G4, d:0.21 }, { f:N.A4, d:0.21 },
        { f:N.E5, d:0.43 }, { f:N.R, d:0.21 },
      ],
      harmony: [
        { f:N.E4, d:0.43 }, { f:N.E4, d:0.43 }, { f:N.C4, d:0.43 }, { f:N.C4, d:0.43 },
        { f:N.E4, d:0.43 }, { f:N.F4, d:0.43 }, { f:N.E4, d:0.43 }, { f:N.E4, d:0.43 },
        { f:N.D4, d:0.43 }, { f:N.C4, d:0.43 }, { f:N.D4, d:0.43 }, { f:N.A3, d:0.43 },
        { f:N.C4, d:0.43 }, { f:N.D4, d:0.43 }, { f:N.C5, d:0.43 }, { f:N.R, d:0.21 },
      ],
      bass: [
        { f:N.A2, d:0.21 }, { f:N.R, d:0.11 }, { f:N.A2, d:0.11 }, { f:N.A2, d:0.21 },
        { f:N.R, d:0.11 }, { f:N.A2, d:0.11 }, { f:N.C3, d:0.21 }, { f:N.C3, d:0.21 },
        { f:N.A2, d:0.21 }, { f:N.R, d:0.11 }, { f:N.A2, d:0.11 }, { f:N.A2, d:0.21 },
        { f:N.R, d:0.11 }, { f:N.A2, d:0.11 }, { f:N.E3, d:0.21 }, { f:N.E3, d:0.21 },
        { f:N.D3, d:0.21 }, { f:N.D3, d:0.21 }, { f:N.F3, d:0.21 }, { f:N.F3, d:0.21 },
        { f:N.A2, d:0.21 }, { f:N.A2, d:0.21 },
        { f:N.C3, d:0.21 }, { f:N.E3, d:0.21 }, { f:N.A2, d:0.43 }, { f:N.R, d:0.21 },
      ],
      perc: true,
      melVol: 0.10, harmVol: 0.05, bassVol: 0.07,
      melType: 'square', harmType: 'square', bassType: 'sawtooth',
    },

    // ── Club Rooms: cozy, social, lighter ───────────────────────────────
    club: {
      bpm: 100,
      melody: [
        { f:N.E4, d:0.30 }, { f:N.Fs4, d:0.30 }, { f:N.G4, d:0.30 }, { f:N.B4, d:0.45 },
        { f:N.A4, d:0.30 }, { f:N.G4, d:0.30 }, { f:N.Fs4, d:0.30 }, { f:N.E4, d:0.45 },
        { f:N.D4, d:0.30 }, { f:N.E4, d:0.30 }, { f:N.Fs4, d:0.30 }, { f:N.G4, d:0.45 },
        { f:N.A4, d:0.30 }, { f:N.G4, d:0.30 }, { f:N.E4, d:0.60 }, { f:N.R, d:0.30 },
      ],
      harmony: [
        { f:N.B3, d:0.60 }, { f:N.D4, d:0.60 }, { f:N.E4, d:0.60 }, { f:N.B3, d:0.60 },
        { f:N.A3, d:0.60 }, { f:N.B3, d:0.60 }, { f:N.C4, d:0.60 }, { f:N.R, d:0.30 },
      ],
      bass: [
        { f:N.E2, d:0.60 }, { f:N.G2, d:0.60 }, { f:N.A2, d:0.60 }, { f:N.E2, d:0.60 },
        { f:N.D2, d:0.60 }, { f:N.E2, d:0.60 }, { f:N.C3, d:0.60 }, { f:N.R, d:0.30 },
      ],
      perc: false,
      melVol: 0.07, harmVol: 0.04, bassVol: 0.05,
      melType: 'square', harmType: 'sine', bassType: 'triangle',
    },

    // ── Sanctum: ethereal, sacred, reverent ─────────────────────────────
    sanctum: {
      bpm: 72,
      melody: [
        { f:N.E4, d:0.42 }, { f:N.G4, d:0.42 }, { f:N.B4, d:0.63 },
        { f:N.A4, d:0.42 }, { f:N.G4, d:0.42 }, { f:N.E4, d:0.63 },
        { f:N.D4, d:0.42 }, { f:N.E4, d:0.42 }, { f:N.G4, d:0.63 },
        { f:N.A4, d:0.42 }, { f:N.B4, d:0.63 }, { f:N.R, d:0.42 },
      ],
      harmony: [
        { f:N.B3, d:0.84 }, { f:N.E4, d:0.84 }, { f:N.D4, d:0.84 }, { f:N.C4, d:0.84 },
        { f:N.A3, d:0.84 }, { f:N.B3, d:0.84 }, { f:N.E4, d:0.63 }, { f:N.R, d:0.42 },
      ],
      bass: [
        { f:N.E2, d:0.84 }, { f:N.E2, d:0.84 }, { f:N.A2, d:0.84 }, { f:N.C3, d:0.84 },
        { f:N.D2, d:0.84 }, { f:N.E2, d:0.84 }, { f:N.E2, d:0.63 }, { f:N.R, d:0.42 },
      ],
      perc: false,
      melVol: 0.06, harmVol: 0.04, bassVol: 0.04,
      melType: 'sine', harmType: 'sine', bassType: 'triangle',
    },

    // ── Title Screen: majestic, grand ────────────────────────────────────
    title: {
      bpm: 90,
      melody: [
        { f:N.G4, d:0.33 }, { f:N.R, d:0.17 }, { f:N.G4, d:0.33 }, { f:N.R, d:0.17 },
        { f:N.G4, d:0.33 }, { f:N.D5, d:0.67 },
        { f:N.C5, d:0.33 }, { f:N.B4, d:0.33 }, { f:N.A4, d:0.33 }, { f:N.G4, d:0.67 },
        { f:N.R, d:0.17 }, { f:N.A4, d:0.33 }, { f:N.B4, d:0.33 },
        { f:N.C5, d:0.33 }, { f:N.D5, d:0.67 }, { f:N.B4, d:0.33 }, { f:N.G4, d:0.67 },
        { f:N.R, d:0.33 },
      ],
      harmony: [
        { f:N.D4, d:0.67 }, { f:N.D4, d:0.67 }, { f:N.D4, d:0.33 }, { f:N.G4, d:0.67 },
        { f:N.E4, d:0.67 }, { f:N.D4, d:0.67 }, { f:N.D4, d:0.67 },
        { f:N.D4, d:0.50 }, { f:N.E4, d:0.50 },
        { f:N.E4, d:0.33 }, { f:N.G4, d:0.67 }, { f:N.D4, d:0.33 }, { f:N.D4, d:0.67 },
        { f:N.R, d:0.33 },
      ],
      bass: [
        { f:N.G2, d:0.67 }, { f:N.G2, d:0.67 }, { f:N.G2, d:0.33 }, { f:N.G2, d:0.67 },
        { f:N.C3, d:0.67 }, { f:N.D3, d:0.67 }, { f:N.G2, d:0.67 },
        { f:N.A2, d:0.50 }, { f:N.G2, d:0.50 },
        { f:N.C3, d:0.33 }, { f:N.G2, d:0.67 }, { f:N.G2, d:0.33 }, { f:N.G2, d:0.67 },
        { f:N.R, d:0.33 },
      ],
      perc: true,
      melVol: 0.10, harmVol: 0.05, bassVol: 0.07,
      melType: 'square', harmType: 'triangle', bassType: 'triangle',
    },
  }

  startBGM(theme = 'hub') {
    if (this._bgmTheme === theme) return
    this.stopBGM()
    this._bgmTheme = theme
    if (this._muted) return

    const themeData = SoundEngineClass.THEMES[theme] || SoundEngineClass.THEMES.hub

    const scheduleLoop = () => {
      if (this._bgmTheme !== theme) return
      try {
        const ctx = this._getCtx()
        const reverb = this._createReverbBus()
        const t = ctx.currentTime + 0.05

        // Melody voice
        this._playPattern(themeData.melody, t, themeData.melType, themeData.melVol, reverb)

        // Harmony voice
        this._playPattern(themeData.harmony, t, themeData.harmType, themeData.harmVol, reverb)

        // Bass voice
        this._playPattern(themeData.bass, t, themeData.bassType, themeData.bassVol)

        // Percussion — light kick + hi-hat pattern
        if (themeData.perc) {
          const beatDur = 60 / (themeData.bpm || 120)
          const totalDur = themeData.melody.reduce((s, n) => s + n.d, 0)
          const beats = Math.floor(totalDur / beatDur)
          for (let i = 0; i < beats; i++) {
            const bt = t + i * beatDur
            if (i % 2 === 0) {
              // Kick on downbeats
              this._voice(55, bt, 0.08, 'sine', 0.06)
            }
            // Hi-hat on every beat
            this._noise(bt, 0.03, 0.025)
            // Off-beat hi-hat (lighter)
            this._noise(bt + beatDur * 0.5, 0.02, 0.015)
          }
        }

        // Schedule next loop
        const totalMs = themeData.melody.reduce((s, n) => s + n.d, 0) * 1000
        const timer = setTimeout(scheduleLoop, totalMs - 100)
        this._bgmTimers.push(timer)
      } catch (_) {}
    }

    scheduleLoop()
  }

  stopBGM() {
    this._bgmTheme = null
    for (const t of this._bgmTimers) clearTimeout(t)
    this._bgmTimers = []
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
