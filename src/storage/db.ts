import { supabase } from './supabase'
import type { Habit, DailyEntry, Reward, UserProgress, StarRupeeRatio, EnglishProgress } from '../types'

// Every table has a `user_id` column defaulting to auth.uid() and RLS limiting
// each user to their own rows, so queries here never filter by user explicitly.

// ─── Row ↔ model mappers ──────────────────────────────────────────────────────

interface HabitRow {
  id: string
  name: string
  emoji: string
  time_of_day: Habit['timeOfDay']
  type: Habit['type']
  points: number
  max_per_day: number | null
  requires_approval: boolean | null
  is_archived: boolean
}

interface EntryRow {
  id: string
  habit_id: string
  date_string: string
  completion_count: number
  approval_status: DailyEntry['approvalStatus']
  stars_earned: number
  bonus_stars: number
}

interface RewardRow {
  id: string
  name: string
  emoji: string
  thumbnail: string | null
  star_cost: number
  is_unlocked: boolean
  unlocked_at: number | null
}

interface SettingsRow {
  progress: UserProgress
  parent_pin: string | null
  star_rupee_ratio: StarRupeeRatio | null
  english_progress: EnglishProgress | null
}

const habitToRow = (h: Habit): HabitRow => ({
  id: h.id,
  name: h.name,
  emoji: h.emoji,
  time_of_day: h.timeOfDay,
  type: h.type,
  points: h.points,
  max_per_day: h.maxPerDay ?? null,
  requires_approval: h.requiresApproval ?? null,
  is_archived: h.isArchived,
})

const rowToHabit = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  timeOfDay: r.time_of_day,
  type: r.type,
  points: r.points,
  ...(r.max_per_day != null && { maxPerDay: r.max_per_day }),
  ...(r.requires_approval != null && { requiresApproval: r.requires_approval }),
  isArchived: r.is_archived,
})

const entryToRow = (e: DailyEntry): EntryRow => ({
  id: e.id,
  habit_id: e.habitId,
  date_string: e.dateString,
  completion_count: e.completionCount,
  approval_status: e.approvalStatus,
  stars_earned: e.starsEarned,
  bonus_stars: e.bonusStars,
})

const rowToEntry = (r: EntryRow): DailyEntry => ({
  id: r.id,
  habitId: r.habit_id,
  dateString: r.date_string,
  completionCount: r.completion_count,
  approvalStatus: r.approval_status,
  starsEarned: r.stars_earned,
  bonusStars: r.bonus_stars,
})

const rewardToRow = (r: Reward): RewardRow => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  thumbnail: r.thumbnail ?? null,
  star_cost: r.starCost,
  is_unlocked: r.isUnlocked,
  unlocked_at: r.unlockedAt ?? null,
})

const rowToReward = (r: RewardRow): Reward => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  ...(r.thumbnail != null && { thumbnail: r.thumbnail }),
  starCost: r.star_cost,
  isUnlocked: r.is_unlocked,
  ...(r.unlocked_at != null && { unlockedAt: r.unlocked_at }),
})

// ─── Initial load ─────────────────────────────────────────────────────────────

export interface UserData {
  progress: UserProgress
  parentPin: string | null
  starRupeeRatio: StarRupeeRatio | null
  habits: Habit[]
  rewards: Reward[]
}

/** Loads everything except daily entries. Returns null for a brand-new account. */
export async function loadUserData(): Promise<UserData | null> {
  const [settings, habits, rewards] = await Promise.all([
    supabase.from('user_settings').select('progress, parent_pin, star_rupee_ratio').maybeSingle<SettingsRow>(),
    supabase.from('habits').select('*').returns<HabitRow[]>(),
    supabase.from('rewards').select('*').returns<RewardRow[]>(),
  ])
  if (settings.error) throw settings.error
  if (habits.error) throw habits.error
  if (rewards.error) throw rewards.error
  if (!settings.data) return null

  return {
    progress: settings.data.progress,
    parentPin: settings.data.parent_pin,
    starRupeeRatio: settings.data.star_rupee_ratio,
    habits: habits.data.map(rowToHabit),
    rewards: rewards.data.map(rowToReward),
  }
}

/** First sign-in: write the default habits/rewards and the settings row. */
export async function seedNewUser(habits: Habit[], rewards: Reward[], progress: UserProgress): Promise<void> {
  await check(supabase.from('habits').upsert(habits.map(habitToRow), { onConflict: 'user_id,id', ignoreDuplicates: true }))
  await check(supabase.from('rewards').upsert(rewards.map(rewardToRow), { onConflict: 'user_id,id', ignoreDuplicates: true }))
  // Settings row last — its existence marks the account as seeded.
  await check(supabase.from('user_settings').upsert({ progress }, { onConflict: 'user_id', ignoreDuplicates: true }))
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function saveProgress(progress: UserProgress): Promise<void> {
  await saveSettings({ progress })
}

export async function saveParentPin(pin: string): Promise<void> {
  await saveSettings({ parent_pin: pin })
}

export async function saveStarRupeeRatio(ratio: StarRupeeRatio): Promise<void> {
  await saveSettings({ star_rupee_ratio: ratio })
}

export async function saveEnglishProgress(english: EnglishProgress): Promise<void> {
  await saveSettings({ english_progress: english })
}

/**
 * Loaded separately from loadUserData so the rest of the app still works if the
 * english_progress migration hasn't been applied yet.
 */
export async function getEnglishProgress(): Promise<EnglishProgress | null> {
  const { data, error } = await supabase
    .from('user_settings').select('english_progress').maybeSingle<Pick<SettingsRow, 'english_progress'>>()
  if (error) throw error
  return data?.english_progress ?? null
}

async function saveSettings(patch: Partial<SettingsRow>): Promise<void> {
  // The row always exists after seedNewUser, so a plain update is enough.
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')
  await check(
    supabase.from('user_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
  )
}

// ─── Habits & rewards ─────────────────────────────────────────────────────────

export async function saveHabit(habit: Habit): Promise<void> {
  await check(supabase.from('habits').upsert(habitToRow(habit), { onConflict: 'user_id,id' }))
}

export async function saveReward(reward: Reward): Promise<void> {
  await check(supabase.from('rewards').upsert(rewardToRow(reward), { onConflict: 'user_id,id' }))
}

export async function deleteReward(rewardId: string): Promise<void> {
  await check(supabase.from('rewards').delete().eq('id', rewardId))
}

// ─── Daily entries ────────────────────────────────────────────────────────────

export async function saveEntry(entry: DailyEntry): Promise<void> {
  await check(supabase.from('daily_entries').upsert(entryToRow(entry), { onConflict: 'user_id,id' }))
}

export async function getEntriesForDate(dateString: string): Promise<DailyEntry[]> {
  const { data, error } = await supabase
    .from('daily_entries').select('*').eq('date_string', dateString).returns<EntryRow[]>()
  if (error) throw error
  return data.map(rowToEntry)
}

export async function deleteEntriesForDate(dateString: string): Promise<void> {
  await check(supabase.from('daily_entries').delete().eq('date_string', dateString))
}

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Stars earned per day for the last N days (oldest first), zero-filled. */
export async function getStarsPerDay(days: number): Promise<{ date: string; stars: number }[]> {
  const today = new Date()
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(toLocalDateString(d))
  }

  const { data, error } = await supabase
    .from('daily_entries')
    .select('date_string, stars_earned, bonus_stars')
    .gte('date_string', dates[0])
    .lte('date_string', dates[dates.length - 1])
  if (error) throw error

  const totals = new Map<string, number>()
  for (const r of data) {
    totals.set(r.date_string, (totals.get(r.date_string) ?? 0) + r.stars_earned + r.bonus_stars)
  }
  return dates.map(date => ({ date, stars: totals.get(date) ?? 0 }))
}

// ─── Bulk (backup export / import) ────────────────────────────────────────────

export async function getAllEntries(): Promise<DailyEntry[]> {
  // Paginate — PostgREST caps responses (1000 rows by default).
  const PAGE = 1000
  const all: DailyEntry[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('daily_entries').select('*').order('id').range(from, from + PAGE - 1).returns<EntryRow[]>()
    if (error) throw error
    all.push(...data.map(rowToEntry))
    if (data.length < PAGE) return all
  }
}

/** Replaces all of the user's habits, entries and rewards. */
export async function replaceAllData(habits: Habit[], entries: DailyEntry[], rewards: Reward[]): Promise<void> {
  // RLS scopes these deletes to the signed-in user; the filter just satisfies
  // PostgREST's "no unfiltered delete" guard.
  await check(supabase.from('habits').delete().neq('id', ''))
  await check(supabase.from('daily_entries').delete().neq('id', ''))
  await check(supabase.from('rewards').delete().neq('id', ''))

  if (habits.length)  await check(supabase.from('habits').insert(habits.map(habitToRow)))
  if (rewards.length) await check(supabase.from('rewards').insert(rewards.map(rewardToRow)))
  for (let i = 0; i < entries.length; i += 500) {
    await check(supabase.from('daily_entries').insert(entries.slice(i, i + 500).map(entryToRow)))
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function check(req: PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await req
  if (error) throw error
}
