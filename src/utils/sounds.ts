// Web Audio API chime synthesiser — no external files needed.
// All sounds are generated from oscillators with bell-like envelopes.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(
  freq: number,
  startTime: number,
  duration: number,
  volume = 0.22,
  type: OscillatorType = 'sine',
) {
  const ac = getCtx()
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = type
  osc.frequency.value = freq
  // Bell envelope: near-instant attack, slow exponential decay
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

// ─── Public sound functions ────────────────────────────────────────────────

/** Soft single ding when a habit is tapped but needs parent approval */
export function playPendingTap() {
  const t = getCtx().currentTime
  tone(523.25, t, 0.35, 0.18)  // C5 — gentle, non-committal
}

/** Warm 3-note ascending chime when stars are earned immediately */
export function playStarsEarned() {
  const t = getCtx().currentTime
  tone(523.25, t,        0.55)  // C5
  tone(659.25, t + 0.13, 0.55)  // E5
  tone(783.99, t + 0.26, 0.70)  // G5
}

/** 4-note sparkle arpeggio for a lucky star bonus */
export function playLuckyStar() {
  const t = getCtx().currentTime
  tone(659.25, t,        0.30)  // E5
  tone(783.99, t + 0.10, 0.30)  // G5
  tone(987.77, t + 0.20, 0.30)  // B5
  tone(1046.5, t + 0.30, 0.65, 0.28)  // C6 — bright top note
}

/** Short victory jingle when a reward is redeemed */
export function playRewardRedeemed() {
  const t = getCtx().currentTime
  tone(523.25, t,        0.18)  // C5
  tone(659.25, t + 0.10, 0.18)  // E5
  tone(783.99, t + 0.20, 0.18)  // G5
  tone(659.25, t + 0.30, 0.18)  // E5
  tone(783.99, t + 0.40, 0.18)  // G5
  tone(1046.5, t + 0.50, 0.90, 0.30)  // C6
}
