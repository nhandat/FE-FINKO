/**
 * SoundManager — procedural sounds via Web Audio API.
 * No audio files needed. AudioContext unlocked on first user gesture.
 */

type OscType = OscillatorType

export class SoundManager {
  private ctx: AudioContext | null = null
  private _enabled = true
  private masterGain: GainNode | null = null

  get enabled() { return this._enabled }
  setEnabled(v: boolean) { this._enabled = v }

  // Lazy-init so we don't create AudioContext before user gesture
  private getCtx(): AudioContext | null {
    if (!this._enabled) return null
    if (typeof window === 'undefined') return null
    try {
      if (!this.ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext ?? (window as any).webkitAudioContext
        if (!AC) return null
        this.ctx = new AC()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = 0.7
        this.masterGain.connect(this.ctx.destination)
      }
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return this.ctx
    } catch { return null }
  }

  // ── Public sound methods ────────────────────────────────────────

  click() {
    this.tone(680, 'sine', 0.06, 0.08)
  }

  ballHit(row: number) {
    // Pitch rises slightly with each row (ball accelerating)
    const freq = 750 + row * 70
    this.tone(freq, 'triangle', 0.055, 0.065)
    // Small sub-thump
    this.tone(freq * 0.5, 'sine', 0.03, 0.04)
  }

  ballLand() {
    this.tone(320, 'sine', 0.10, 0.18)
    this.tone(240, 'triangle', 0.07, 0.12, 0.04)
  }

  win() {
    // Happy ascending triad
    this.chord([523, 659, 784], 'sine', 0.09, 0.30, 0)
  }

  bigWin() {
    // Two-beat fanfare chord progression
    this.chord([523, 659, 784], 'sine', 0.10, 0.28, 0)
    this.chord([659, 784, 1047], 'triangle', 0.12, 0.45, 0.26)
    this.chord([784, 1047, 1175], 'sine', 0.10, 0.6, 0.55)
  }

  // ── Primitives ──────────────────────────────────────────────────

  private tone(
    freq: number,
    type: OscType,
    vol: number,
    dur: number,
    delay = 0,
  ) {
    const ctx = this.getCtx()
    if (!ctx || !this.masterGain) return

    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(this.masterGain)

    const t = ctx.currentTime + delay
    gain.gain.setValueAtTime(0.001, t)
    gain.gain.linearRampToValueAtTime(vol, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  private chord(
    freqs: number[],
    type: OscType,
    totalVol: number,
    dur: number,
    delay: number,
  ) {
    freqs.forEach((f) => this.tone(f, type, totalVol / freqs.length, dur, delay))
  }
}

// Singleton
export const soundManager = new SoundManager()
