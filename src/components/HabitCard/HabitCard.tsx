import type { Habit, DailyEntry } from '../../types'
import { PARENT_APPROVE_HABIT_IDS } from '../../data/habits'
import styles from './HabitCard.module.css'

interface HabitCardProps {
  habit: Habit
  entry: DailyEntry | undefined
  onTap: (habitId: string) => void
}

export function HabitCard({ habit, entry, onTap }: HabitCardProps) {
  const needsApproval = PARENT_APPROVE_HABIT_IDS.has(habit.id)
  const isPending = entry?.approvalStatus === 'pending'
  const isApproved = entry?.approvalStatus === 'approved'
  const count = entry?.completionCount ?? 0
  const isMaxed = habit.maxPerDay !== undefined
    ? count >= habit.maxPerDay
    : count >= 1

  // Parent-only habit (child can't tap — parent awards directly)
  if (habit.type === 'parent-only') {
    const isAwarded = entry?.approvalStatus === 'approved'
    return (
      <article className={[styles.card, isAwarded ? styles.done : styles.parentOnly].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={styles.points}>+{habit.points} ⭐</span>
        </div>
        {isAwarded ? (
          <div className={styles.badge} data-variant="approved">✅ Done!</div>
        ) : (
          <div className={styles.badge} data-variant="parent">👩‍👧 Mama/Papa</div>
        )}
      </article>
    )
  }

  // Once-daily that needs parent approval
  if (needsApproval) {
    return (
      <article className={[styles.card, isApproved ? styles.done : ''].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={styles.points}>+{habit.points} ⭐</span>
        </div>
        {isApproved ? (
          <div className={styles.badge} data-variant="approved">✅ Done!</div>
        ) : isPending ? (
          <div className={styles.badge} data-variant="pending">⏳ Waiting…</div>
        ) : (
          <button
            className={styles.button}
            onClick={() => onTap(habit.id)}
            aria-label={`I did: ${habit.name}`}
          >
            I did it!
          </button>
        )}
      </article>
    )
  }

  // Repeatable habit (water, potty)
  if (habit.type === 'repeatable') {
    const max = habit.maxPerDay
    return (
      <article className={[styles.card, isMaxed ? styles.done : ''].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={styles.points}>+{habit.points} ⭐ each</span>
          {max !== undefined && (
            <div className={styles.dots} aria-label={`${count} of ${max} done`}>
              {Array.from({ length: max }).map((_, i) => (
                <span
                  key={i}
                  className={[styles.dot, i < count ? styles.dotFilled : ''].join(' ')}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>
        <button
          className={styles.button}
          onClick={() => onTap(habit.id)}
          disabled={isMaxed}
          aria-label={isMaxed ? `${habit.name} — all done for today!` : `Tap for ${habit.name}`}
        >
          {isMaxed ? '🌟 Max!' : `+1`}
        </button>
      </article>
    )
  }

  // Once-daily (simple)
  return (
    <article className={[styles.card, isMaxed ? styles.done : ''].join(' ')}>
      <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
      <div className={styles.info}>
        <span className={styles.name}>{habit.name}</span>
        <span className={styles.points}>+{habit.points} ⭐</span>
      </div>
      <button
        className={styles.button}
        onClick={() => onTap(habit.id)}
        disabled={isMaxed}
        aria-label={isMaxed ? `${habit.name} — already done today!` : `I did: ${habit.name}`}
      >
        {isMaxed ? '⭐ Done!' : 'I did it!'}
      </button>
    </article>
  )
}
