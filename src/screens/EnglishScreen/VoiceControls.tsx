import { useState, type ReactNode } from 'react'
import { speak } from '../../utils/speech'
import { canRecord, useRecorder } from '../../utils/useRecorder'
import styles from './EnglishScreen.module.css'

// ─── Hear button ──────────────────────────────────────────────────────────────

interface HearButtonProps {
  text: string
  label?: string
  lang?: 'en' | 'ta'
  size?: 'big' | 'small'
}

export function HearButton({ text, label, lang = 'en', size = 'small' }: HearButtonProps) {
  const [speaking, setSpeaking] = useState(false)

  async function handleClick() {
    setSpeaking(true)
    await speak(text, { lang })
    setSpeaking(false)
  }

  return (
    <button
      className={[styles.hearBtn, size === 'big' ? styles.hearBtnBig : '', speaking ? styles.pulsing : ''].join(' ')}
      onClick={handleClick}
      aria-label={`Hear: ${text}`}
    >
      🔊{label && <span>{label}</span>}
    </button>
  )
}

// ─── Record + play back ───────────────────────────────────────────────────────

interface RecordPanelProps {
  prompt?: string        // e.g. "Say it!"
  maxSeconds?: number
}

/** Tap 🎤 to record, tap again to stop, then ▶️ to hear yourself. */
export function RecordPanel({ prompt = 'Say it!', maxSeconds = 6 }: RecordPanelProps) {
  const rec = useRecorder(maxSeconds)
  if (!canRecord()) return null

  return (
    <div className={styles.recordPanel}>
      {rec.state === 'recording' ? (
        <button className={[styles.micBtn, styles.micRecording].join(' ')} onClick={rec.stop} aria-label="Stop recording">
          ⏹️ <span>Stop</span>
        </button>
      ) : (
        <button
          className={styles.micBtn}
          onClick={rec.start}
          disabled={rec.state === 'playing'}
          aria-label="Record my voice"
        >
          🎤 <span>{rec.clipUrl ? 'Again' : prompt}</span>
        </button>
      )}

      {rec.clipUrl && rec.state !== 'recording' && (
        <button
          className={[styles.playBtn, rec.state === 'playing' ? styles.pulsing : ''].join(' ')}
          onClick={rec.state === 'playing' ? rec.stop : rec.play}
          aria-label="Hear my voice"
        >
          ▶️ <span>Hear me</span>
        </button>
      )}

      {rec.error && <p className={styles.recordError}>🎤 {rec.error}</p>}
    </div>
  )
}

// ─── Text with lesson words highlighted ───────────────────────────────────────

export function HighlightWords({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>
  // Longest first so "next to" wins over "to"; whole words plus simple endings
  // ("wash" → "washes"), any case.
  const escaped = [...words].sort((a, b) => b.length - a.length)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`\\b(?:${escaped.join('|')})(?:s|es|d|ed|ing)?\\b`, 'gi')

  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<mark key={m.index} className={styles.highlight}>{m[0]}</mark>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}
