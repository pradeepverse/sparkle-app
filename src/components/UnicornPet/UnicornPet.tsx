import { useEffect, useRef, useState } from 'react'
import type { UnicornMood } from '../../types'
import { UNICORN_LEVEL_NAMES } from '../../types'
import { MOOD_LABELS } from '../../utils/unicornMood'
import styles from './UnicornPet.module.css'

interface UnicornPetProps {
  mood: UnicornMood
  level: number
  isAnimating: boolean
}

// ─── Mood sections (seconds) within unicorn.webm ──────────────────────────────
// Format: seconds + frames/30  (e.g. 1:20 = 1 + 20/30 ≈ 1.667)

const MOOD_SECTIONS: Record<UnicornMood, { start: number; end: number }> = {
  sleepy:  { start: 0.1,      end: 1.5  },
  okay:    { start: 1.88,  end: 3.6    },
  happy:   { start: 3.6,    end: 8.4    },
  magical: { start: 8.4,    end: 13 },
  party:   { start: 14, end: 21     },
}

const MOOD_ORDER: UnicornMood[] = ['sleepy', 'okay', 'happy', 'magical', 'party']

// ─── Component ────────────────────────────────────────────────────────────────

export function UnicornPet({ mood, level, isAnimating }: UnicornPetProps) {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const moodRef     = useRef(mood)       // always current — read inside event handler
  const prevMoodRef = useRef(mood)       // previous mood for elevation detection
  const [dancing, setDancing] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  // Keep moodRef in sync on every render (no effect needed)
  moodRef.current = mood

  // ── Mount: seek to starting section and attach the loop guard ────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function handleTimeUpdate() {
      const { start, end } = MOOD_SECTIONS[moodRef.current]
      if (video!.currentTime >= end) {
        video!.currentTime = start
      }
    }

    // Seek to initial mood position once metadata is available
    function handleMetadata() {
      video!.currentTime = MOOD_SECTIONS[moodRef.current].start
      video!.play().catch(() => {})
      setVideoReady(true)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleMetadata)

    // If already loaded (cached), kick it off immediately
    if (video.readyState >= 1) {
      video.currentTime = MOOD_SECTIONS[moodRef.current].start
      video.play().catch(() => {})
      setVideoReady(true)
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleMetadata)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mood change: elevate (play forward) or drop (seek back) ─────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const prevOrder = MOOD_ORDER.indexOf(prevMoodRef.current)
    const newOrder  = MOOD_ORDER.indexOf(mood)

    if (newOrder <= prevOrder) {
      // Mood dropped — jump to the new section immediately
      video.currentTime = MOOD_SECTIONS[mood].start
    }
    // Mood elevated — video plays forward naturally; loop guard takes over
    // once currentTime enters the new section's end boundary

    prevMoodRef.current = mood
    video.play().catch(() => {})
  }, [mood])

  // ── Dance burst on star earn ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAnimating) return
    setDancing(true)
    const t = setTimeout(() => setDancing(false), 800)
    return () => clearTimeout(t)
  }, [isAnimating])

  const unicornName = UNICORN_LEVEL_NAMES[level] ?? 'Sparkle'

  return (
    <div
      className={styles.wrapper}
      aria-label={`${unicornName} the unicorn is feeling ${MOOD_LABELS[mood]}`}
      role="img"
    >
      {/* Mood aura */}
      <div className={[styles.aura, styles[`aura_${mood}`]].join(' ')} aria-hidden="true" />

      {/* Unicorn video — loops within current mood's timestamp section */}
      <video
        ref={videoRef}
        className={[styles.unicorn, styles[mood], dancing ? styles.dancing : '', videoReady ? styles.videoVisible : ''].join(' ')}
        src={`${import.meta.env.BASE_URL}unicorn.webm`}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {/* Mood label */}
      <div className={[styles.moodLabel, styles[`label_${mood}`]].join(' ')} aria-hidden="true">
        {MOOD_LABELS[mood]}
      </div>

      {/* Unicorn name / level */}
      <div className={styles.name}>{unicornName}</div>
    </div>
  )
}
