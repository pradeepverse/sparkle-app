import type { EnglishLesson, EnglishProgress, EnglishWord } from '../types'
import { ENGLISH_LESSONS } from '../data/englishLessons'

// Leitner-box spaced repetition: a word the child remembers moves up a box and
// comes back less often; a word she needs help with drops to box 1.
// Days until the next review, indexed by box (1–5).
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14]
const MAX_BOX = 5
export const MAX_REVIEW_WORDS = 6

const ALL_WORDS = new Map<string, EnglishWord>(
  ENGLISH_LESSONS.flatMap(l => l.words).map(w => [w.id, w])
)

export function getWord(id: string): EnglishWord | undefined {
  return ALL_WORDS.get(id)
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function isLessonDoneToday(p: EnglishProgress, today: string): boolean {
  return p.lastLessonDate === today && p.lastLessonIndex >= 0
}

/** Today's lesson: the one already finished today, else the next one. */
export function getTodaysLesson(p: EnglishProgress, today: string): EnglishLesson {
  const idx = isLessonDoneToday(p, today) ? p.lastLessonIndex : p.nextLesson
  return ENGLISH_LESSONS[idx % ENGLISH_LESSONS.length]
}

/** Learned words due for review today, most overdue / weakest first. */
export function getDueWords(p: EnglishProgress, today: string, excludeIds: Set<string>): EnglishWord[] {
  return Object.entries(p.words)
    .filter(([id, s]) => s.due <= today && !excludeIds.has(id) && ALL_WORDS.has(id))
    .sort(([, a], [, b]) => a.due.localeCompare(b.due) || a.box - b.box)
    .slice(0, MAX_REVIEW_WORDS)
    .map(([id]) => ALL_WORDS.get(id)!)
}

/**
 * Applies a finished session: review results move words between boxes, the
 * lesson's new words enter box 1, and the lesson pointer advances.
 * `reviewResults` maps word id → true (remembered) / false (needed help).
 */
export function completeLesson(
  p: EnglishProgress,
  lesson: EnglishLesson,
  reviewResults: Record<string, boolean>,
  today: string,
): EnglishProgress {
  const words = { ...p.words }

  for (const [id, remembered] of Object.entries(reviewResults)) {
    const prev = words[id]
    if (!prev) continue
    const box = remembered ? Math.min(prev.box + 1, MAX_BOX) : 1
    words[id] = { box, due: addDays(today, BOX_INTERVAL_DAYS[box]) }
  }

  // New words start in box 1 (review tomorrow). On a repeat lap through the
  // lessons a word she already knows keeps its box.
  for (const w of lesson.words) {
    if (!words[w.id]) words[w.id] = { box: 1, due: addDays(today, BOX_INTERVAL_DAYS[1]) }
  }

  const lessonIndex = ENGLISH_LESSONS.findIndex(l => l.id === lesson.id)
  return {
    nextLesson: (lessonIndex + 1) % ENGLISH_LESSONS.length,
    lastLessonIndex: lessonIndex,
    lastLessonDate: today,
    words,
  }
}

/** Learned words in the order she learned them — for the word garden. */
export function getLearnedWords(p: EnglishProgress): (EnglishWord & { box: number })[] {
  const out: (EnglishWord & { box: number })[] = []
  for (const lesson of ENGLISH_LESSONS) {
    for (const w of lesson.words) {
      const s = p.words[w.id]
      if (s) out.push({ ...w, box: s.box })
    }
  }
  return out
}
