import { useState, useEffect, useCallback, useRef } from 'react'
import type { Screen, Habit, DailyEntry, UserProgress, Reward, StarRupeeRatio, EnglishLesson, EnglishProgress } from './types'
import { LOCAL_STORAGE_KEYS, UNICORN_LEVEL_NAMES, DEFAULT_STAR_RUPEE_RATIO, DEFAULT_ENGLISH_PROGRESS } from './types'
import { lsGet, lsSet } from './storage/localStorage'
import { playPendingTap, playStarsEarned, playLuckyStar, playRewardRedeemed } from './utils/sounds'
import {
  saveHabit, saveReward, deleteReward, saveEntry, getEntriesForDate, deleteEntriesForDate,
  saveProgress, saveParentPin, saveStarRupeeRatio, getEnglishProgress, saveEnglishProgress, type UserData,
} from './storage/db'
import { PARENT_APPROVE_HABIT_IDS, ENGLISH_HABIT, ENGLISH_HABIT_ID } from './data/habits'
import { completeLesson, isLessonDoneToday } from './utils/wordReview'
import { ConfigureScreen } from './screens/ConfigureScreen/ConfigureScreen'
import { HomeScreen } from './screens/HomeScreen/HomeScreen'
import { ParentApprovalScreen } from './screens/ParentApprovalScreen/ParentApprovalScreen'
import { ParentDashboard } from './screens/ParentDashboard/ParentDashboard'
import { RewardsScreen } from './screens/RewardsScreen/RewardsScreen'
import { EnglishScreen } from './screens/EnglishScreen/EnglishScreen'
import { PinGate } from './components/PinGate/PinGate'
import { StarBurst } from './components/StarBurst/StarBurst'
import styles from './App.module.css'

// ─── Hash-based navigation helpers ───────────────────────────────────────────

function getHashForScreen(s: Screen): string {
  if (s === 'rewards') return '#rewards'
  if (s === 'parent-approval') return '#parent'
  if (s === 'english') return '#english'
  return '#'
}

function getScreenFromHash(): Screen {
  const hash = window.location.hash.slice(1)
  if (hash === 'rewards') return 'rewards'
  if (hash === 'parent') return 'parent-approval'
  if (hash === 'english') return 'english'
  return 'home'
}

function toDateString(d: Date): string {
  // Use local calendar date, not UTC — so the day resets at local midnight
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getTodayString(): string {
  return toDateString(new Date())
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toDateString(d)
}

function makeEntryId(habitId: string, date: string) {
  return `${habitId}_${date}`
}

// ─── App ──────────────────────────────────────────────────────────────────────

interface AppProps {
  initialData: UserData
  userEmail: string
  onSignOut: () => void
}

export default function App({ initialData, userEmail, onSignOut }: AppProps) {
  const [screen, setScreen]   = useState<Screen>(() => getScreenFromHash())
  const [habits, setHabits]   = useState<Habit[]>(initialData.habits)
  const [rewards, setRewards] = useState<Reward[]>(initialData.rewards)
  const [entries, setEntries] = useState<Map<string, DailyEntry>>(new Map())
  const [progress, setProgress] = useState<UserProgress>(initialData.progress)
  const [parentPin, setParentPin] = useState<string | null>(initialData.parentPin)
  const [isUnicornAnimating, setIsUnicornAnimating] = useState(false)
  const [starBurstTrigger,   setStarBurstTrigger]   = useState(0)
  const [starBurstBonus,     setStarBurstBonus]      = useState(0)
  const [starBumpKey,        setStarBumpKey]         = useState(0)

  // Parent section
  // Tracks the current calendar date — updates every 30s to detect midnight rollover
  const [currentDate, setCurrentDate] = useState(() => getTodayString())

  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    () => lsGet<boolean>(LOCAL_STORAGE_KEYS.SOUND_ENABLED) ?? true
  )
  const [pinUnlocked,  setPinUnlocked]  = useState(false)
  const [parentTab,    setParentTab]    = useState<'approval' | 'dashboard' | 'configure'>('approval')
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null)
  const [starRupeeRatio, setStarRupeeRatio] = useState<StarRupeeRatio>(
    initialData.starRupeeRatio ?? DEFAULT_STAR_RUPEE_RATIO
  )

  // null until loaded from Supabase
  const [englishProgress, setEnglishProgress] = useState<EnglishProgress | null>(null)
  const [englishError, setEnglishError] = useState(false)

  // Re-fetched each time the English screen opens, so a lesson finished on
  // another device that day is picked up.
  useEffect(() => {
    if (screen !== 'english') return
    getEnglishProgress()
      .then(p => {
        setEnglishProgress(p ?? DEFAULT_ENGLISH_PROGRESS)
        setEnglishError(false)
      })
      .catch(err => {
        console.error(err)
        setEnglishError(true)
      })
  }, [screen])

  function handleRatioChange(ratio: StarRupeeRatio) {
    setStarRupeeRatio(ratio)
    saveStarRupeeRatio(ratio).catch(console.error)
  }

  const handleSetPin = useCallback(async (pin: string) => {
    await saveParentPin(pin)
    setParentPin(pin)
  }, [])

  // ── Browser history: sync screen state with URL hash ─────────────────────
  // Stamp the initial history entry so the very first back-press works.
  useEffect(() => {
    history.replaceState({ screen }, '', getHashForScreen(screen))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listen for browser back / forward buttons.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      setScreen((e.state?.screen as Screen) ?? getScreenFromHash())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // ── Midnight rollover detector ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(getTodayString()), 30_000)
    return () => clearInterval(interval)
  }, [])

  // ── Load today's entries — re-runs whenever the calendar date changes ─────
  // This handles both initial load and midnight rollovers (app open overnight).
  useEffect(() => {
    getEntriesForDate(currentDate)
      .then(todayEntries => {
        const map = new Map<string, DailyEntry>()
        for (const entry of todayEntries) map.set(entry.habitId, entry)
        setEntries(map)
      })
      .catch(console.error)
  }, [currentDate])

  // ── Persist progress whenever it changes (skip the value we just loaded) ──
  const loadedProgress = useRef(initialData.progress)
  useEffect(() => {
    if (progress === loadedProgress.current) return
    saveProgress(progress).catch(console.error)
  }, [progress])

  // ── Lock parent section when navigating away ──────────────────────────────
  useEffect(() => {
    if (screen !== 'parent-approval') {
      setPinUnlocked(false)
      setParentTab('approval')
    }
  }, [screen])

  // ── Handle habit tap (child) ──────────────────────────────────────────────
  const recordHabitTap = useCallback(async (habit: Habit) => {
    const today = getTodayString()
    const habitId = habit.id

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

    await saveEntry(updated)
    setEntries(prev => new Map(prev).set(habitId, updated))

    if (needsApproval) {
      if (soundEnabled) playPendingTap()
    } else {
      triggerCelebration(habit.points, 0, today)
    }
  }, [entries, soundEnabled])

  const handleTapHabit = useCallback(async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (habit) await recordHabitTap(habit)
  }, [habits, recordHabitTap])

  // ── English Time: lesson finished ─────────────────────────────────────────
  const handleEnglishFinish = useCallback(async (lesson: EnglishLesson, reviewResults: Record<string, boolean>) => {
    const today = getTodayString()
    // Read the latest saved state so another device's progress isn't overwritten.
    const latest = (await getEnglishProgress()) ?? DEFAULT_ENGLISH_PROGRESS
    // Already recorded today (e.g. a retry after the habit write failed, or the
    // parent reset the day): don't re-apply review results or advance again.
    if (isLessonDoneToday(latest, today)) {
      setEnglishProgress(latest)
    } else {
      const next = completeLesson(latest, lesson, reviewResults, today)
      await saveEnglishProgress(next)
      setEnglishProgress(next)
    }

    // Accounts created before English Time existed don't have the habit yet.
    let habit = habits.find(h => h.id === ENGLISH_HABIT_ID)
    if (!habit) {
      habit = ENGLISH_HABIT
      await saveHabit(habit)
      setHabits(prev => [...prev, ENGLISH_HABIT])
    }
    if (!habit.isArchived) await recordHabitTap(habit)
  }, [habits, recordHabitTap])

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

    await saveEntry(updated)
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

    await saveEntry(entry)
    setEntries(prev => new Map(prev).set(habitId, entry))
    triggerCelebration(habit.points, 0, today)
  }, [habits, entries])

  // ── Configure: save / delete habits and rewards ───────────────────────────
  const handleSaveHabit = useCallback(async (habit: Habit) => {
    await saveHabit(habit)
    setHabits(prev => {
      const idx = prev.findIndex(h => h.id === habit.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = habit; return next }
      return [...prev, habit]
    })
  }, [])

  const handleSaveReward = useCallback(async (reward: Reward) => {
    await saveReward(reward)
    setRewards(prev => {
      const idx = prev.findIndex(r => r.id === reward.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = reward; return next }
      return [...prev, reward]
    })
  }, [])

  const handleDeleteReward = useCallback(async (rewardId: string) => {
    await deleteReward(rewardId)
    setRewards(prev => prev.filter(r => r.id !== rewardId))
  }, [])

  // ── Parent: manual star deduction ─────────────────────────────────────────
  const handleDeductStars = useCallback((amount: number) => {
    setProgress(prev => ({
      ...prev,
      totalStars: Math.max(0, prev.totalStars - amount),
    }))
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
    await saveReward(updated)
    setRewards(prev => prev.map(r => r.id === reward.id ? updated : r))
    setProgress(prev => ({ ...prev, totalStars: prev.totalStars - reward.starCost }))
    if (soundEnabled) playRewardRedeemed()
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
    if (soundEnabled) {
      if (bonus > 0) playLuckyStar()
      else playStarsEarned()
    }

    if (starsEarned + bonus === 0) return
    setProgress(prev => {
      const isNewDay      = prev.lastActiveDate !== today
      const wasYesterday  = prev.lastActiveDate === getYesterdayString()
      const newStreak     = isNewDay
        ? (wasYesterday ? prev.currentStreak + 1 : 1)  // reset to 1 if gap > 1 day
        : prev.currentStreak
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
  }, [soundEnabled])

  // ── Sound toggle ──────────────────────────────────────────────────────────
  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev
      lsSet(LOCAL_STORAGE_KEYS.SOUND_ENABLED, next)
      return next
    })
  }, [])

  // ── Navigate: push a history entry + update React state ──────────────────
  const navigateTo = useCallback((s: Screen) => {
    history.pushState({ screen: s }, '', getHashForScreen(s))
    setScreen(s)
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
            soundEnabled={soundEnabled}
            onTapHabit={handleTapHabit}
            onToggleSound={handleToggleSound}
            onShowParent={() => navigateTo('parent-approval')}
            onOpenEnglish={() => navigateTo('english')}
          />
        )

      case 'english':
        return (
          <EnglishScreen
            progress={englishProgress}
            loadError={englishError}
            entry={entries.get(ENGLISH_HABIT_ID)}
            onFinish={handleEnglishFinish}
            onBack={() => navigateTo('home')}
          />
        )

      case 'parent-approval':
        if (!pinUnlocked) {
          return (
            <PinGate
              savedPin={parentPin}
              onSetPin={handleSetPin}
              onUnlock={() => setPinUnlocked(true)}
              onBack={() => navigateTo('home')}
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
                <button className={styles.dashBackBtn} onClick={() => navigateTo('home')}>← Home</button>
                <h1 className={styles.dashTitle}>⚙️ Configure</h1>
                <ConfigureScreen
                  habits={habits}
                  rewards={rewards}
                  onSaveHabit={handleSaveHabit}
                  onSaveReward={handleSaveReward}
                  onDeleteReward={handleDeleteReward}
                  ratio={starRupeeRatio}
                  onRatioChange={handleRatioChange}
                  onChangePin={handleSetPin}
                  userEmail={userEmail}
                  onSignOut={onSignOut}
                />
              </div>
            ) : parentTab === 'approval' ? (
              <ParentApprovalScreen
                habits={habits}
                entries={entries}
                onApprove={handleApproveHabit}
                onAwardDirect={handleAwardDirectHabit}
                onDeductStars={handleDeductStars}
                onBack={() => navigateTo('home')}
              />
            ) : (
              <div className={styles.dashboardWrapper}>
                <button className={styles.dashBackBtn} onClick={() => navigateTo('home')}>← Home</button>
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
            onBack={() => navigateTo('home')}
            ratio={starRupeeRatio}
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
            onClick={() => navigateTo('home')}
            aria-current={screen === 'home' ? 'page' : undefined}
            aria-label="Home"
          >
            🏠
          </button>
          <button
            className={screen === 'parent-approval' ? styles.navActive : ''}
            onClick={() => navigateTo('parent-approval')}
            aria-label="Parent section"
          >
            👩‍👧
          </button>
          <button
            className={screen === 'rewards' ? styles.navActive : ''}
            onClick={() => navigateTo('rewards')}
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
