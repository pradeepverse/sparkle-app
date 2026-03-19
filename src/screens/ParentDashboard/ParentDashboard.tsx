import { useEffect, useState } from 'react'
import type { Habit, DailyEntry, UserProgress } from '../../types'
import { getStarsPerDay } from '../../storage/indexedDB'
import styles from './ParentDashboard.module.css'

interface ParentDashboardProps {
  progress: UserProgress
  entries: Map<string, DailyEntry>
  habits: Habit[]
  onResetDay: () => Promise<void>
}

export function ParentDashboard({ progress, entries, habits, onResetDay }: ParentDashboardProps) {
  const [weekData, setWeekData] = useState<{ date: string; stars: number }[]>([])
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    getStarsPerDay(7).then(setWeekData).catch(console.error)
  }, [])

  const starsToday = Array.from(entries.values()).reduce(
    (sum, e) => sum + e.starsEarned + e.bonusStars, 0
  )
  const habitsCompletedToday = Array.from(entries.values()).filter(
    e => e.approvalStatus === 'approved' || e.completionCount > 0
  ).length
  const totalHabits = habits.filter(h => !h.isArchived).length

  const maxWeekStars = Math.max(...weekData.map(d => d.stars), 1)

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={styles.dashboard}>
      {/* ── Streak cards ──────────────────────────────────── */}
      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statEmoji}>🔥</div>
          <div className={styles.statValue}>{progress.currentStreak}</div>
          <div className={styles.statLabel}>Day streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statEmoji}>🏆</div>
          <div className={styles.statValue}>{progress.longestStreak}</div>
          <div className={styles.statLabel}>Best streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statEmoji}>⭐</div>
          <div className={styles.statValue}>{progress.totalStars}</div>
          <div className={styles.statLabel}>Total stars</div>
        </div>
      </div>

      {/* ── Today snapshot ────────────────────────────────── */}
      <div className={styles.todayCard}>
        <div className={styles.todayTitle}>Today</div>
        <div className={styles.todayRow}>
          <span className={styles.todayStars}>⭐ {starsToday} stars earned</span>
          <span className={styles.todayHabits}>{habitsCompletedToday}/{totalHabits} habits</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, (habitsCompletedToday / Math.max(totalHabits, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* ── Reset today ───────────────────────────────────── */}
      {starsToday > 0 && (
        <div className={styles.resetSection}>
          {!confirmReset ? (
            <button className={styles.resetBtn} onClick={() => setConfirmReset(true)}>
              🔄 Undo today's progress
            </button>
          ) : (
            <div className={styles.resetConfirm}>
              <div className={styles.resetWarning}>
                This will remove all {starsToday} ⭐ earned today. Are you sure?
              </div>
              <div className={styles.resetBtns}>
                <button
                  className={styles.resetConfirmYes}
                  onClick={async () => { await onResetDay(); setConfirmReset(false) }}
                >
                  Yes, reset
                </button>
                <button className={styles.resetConfirmNo} onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Weekly bar chart ──────────────────────────────── */}
      {weekData.length > 0 && (
        <div className={styles.weekCard}>
          <div className={styles.weekTitle}>This week ⭐</div>
          <div className={styles.bars}>
            {weekData.map(({ date, stars }) => {
              const dayIndex = new Date(date + 'T12:00:00').getDay()
              const isToday = date === new Date().toISOString().slice(0, 10)
              const heightPct = (stars / maxWeekStars) * 100
              return (
                <div key={date} className={styles.barCol}>
                  <div className={styles.barWrap}>
                    <div
                      className={[styles.bar, isToday ? styles.barToday : ''].join(' ')}
                      style={{ height: `${Math.max(heightPct, stars > 0 ? 8 : 3)}%` }}
                      aria-label={`${stars} stars on ${date}`}
                    />
                  </div>
                  <div className={[styles.dayLabel, isToday ? styles.dayLabelToday : ''].join(' ')}>
                    {dayLabels[dayIndex]}
                  </div>
                  {stars > 0 && <div className={styles.starCount}>{stars}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
