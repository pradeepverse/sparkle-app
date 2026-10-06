import {
  loadUserData, getAllEntries, replaceAllData,
  saveProgress, saveParentPin, saveStarRupeeRatio, getEnglishProgress, saveEnglishProgress,
} from './db'
import type { Habit, DailyEntry, Reward, UserProgress, StarRupeeRatio, EnglishProgress } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

// Same shape as the pre-cloud (IndexedDB) app's backups, so those files still import.
export interface SparkleBackup {
  version: 1
  exportedAt: string   // ISO timestamp
  progress: unknown
  pin: unknown
  starRupeeRatio?: unknown
  englishProgress?: unknown
  habits: unknown[]
  dailyEntries: unknown[]
  rewards: unknown[]
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
  const data = await loadUserData()
  if (!data) throw new Error('Nothing to export yet')

  const backup: SparkleBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: data.progress,
    pin: data.parentPin,
    starRupeeRatio: data.starRupeeRatio,
    englishProgress: await getEnglishProgress().catch(() => null),
    habits: data.habits,
    dailyEntries: await getAllEntries(),
    rewards: data.rewards,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sparkle-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Parse metadata (without importing yet) ───────────────────────────────────

export async function readBackupMeta(file: File): Promise<{ exportedAt: string }> {
  const text = await file.text()
  const data = JSON.parse(text) as Partial<SparkleBackup>
  if (data.version !== 1 || !Array.isArray(data.habits)) {
    throw new Error('Not a valid Sparkle backup file')
  }
  return { exportedAt: data.exportedAt ?? '' }
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  let backup: SparkleBackup

  try {
    backup = JSON.parse(text) as SparkleBackup
  } catch {
    throw new Error('Could not read file — make sure it is a valid JSON backup')
  }

  if (backup.version !== 1 || !Array.isArray(backup.habits)) {
    throw new Error('Not a valid Sparkle backup file')
  }

  // ── Restore tables (replace everything) ──────────────────────────────────
  await replaceAllData(
    backup.habits as Habit[],
    (backup.dailyEntries ?? []) as DailyEntry[],
    (backup.rewards ?? []) as Reward[],
  )

  // ── Restore settings ──────────────────────────────────────────────────────
  if (backup.progress != null)       await saveProgress(backup.progress as UserProgress)
  if (typeof backup.pin === 'string') await saveParentPin(backup.pin)
  if (backup.starRupeeRatio != null) await saveStarRupeeRatio(backup.starRupeeRatio as StarRupeeRatio)
  // Tolerate a database without the english_progress migration.
  if (backup.englishProgress != null) {
    await saveEnglishProgress(backup.englishProgress as EnglishProgress).catch(console.error)
  }

  // Reload so the app picks up all the restored data
  window.location.reload()
}
