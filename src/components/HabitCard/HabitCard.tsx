import type { Habit, DailyEntry } from '../../types'
import { PARENT_APPROVE_HABIT_IDS } from '../../data/habits'
import styles from './HabitCard.module.css'

interface HabitCardProps {
  habit: Habit
  entry: DailyEntry | undefined
  onTap: (habitId: string) => void
}

export function HabitCard({ habit, entry, onTap }: HabitCardProps) {
  const needsApproval = habit.requiresApproval ?? PARENT_APPROVE_HABIT_IDS.has(habit.id)
  const isPending = entry?.approvalStatus === 'pending'
  const isApproved = entry?.approvalStatus === 'approved'
  const count = entry?.completionCount ?? 0
  const isMaxed = habit.maxPerDay !== undefined
    ? count >= habit.maxPerDay
    : count >= 1
  const isNeg = habit.points < 0
  const ptsLabel = `${habit.points > 0 ? '+' : ''}${habit.points} ⭐`

  // Parent-only habit (child can't tap — parent awards directly)
  if (habit.type === 'parent-only') {
    const isAwarded = entry?.approvalStatus === 'approved'
    return (
      <article className={[styles.card, isAwarded ? styles.done : styles.parentOnly, isNeg ? styles.penalty : ''].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={[styles.points, isNeg ? styles.pointsNeg : ''].join(' ')}>{ptsLabel}</span>
        </div>
        {isAwarded ? (
          <div className={styles.badge} data-variant="approved">{isNeg ? '⚠️ Noted' : '✅ Done!'}</div>
        ) : (
          <div className={styles.badge} data-variant="parent">👩‍👧 Mama/Papa</div>
        )}
      </article>
    )
  }

  // Once-daily that needs parent approval
  if (needsApproval) {
    return (
      <article className={[styles.card, isApproved ? styles.done : '', isNeg ? styles.penalty : ''].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={[styles.points, isNeg ? styles.pointsNeg : ''].join(' ')}>{ptsLabel}</span>
        </div>
        {isApproved ? (
          <div className={styles.badge} data-variant="approved">{isNeg ? '⚠️ Noted' : '✅ Done!'}</div>
        ) : isPending ? (
          <div className={styles.badge} data-variant="pending">⏳ Waiting…</div>
        ) : (
          <button
            className={[styles.button, isNeg ? styles.penaltyBtn : ''].join(' ')}
            onClick={() => onTap(habit.id)}
            aria-label={`I did: ${habit.name}`}
          >
            {isNeg ? '😔 Happened' : 'I did it!'}
          </button>
        )}
      </article>
    )
  }

  // Repeatable habit
  if (habit.type === 'repeatable') {
    const max = habit.maxPerDay
    return (
      <article className={[styles.card, isMaxed ? styles.done : '', isNeg ? styles.penalty : ''].join(' ')}>
        <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
        <div className={styles.info}>
          <span className={styles.name}>{habit.name}</span>
          <span className={[styles.points, isNeg ? styles.pointsNeg : ''].join(' ')}>{ptsLabel} each</span>
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
          className={[styles.button, isNeg ? styles.penaltyBtn : ''].join(' ')}
          onClick={() => onTap(habit.id)}
          disabled={isMaxed}
          aria-label={isMaxed ? `${habit.name} — all done for today!` : `Tap for ${habit.name}`}
        >
          {isMaxed ? (isNeg ? '⚠️ Noted' : '🌟 Max!') : (isNeg ? '😔 +1' : '+1')}
        </button>
      </article>
    )
  }

  // Once-daily (simple)
  return (
    <article className={[styles.card, isMaxed ? styles.done : '', isNeg ? styles.penalty : ''].join(' ')}>
      <span className={styles.emoji} aria-hidden="true">{habit.emoji}</span>
      <div className={styles.info}>
        <span className={styles.name}>{habit.name}</span>
        <span className={[styles.points, isNeg ? styles.pointsNeg : ''].join(' ')}>{ptsLabel}</span>
      </div>
      <button
        className={[styles.button, isNeg ? styles.penaltyBtn : ''].join(' ')}
        onClick={() => onTap(habit.id)}
        disabled={isMaxed}
        aria-label={isMaxed ? `${habit.name} — already done today!` : `I did: ${habit.name}`}
      >
        {isMaxed ? (isNeg ? '⚠️ Noted' : '⭐ Done!') : (isNeg ? '😔 Happened' : 'I did it!')}
      </button>
    </article>
  )
}
