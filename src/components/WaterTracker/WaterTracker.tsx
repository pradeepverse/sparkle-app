import styles from './WaterTracker.module.css'

interface WaterTrackerProps {
  count: number   // glasses drunk today (0–5)
  onTap: () => void
}

const MAX = 5

export function WaterTracker({ count, onTap }: WaterTrackerProps) {
  const isComplete = count >= MAX

  return (
    <div className={styles.wrapper}>
      <div className={styles.drops} aria-label={`${count} of ${MAX} glasses of water today`}>
        {Array.from({ length: MAX }).map((_, i) => (
          <button
            key={i}
            className={[styles.drop, i < count ? styles.filled : ''].join(' ')}
            onClick={i === count ? onTap : undefined}
            disabled={i !== count || isComplete}
            aria-label={i < count ? `Glass ${i + 1} done` : i === count ? 'Tap to log a glass of water' : ''}
          >
            💧
          </button>
        ))}
      </div>
      {isComplete && (
        <div className={styles.complete} aria-live="polite">
          Amazing! 5 glasses today! 🌟
        </div>
      )}
    </div>
  )
}
