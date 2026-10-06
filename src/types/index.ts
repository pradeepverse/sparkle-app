// ─── Habit domain ────────────────────────────────────────────────────────────

export type HabitType = 'once-daily' | 'repeatable' | 'parent-only'
export type ApprovalStatus = 'none' | 'pending' | 'approved'
export type TimeOfDay = 'morning' | 'allday' | 'evening'

export interface Habit {
  id: string
  name: string
  emoji: string
  timeOfDay: TimeOfDay
  type: HabitType
  points: number
  maxPerDay?: number          // repeatable habits only (e.g. water = 5)
  requiresApproval?: boolean  // once-daily habits that need parent sign-off
  isArchived: boolean
}

// ─── Daily tracking ───────────────────────────────────────────────────────────

export interface DailyEntry {
  id: string               // `${habitId}_${dateString}`
  habitId: string
  dateString: string       // "2026-03-19"
  completionCount: number  // 1 for once-daily; 1–N for repeatable
  approvalStatus: ApprovalStatus
  starsEarned: number
  bonusStars: number       // lucky star bonus (Phase 2)
}

// ─── User progress ────────────────────────────────────────────────────────────

export interface UserProgress {
  totalStars: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string   // ISO date "2026-03-19"
  unicornLevel: number     // 1–4
  unicornName: string      // "Baby Sparkle" etc.
}

// ─── Rewards (Phase 3) ────────────────────────────────────────────────────────

export interface Reward {
  id: string
  name: string
  emoji: string
  thumbnail?: string   // base64 data URL, overrides emoji when present
  starCost: number
  isUnlocked: boolean
  unlockedAt?: number
}

// ─── Screen navigation ────────────────────────────────────────────────────────

export type Screen = 'home' | 'parent-approval' | 'rewards' | 'parent-dashboard'

// ─── Unicorn ─────────────────────────────────────────────────────────────────

export type UnicornMood = 'magical' | 'happy' | 'okay' | 'sleepy' | 'party'

export const UNICORN_LEVEL_NAMES: Record<number, string> = {
  1: 'Baby Sparkle',
  2: 'Sparkle',
  3: 'Super Sparkle',
  4: 'Rainbow Sparkle',
}

// ─── Star-to-currency ratio ───────────────────────────────────────────────────

export interface StarRupeeRatio {
  stars: number   // e.g. 25
  rupees: number  // e.g. 5  → meaning 25 stars = ₹5
}

export const DEFAULT_STAR_RUPEE_RATIO: StarRupeeRatio = { stars: 25, rupees: 5 }

export const DEFAULT_PROGRESS: UserProgress = {
  totalStars: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  unicornLevel: 1,
  unicornName: UNICORN_LEVEL_NAMES[1],
}

// Per-device preferences only — everything else lives in Supabase.
export const LOCAL_STORAGE_KEYS = {
  SOUND_ENABLED: 'sparkle_sound',
} as const
