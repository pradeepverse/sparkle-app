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

export type Screen = 'home' | 'parent-approval' | 'rewards' | 'parent-dashboard' | 'english'

// ─── English Time ─────────────────────────────────────────────────────────────

export interface EnglishWord {
  id: string        // unique across all lessons, e.g. 'happy'
  en: string        // 'happy'
  ta: string        // Tamil meaning in Tamil script
  emoji: string
  example: string   // short sentence using the word
}

export interface EnglishLesson {
  id: string
  title: string
  emoji: string
  words: EnglishWord[]
  talk: {
    question: string  // the unicorn asks this
    starter: string   // sentence frame with ___ for the blank
    example: string   // a full model answer
  }
  story: string[]     // 3–5 short sentences, read one at a time
}

/** Leitner-box state for one learned word. */
export interface WordState {
  box: number   // 1–5; higher = known better, reviewed less often
  due: string   // local date "2026-10-07" — next review day
}

export interface EnglishProgress {
  nextLesson: number        // index into ENGLISH_LESSONS (wraps around)
  lastLessonIndex: number   // lesson finished on lastLessonDate (-1 = none yet)
  lastLessonDate: string    // local date, '' = never
  words: Record<string, WordState>
}

export const DEFAULT_ENGLISH_PROGRESS: EnglishProgress = {
  nextLesson: 0,
  lastLessonIndex: -1,
  lastLessonDate: '',
  words: {},
}

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
