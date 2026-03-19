import { useEffect, useState } from 'react'
import type { UnicornMood } from '../../types'
import { UNICORN_LEVEL_NAMES } from '../../types'
import { MOOD_LABELS } from '../../utils/unicornMood'
import styles from './UnicornPet.module.css'

interface UnicornPetProps {
  mood: UnicornMood
  level: number
  isAnimating: boolean
}

const MOOD_IMAGE: Record<UnicornMood, string> = {
  sleepy:  `${import.meta.env.BASE_URL}unicorn-sleepy.webp`,
  okay:    `${import.meta.env.BASE_URL}unicorn-okay.webp`,
  happy:   `${import.meta.env.BASE_URL}unicorn-happy.webp`,
  magical: `${import.meta.env.BASE_URL}unicorn-magical.webp`,
  party:   `${import.meta.env.BASE_URL}unicorn-party.webp`,
}

export function UnicornPet({ mood, level, isAnimating }: UnicornPetProps) {
  const [dancing, setDancing] = useState(false)

  // Trigger dance animation whenever isAnimating flips true
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
      {/* Mood aura — big coloured circle behind unicorn */}
      <div className={[styles.aura, styles[`aura_${mood}`]].join(' ')} aria-hidden="true" />

      {/* Sparkle halo for magical/party moods */}
      {(mood === 'magical' || mood === 'party') && (
        <div className={styles.halo} aria-hidden="true">
          <span className={styles.haloStar}>✨</span>
          <span className={styles.haloStar}>⭐</span>
          <span className={styles.haloStar}>✨</span>
        </div>
      )}

      {/* Confetti for party mode */}
      {mood === 'party' && (
        <div className={styles.confetti} aria-hidden="true">
          {['🎊', '🎉', '🌈', '⭐', '🎊', '🌟'].map((c, i) => (
            <span key={i} className={styles.confettiPiece} style={{ '--i': i } as React.CSSProperties}>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* The unicorn image */}
      <img
        data-testid="unicorn-pet"
        src={MOOD_IMAGE[mood]}
        alt=""
        className={[
          styles.unicorn,
          styles[mood],
          dancing ? styles.dancing : '',
        ].join(' ')}
      />

      {/* Mood label */}
      <div className={[styles.moodLabel, styles[`label_${mood}`]].join(' ')} aria-hidden="true">
        {MOOD_LABELS[mood]}
      </div>

      {/* Name */}
      <div className={styles.name}>{unicornName}</div>
    </div>
  )
}
