import type { Habit, DailyEntry, UserProgress } from '../../types'
import { UnicornPet } from '../../components/UnicornPet/UnicornPet'
import { HabitCard } from '../../components/HabitCard/HabitCard'
import { computeMood } from '../../utils/unicornMood'
import { MAX_DAILY_STARS } from '../../data/habits'
import styles from './HomeScreen.module.css'

interface HomeScreenProps {
  habits: Habit[]
  entries: Map<string, DailyEntry>  // habitId → DailyEntry for today
  progress: UserProgress
  isUnicornAnimating: boolean
  starBumpKey: number               // changes to trigger star number bump animation
  soundEnabled: boolean
  onTapHabit: (habitId: string) => void
  onToggleSound: () => void
  onShowParent: () => void
}

export function HomeScreen({
  habits,
  entries,
  progress,
  isUnicornAnimating,
  starBumpKey,
  soundEnabled,
  onTapHabit,
  onToggleSound,
  onShowParent,
}: HomeScreenProps) {
  const starsToday = Array.from(entries.values()).reduce(
    (sum, e) => sum + e.starsEarned + e.bonusStars, 0
  )
  const mood = computeMood(starsToday, MAX_DAILY_STARS, progress.currentStreak)

  const morningHabits = habits.filter(h => h.timeOfDay === 'morning' && !h.isArchived)
  const alldayHabits  = habits.filter(h => h.timeOfDay === 'allday'  && !h.isArchived)
  const eveningHabits = habits.filter(h => h.timeOfDay === 'evening' && !h.isArchived)

  return (
    <main className={styles.screen}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.title}>Sparkle ✨</h1>
        <div className={styles.headerRight}>
          <div
            className={styles.starCount}
            key={starBumpKey}
            aria-live="polite"
            aria-label={`${progress.totalStars} total stars`}
          >
            <span aria-hidden="true">⭐</span>
            <span className={styles.starNumber}>{progress.totalStars}</span>
          </div>
          <button
            className={styles.soundBtn}
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
        </div>
      </header>

      {/* ── Unicorn ─────────────────────────────────────────────────── */}
      <section className={styles.petSection}>
        <UnicornPet
          mood={mood}
          level={progress.unicornLevel}
          isAnimating={isUnicornAnimating}
        />
      </section>

      {/* ── Streak banner ───────────────────────────────────────────── */}
      {progress.currentStreak > 0 && (
        <div className={styles.streak} aria-label={`${progress.currentStreak} day streak`}>
          🔥 {progress.currentStreak} day streak!
        </div>
      )}

      {/* ── Morning habits ──────────────────────────────────────────── */}
      {morningHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>☀️ Morning</h2>
          <div className={styles.habitList}>
            {morningHabits.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                entry={entries.get(h.id)}
                onTap={onTapHabit}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── All-day habits ──────────────────────────────────────────── */}
      {alldayHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌈 All Day</h2>
          <div className={styles.habitList}>
            {alldayHabits.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                entry={entries.get(h.id)}
                onTap={onTapHabit}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Evening habits ──────────────────────────────────────────── */}
      {eveningHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌙 Evening</h2>
          <div className={styles.habitList}>
            {eveningHabits.map(h => (
              <HabitCard
                key={h.id}
                habit={h}
                entry={entries.get(h.id)}
                onTap={onTapHabit}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Show Parent button ──────────────────────────────────────── */}
      <div className={styles.parentButtonWrapper}>
        <button
          className={styles.parentButton}
          onClick={onShowParent}
          aria-label="Show this screen to Mama or Papa for approval"
        >
          👆 Show Mama / Papa
        </button>
      </div>
    </main>
  )
}
