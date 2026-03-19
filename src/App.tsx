import { useState, useEffect, useCallback } from 'react'
import type { Screen, Habit, DailyEntry, UserProgress, Reward } from './types'
import { LOCAL_STORAGE_KEYS, IDB_STORES, UNICORN_LEVEL_NAMES } from './types'
import { lsGet, lsSet } from './storage/localStorage'
import { idbGet, idbGetAll, idbPut, idbDelete, getEntriesForDate, deleteEntriesForDate } from './storage/indexedDB'
import { DEFAULT_HABITS, PARENT_APPROVE_HABIT_IDS } from './data/habits'
import { ConfigureScreen } from './screens/ConfigureScreen/ConfigureScreen'
import { DEFAULT_REWARDS } from './data/rewards'
import { HomeScreen } from './screens/HomeScreen/HomeScreen'
import { ParentApprovalScreen } from './screens/ParentApprovalScreen/ParentApprovalScreen'
import { ParentDashboard } from './screens/ParentDashboard/ParentDashboard'
import { RewardsScreen } from './screens/RewardsScreen/RewardsScreen'
import { PinGate } from './components/PinGate/PinGate'
import { StarBurst } from './components/StarBurst/StarBurst'
import styles from './App.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PROGRESS: UserProgress = {
  totalStars: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  unicornLevel: 1,
  unicornName: UNICORN_LEVEL_NAMES[1],
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function makeEntryId(habitId: string, date: string) {
  return `${habitId}_${date}`
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]   = useState<Screen>('home')
  const [habits, setHabits]   = useState<Habit[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [entries, setEntries] = useState<Map<string, DailyEntry>>(new Map())
  const [progress, setProgress] = useState<UserProgress>(
    () => lsGet<UserProgress>(LOCAL_STORAGE_KEYS.USER_PROGRESS) ?? DEFAULT_PROGRESS
  )
  const [isUnicornAnimating, setIsUnicornAnimating] = useState(false)
  const [starBurstTrigger,   setStarBurstTrigger]   = useState(0)
  const [starBurstBonus,     setStarBurstBonus]      = useState(0)
  const [starBumpKey,        setStarBumpKey]         = useState(0)

  // Parent section
  const [pinUnlocked,  setPinUnlocked]  = useState(false)
  const [parentTab,    setParentTab]    = useState<'approval' | 'dashboard' | 'configure'>('approval')
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null)

  // ── Seed habits + rewards into IndexedDB ──────────────────────────────────
  useEffect(() => {
    async function seedAndLoad() {
      // Seed default habits only if they don't exist yet (preserves parent edits).
      // Also migrate requiresApproval onto old records that predate this field.
      for (const habit of DEFAULT_HABITS) {
        const existing = await idbGet(IDB_STORES.HABITS, habit.id)
        if (!existing) {
          await idbPut(IDB_STORES.HABITS, habit)
        } else if (habit.requiresApproval && existing.requiresApproval === undefined) {
          await idbPut(IDB_STORES.HABITS, { ...existing, requiresApproval: habit.requiresApproval })
        }
      }
      const allHabits = await idbGetAll(IDB_STORES.HABITS) as Habit[]
      setHabits(allHabits)

      // Seed default rewards only if they don't exist yet (preserves isUnlocked state)
      for (const reward of DEFAULT_REWARDS) {
        const existing = await idbGet(IDB_STORES.REWARDS, reward.id)
        if (!existing) await idbPut(IDB_STORES.REWARDS, reward)
      }
      const allRewards = await idbGetAll(IDB_STORES.REWARDS) as Reward[]
      setRewards(allRewards)
    }
    seedAndLoad().catch(console.error)
  }, [])

  // ── Load today's entries from IndexedDB ───────────────────────────────────
  useEffect(() => {
    const today = getTodayString()
    getEntriesForDate(today)
      .then(todayEntries => {
        const map = new Map<string, DailyEntry>()
        for (const entry of todayEntries) {
          map.set(entry.habitId, entry)
        }
        setEntries(map)
      })
      .catch(console.error)
  }, [])

  // ── Daily reset: clear in-memory entries if it's a new day ───────────────
  useEffect(() => {
    const today = getTodayString()
    if (progress.lastActiveDate && progress.lastActiveDate !== today) {
      setEntries(new Map())
    }
  }, [progress.lastActiveDate])

  // ── Persist progress to localStorage whenever it changes ─────────────────
  useEffect(() => {
    lsSet(LOCAL_STORAGE_KEYS.USER_PROGRESS, progress)
  }, [progress])

  // ── Lock parent section when navigating away ──────────────────────────────
  useEffect(() => {
    if (screen !== 'parent-approval') {
      setPinUnlocked(false)
      setParentTab('approval')
    }
  }, [screen])

  // ── Handle habit tap (child) ──────────────────────────────────────────────
  const handleTapHabit = useCallback(async (habitId: string) => {
    const today = getTodayString()
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const existing = entries.get(habitId)
    if (habit.type === 'once-daily' && existing && existing.completionCount >= 1) return
    if (habit.type === 'repeatable' && habit.maxPerDay !== undefined) {
      if (existing && existing.completionCount >= habit.maxPerDay) return
    }

    const needsApproval = habit.requiresApproval ?? PARENT_APPROVE_HABIT_IDS.has(habitId)
    const newCount = (existing?.completionCount ?? 0) + 1

    const updated: DailyEntry = {
      id: makeEntryId(habitId, today),
      habitId,
      dateString: today,
      completionCount: newCount,
      approvalStatus: needsApproval ? 'pending' : 'none',
      starsEarned: needsApproval ? (existing?.starsEarned ?? 0) : (existing?.starsEarned ?? 0) + habit.points,
      bonusStars: existing?.bonusStars ?? 0,
    }

    await idbPut(IDB_STORES.DAILY_ENTRIES, updated)
    setEntries(prev => new Map(prev).set(habitId, updated))

    if (!needsApproval) {
      triggerCelebration(habit.points, 0, today)
    }
  }, [habits, entries])

  // ── Handle parent approval ─────────────────────────────────────────────────
  const handleApproveHabit = useCallback(async (habitId: string) => {
    const today = getTodayString()
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const existing = entries.get(habitId)
    if (!existing || existing.approvalStatus !== 'pending') return

    // Lucky star: 25% chance of +1 to +3 bonus stars
    const bonus = Math.random() < 0.25 ? Math.ceil(Math.random() * 3) : 0

    const updated: DailyEntry = {
      ...existing,
      approvalStatus: 'approved',
      starsEarned: habit.points,
      bonusStars: existing.bonusStars + bonus,
    }

    await idbPut(IDB_STORES.DAILY_ENTRIES, updated)
    setEntries(prev => new Map(prev).set(habitId, updated))
    triggerCelebration(habit.points, bonus, today)
  }, [habits, entries])

  // ── Handle parent direct award (parent-only habits) ───────────────────────
  const handleAwardDirectHabit = useCallback(async (habitId: string) => {
    const today = getTodayString()
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const existing = entries.get(habitId)
    if (existing?.approvalStatus === 'approved') return

    const entry: DailyEntry = {
      id: makeEntryId(habitId, today),
      habitId,
      dateString: today,
      completionCount: 1,
      approvalStatus: 'approved',
      starsEarned: habit.points,
      bonusStars: 0,
    }

    await idbPut(IDB_STORES.DAILY_ENTRIES, entry)
    setEntries(prev => new Map(prev).set(habitId, entry))
    triggerCelebration(habit.points, 0, today)
  }, [habits, entries])

  // ── Configure: save / delete habits and rewards ───────────────────────────
  const handleSaveHabit = useCallback(async (habit: Habit) => {
    await idbPut(IDB_STORES.HABITS, habit)
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === habit.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = habit; return next }
      return [...prev, habit]
    })
  }, [])

  const handleSaveReward = useCallback(async (reward: Reward) => {
    await idbPut(IDB_STORES.REWARDS, reward)
    setRewards(prev => {
      const idx = prev.findIndex(r => r.id === reward.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = reward; return next }
      return [...prev, reward]
    })
  }, [])

  const handleDeleteReward = useCallback(async (rewardId: string) => {
    await idbDelete(IDB_STORES.REWARDS, rewardId)
    setRewards(prev => prev.filter(r => r.id !== rewardId))
  }, [])

  // ── Reset today's progress ────────────────────────────────────────────────
  const handleResetDay = useCallback(async () => {
    const today = getTodayString()
    const starsToday = Array.from(entries.values()).reduce(
      (sum, e) => sum + e.starsEarned + e.bonusStars, 0
    )
    await deleteEntriesForDate(today)
    setEntries(new Map())
    setProgress(prev => {
      const wasActiveToday = prev.lastActiveDate === today
      return {
        ...prev,
        totalStars: Math.max(0, prev.totalStars - starsToday),
        currentStreak: wasActiveToday ? Math.max(0, prev.currentStreak - 1) : prev.currentStreak,
        lastActiveDate: wasActiveToday ? '' : prev.lastActiveDate,
      }
    })
  }, [entries])

  // ── Handle reward redemption ──────────────────────────────────────────────
  const handleRedeemReward = useCallback(async (reward: Reward) => {
    if (progress.totalStars < reward.starCost) return
    const updated = { ...reward, isUnlocked: true }
    await idbPut(IDB_STORES.REWARDS, updated)
    setRewards(prev => prev.map(r => r.id === reward.id ? updated : r))
    setProgress(prev => ({ ...prev, totalStars: prev.totalStars - reward.starCost }))
    triggerCelebration(0, 0, getTodayString())
    setRedeemTarget(null)
  }, [progress.totalStars])

  // ── Shared celebration ────────────────────────────────────────────────────
  const triggerCelebration = useCallback((starsEarned: number, bonus: number, today: string) => {
    setIsUnicornAnimating(true)
    setTimeout(() => setIsUnicornAnimating(false), 900)
    setStarBurstBonus(bonus)
    setStarBurstTrigger(prev => prev + 1)
    setStarBumpKey(prev => prev + 1)

    if (starsEarned + bonus === 0) return
    setProgress(prev => {
      const isNewDay = prev.lastActiveDate !== today
      const newStreak = isNewDay ? prev.currentStreak + 1 : prev.currentStreak
      const newTotal = prev.totalStars + starsEarned + bonus
      const newLevel = computeLevel(newTotal)
      return {
        ...prev,
        totalStars: newTotal,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastActiveDate: today,
        unicornLevel: newLevel,
        unicornName: UNICORN_LEVEL_NAMES[newLevel],
      }
    })
  }, [])

  // ── Screen switch ─────────────────────────────────────────────────────────
  function renderScreen() {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            habits={habits}
            entries={entries}
            progress={progress}
            isUnicornAnimating={isUnicornAnimating}
            starBumpKey={starBumpKey}
            onTapHabit={handleTapHabit}
            onShowParent={() => setScreen('parent-approval')}
          />
        )

      case 'parent-approval':
        if (!pinUnlocked) {
          return (
            <PinGate
              onUnlock={() => setPinUnlocked(true)}
              onBack={() => setScreen('home')}
            />
          )
        }
        return (
          <div className={styles.parentSection}>
            {/* Tab bar */}
            <div className={styles.tabBar}>
              <button
                className={[styles.tab, parentTab === 'approval' ? styles.tabActive : ''].join(' ')}
                onClick={() => setParentTab('approval')}
              >
                ✅ Approvals
              </button>
              <button
                className={[styles.tab, parentTab === 'dashboard' ? styles.tabActive : ''].join(' ')}
                onClick={() => setParentTab('dashboard')}
              >
                📊 Dashboard
              </button>
              <button
                className={[styles.tab, parentTab === 'configure' ? styles.tabActive : ''].join(' ')}
                onClick={() => setParentTab('configure')}
              >
                ⚙️ Config
              </button>
            </div>

            {parentTab === 'configure' ? (
              <div className={styles.dashboardWrapper}>
                <button className={styles.dashBackBtn} onClick={() => setScreen('home')}>← Home</button>
                <h1 className={styles.dashTitle}>⚙️ Configure</h1>
                <ConfigureScreen
                  habits={habits}
                  rewards={rewards}
                  onSaveHabit={handleSaveHabit}
                  onSaveReward={handleSaveReward}
                  onDeleteReward={handleDeleteReward}
                />
              </div>
            ) : parentTab === 'approval' ? (
              <ParentApprovalScreen
                habits={habits}
                entries={entries}
                onApprove={handleApproveHabit}
                onAwardDirect={handleAwardDirectHabit}
                onBack={() => setScreen('home')}
              />
            ) : (
              <div className={styles.dashboardWrapper}>
                <button className={styles.dashBackBtn} onClick={() => setScreen('home')}>← Home</button>
                <h1 className={styles.dashTitle}>📊 Dashboard</h1>
                <ParentDashboard
                  progress={progress}
                  entries={entries}
                  habits={habits}
                  onResetDay={handleResetDay}
                />
              </div>
            )}
          </div>
        )

      case 'rewards':
        return (
          <RewardsScreen
            rewards={rewards}
            totalStars={progress.totalStars}
            redeemTarget={redeemTarget}
            onRequestRedeem={setRedeemTarget}
            onConfirmRedeem={handleRedeemReward}
            onCancelRedeem={() => setRedeemTarget(null)}
            onBack={() => setScreen('home')}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={styles.app}>
      {renderScreen()}

      {/* Global star burst overlay */}
      <StarBurst trigger={starBurstTrigger} bonusStars={starBurstBonus} />

      {/* Bottom navigation */}
      {screen !== 'parent-approval' || !pinUnlocked ? (
        <nav className={styles.nav} aria-label="App navigation">
          <button
            className={screen === 'home' ? styles.navActive : ''}
            onClick={() => setScreen('home')}
            aria-current={screen === 'home' ? 'page' : undefined}
            aria-label="Home"
          >
            🏠
          </button>
          <button
            className={screen === 'parent-approval' ? styles.navActive : ''}
            onClick={() => setScreen('parent-approval')}
            aria-label="Parent section"
          >
            👩‍👧
          </button>
          <button
            className={screen === 'rewards' ? styles.navActive : ''}
            onClick={() => setScreen('rewards')}
            aria-label="Reward shop"
          >
            🎁
          </button>
        </nav>
      ) : null}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeLevel(totalStars: number): number {
  if (totalStars >= 500) return 4
  if (totalStars >= 200) return 3
  if (totalStars >= 75)  return 2
  return 1
}
