import type { Habit, DailyEntry } from '../../types'
import { PARENT_APPROVE_HABIT_IDS } from '../../data/habits'
import styles from './ParentApprovalScreen.module.css'

interface ParentApprovalScreenProps {
  habits: Habit[]
  entries: Map<string, DailyEntry>
  onApprove: (habitId: string) => void
  onAwardDirect: (habitId: string) => void
  onBack: () => void
}

export function ParentApprovalScreen({
  habits,
  entries,
  onApprove,
  onAwardDirect,
  onBack,
}: ParentApprovalScreenProps) {
  const pendingHabits = habits.filter(h =>
    PARENT_APPROVE_HABIT_IDS.has(h.id) && entries.get(h.id)?.approvalStatus === 'pending'
  )
  const parentOnlyHabits = habits.filter(h => h.type === 'parent-only')
  const approvedHabits = habits.filter(h => {
    const e = entries.get(h.id)
    return e?.approvalStatus === 'approved'
  })

  const nothingToDo = pendingHabits.length === 0 && parentOnlyHabits.every(h => entries.get(h.id)?.approvalStatus === 'approved')

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Back to home">
          ← Home
        </button>
        <h1 className={styles.title}>Parent Approvals ✅</h1>
      </header>

      {/* ── Pending approval ────────────────────────────────── */}
      {pendingHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⏳ Waiting for you</h2>
          <div className={styles.list}>
            {pendingHabits.map(h => (
              <div key={h.id} className={styles.card}>
                <span className={styles.emoji}>{h.emoji}</span>
                <div className={styles.info}>
                  <span className={styles.name}>{h.name}</span>
                  <span className={styles.points}>+{h.points} ⭐</span>
                </div>
                <button
                  className={styles.approveBtn}
                  onClick={() => onApprove(h.id)}
                  aria-label={`Approve ${h.name}`}
                >
                  ✅ Approve!
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Parent-only awards ──────────────────────────────── */}
      {parentOnlyHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🌟 Award directly</h2>
          <div className={styles.list}>
            {parentOnlyHabits.map(h => {
              const awarded = entries.get(h.id)?.approvalStatus === 'approved'
              return (
                <div key={h.id} className={[styles.card, awarded ? styles.cardDone : ''].join(' ')}>
                  <span className={styles.emoji}>{h.emoji}</span>
                  <div className={styles.info}>
                    <span className={styles.name}>{h.name}</span>
                    <span className={styles.points}>+{h.points} ⭐</span>
                  </div>
                  {awarded ? (
                    <div className={styles.badge}>✅ Awarded!</div>
                  ) : (
                    <button
                      className={styles.awardBtn}
                      onClick={() => onAwardDirect(h.id)}
                      aria-label={`Award ${h.name}`}
                    >
                      🌟 Award
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── All clear ───────────────────────────────────────── */}
      {nothingToDo && pendingHabits.length === 0 && (
        <div className={styles.allClear}>
          <div className={styles.allClearEmoji}>🦄</div>
          <div className={styles.allClearText}>All caught up!</div>
          <div className={styles.allClearSub}>Nothing waiting for approval right now.</div>
        </div>
      )}

      {/* ── Already approved today ──────────────────────────── */}
      {approvedHabits.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✅ Done today</h2>
          <div className={styles.doneList}>
            {approvedHabits.map(h => (
              <div key={h.id} className={styles.doneRow}>
                <span>{h.emoji}</span>
                <span className={styles.doneName}>{h.name}</span>
                <span className={styles.doneStars}>+{entries.get(h.id)!.starsEarned + entries.get(h.id)!.bonusStars} ⭐</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
