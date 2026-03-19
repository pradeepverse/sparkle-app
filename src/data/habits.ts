import type { Habit } from '../types'

// Habits that need parent approval (Phase 2 wires up the approval flow)
export const PARENT_APPROVE_HABIT_IDS = new Set(['helped-home', 'reading'])

export const DEFAULT_HABITS: Habit[] = [
  // ☀️ Morning
  {
    id: 'brush-teeth',
    name: 'Brush my teeth',
    emoji: '🦷',
    timeOfDay: 'morning',
    type: 'once-daily',
    points: 5,
    isArchived: false,
  },
  {
    id: 'get-dressed',
    name: 'Get dressed by myself',
    emoji: '👗',
    timeOfDay: 'morning',
    type: 'once-daily',
    points: 5,
    isArchived: false,
  },
  {
    id: 'eat-breakfast',
    name: 'Eat breakfast nicely',
    emoji: '🥣',
    timeOfDay: 'morning',
    type: 'once-daily',
    points: 5,
    isArchived: false,
  },

  // 💧 All day
  {
    id: 'drink-water',
    name: 'Drink a glass of water',
    emoji: '💧',
    timeOfDay: 'allday',
    type: 'repeatable',
    points: 2,
    maxPerDay: 5,
    isArchived: false,
  },
  {
    id: 'potty',
    name: 'Used the potty myself',
    emoji: '🚽',
    timeOfDay: 'allday',
    type: 'repeatable',
    points: 3,
    maxPerDay: 3,
    isArchived: false,
  },
  {
    id: 'helped-home',
    name: 'Helped at home',
    emoji: '🏠',
    timeOfDay: 'allday',
    type: 'once-daily',
    points: 8,
    requiresApproval: true,
    isArchived: false,
  },
  {
    id: 'reading',
    name: 'Reading time',
    emoji: '📚',
    timeOfDay: 'allday',
    type: 'once-daily',
    points: 10,
    requiresApproval: true,
    isArchived: false,
  },

  // 🌙 Evening
  {
    id: 'calm-voice',
    name: 'Used my calm voice',
    emoji: '🌸',
    timeOfDay: 'evening',
    type: 'parent-only',
    points: 10,
    isArchived: false,
  },
]

// Max stars earnable per day from child-tappable habits
export const MAX_DAILY_STARS = DEFAULT_HABITS.reduce((total, h) => {
  if (h.type === 'parent-only') return total
  const perDay = h.type === 'repeatable' ? (h.maxPerDay ?? 10) * h.points : h.points
  return total + perDay
}, 0)
