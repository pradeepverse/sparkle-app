import { useEffect, useState } from 'react'
import styles from './StarBurst.module.css'

interface StarBurstProps {
  /** Increment this value to trigger a new burst */
  trigger: number
  /** Extra bonus stars earned (shown as +N) */
  bonusStars?: number
}

const STAR_COUNT = 8
const STAR_EMOJIS = ['⭐', '✨', '🌟', '⭐', '✨', '⭐', '🌟', '⭐']

export function StarBurst({ trigger, bonusStars = 0 }: StarBurstProps) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (trigger === 0) return
    setActive(true)
    const t = setTimeout(() => setActive(false), 900)
    return () => clearTimeout(t)
  }, [trigger])

  if (!active) return null

  return (
    <div className={styles.overlay} aria-hidden="true">
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const angle = (i / STAR_COUNT) * 360
        const distance = 80 + Math.random() * 40
        const dx = Math.round(Math.cos((angle * Math.PI) / 180) * distance)
        const dy = Math.round(Math.sin((angle * Math.PI) / 180) * distance)
        return (
          <span
            key={i}
            className={styles.star}
            style={{
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              '--delay': `${i * 0.04}s`,
            } as React.CSSProperties}
          >
            {STAR_EMOJIS[i]}
          </span>
        )
      })}
      {bonusStars > 0 && (
        <div className={styles.bonus}>+{bonusStars} Lucky Stars! 🍀</div>
      )}
    </div>
  )
}
