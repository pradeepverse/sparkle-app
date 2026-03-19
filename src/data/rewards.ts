import type { Reward } from '../types'

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'ice-cream',   name: 'Ice cream treat',   emoji: '🍦', starCost: 50,  isUnlocked: false },
  { id: 'movie-night', name: 'Movie night',        emoji: '🎬', starCost: 100, isUnlocked: false },
  { id: 'small-toy',   name: 'Choose a small toy', emoji: '🧸', starCost: 200, isUnlocked: false },
  { id: 'park-outing', name: 'Fun day out',        emoji: '🎡', starCost: 400, isUnlocked: false },
]
