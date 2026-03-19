import { getDB } from './indexedDB'
import { lsGet, lsSet } from './localStorage'
import { LOCAL_STORAGE_KEYS, IDB_STORES } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SparkleBackup {
  version: 1
  exportedAt: string   // ISO timestamp
  progress: unknown
  pin: unknown
  habits: unknown[]
  dailyEntries: unknown[]
  rewards: unknown[]
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
  const db = await getDB()

  const backup: SparkleBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: lsGet(LOCAL_STORAGE_KEYS.USER_PROGRESS),
    pin: lsGet(LOCAL_STORAGE_KEYS.PARENT_PIN),
    habits: await db.getAll(IDB_STORES.HABITS),
    dailyEntries: await db.getAll(IDB_STORES.DAILY_ENTRIES),
    rewards: await db.getAll(IDB_STORES.REWARDS),
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

  // ── Restore localStorage ──────────────────────────────────────────────────
  if (backup.progress != null) lsSet(LOCAL_STORAGE_KEYS.USER_PROGRESS, backup.progress)
  if (backup.pin != null)      lsSet(LOCAL_STORAGE_KEYS.PARENT_PIN, backup.pin)

  // ── Restore IndexedDB (clear + re-insert each store) ─────────────────────
  const db = await getDB()

  {
    const tx = db.transaction(IDB_STORES.HABITS, 'readwrite')
    await tx.store.clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of backup.habits) await tx.store.put(item as any)
    await tx.done
  }
  {
    const tx = db.transaction(IDB_STORES.DAILY_ENTRIES, 'readwrite')
    await tx.store.clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of backup.dailyEntries ?? []) await tx.store.put(item as any)
    await tx.done
  }
  {
    const tx = db.transaction(IDB_STORES.REWARDS, 'readwrite')
    await tx.store.clear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of backup.rewards ?? []) await tx.store.put(item as any)
    await tx.done
  }

  // Reload so the app picks up all the restored data
  window.location.reload()
}
