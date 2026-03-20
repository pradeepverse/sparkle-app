import type { UnicornMood } from '../types'

/**
 * Computes the unicorn's current mood based on today's progress.
 *
 * @param starsEarnedToday  Stars earned so far today (approved + self-logged)
 * @param maxPossibleToday  Max stars earnable today (from habits data)
 * @param streak            Current day streak
 */
export function computeMood(
  starsEarnedToday: number,
  maxPossibleToday: number,
  streak: number
): UnicornMood {
  if (starsEarnedToday === 0) return 'sleepy'

  const pct = maxPossibleToday > 0 ? starsEarnedToday / maxPossibleToday : 0

  if (pct >= 1.0) return 'party'
  if (streak >= 7 && pct >= 0.7) return 'party'
  if (pct >= 0.7) return 'magical'
  if (pct >= 0.4) return 'happy'
  return 'okay'
}

export const MOOD_LABELS: Record<UnicornMood, string> = {
  party: 'Party time! 🎉',
  magical: 'Magical! ✨',
  happy: 'Happy! 😊',
  okay: 'Okay 😐',
  sleepy: 'Sleepy 😴',
}
