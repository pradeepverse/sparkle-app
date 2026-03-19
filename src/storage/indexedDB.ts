import { openDB, type IDBPDatabase } from 'idb'
import {
  IDB_DB_NAME,
  IDB_DB_VERSION,
  IDB_STORES,
  type Habit,
  type DailyEntry,
  type Reward,
} from '../types'

// ─── Schema (idb requires this for full type inference) ───────────────────────

interface SparkleDB {
  [IDB_STORES.HABITS]: {
    key: string
    value: Habit
  }
  [IDB_STORES.DAILY_ENTRIES]: {
    key: string
    value: DailyEntry
    indexes: { by_habit: string; by_date: string }
  }
  [IDB_STORES.REWARDS]: {
    key: string
    value: Reward
  }
}

// ─── Singleton DB promise ─────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<SparkleDB>> | null = null

export function getDB(): Promise<IDBPDatabase<SparkleDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SparkleDB>(IDB_DB_NAME, IDB_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IDB_STORES.HABITS)) {
          db.createObjectStore(IDB_STORES.HABITS, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(IDB_STORES.DAILY_ENTRIES)) {
          const store = db.createObjectStore(IDB_STORES.DAILY_ENTRIES, { keyPath: 'id' })
          store.createIndex('by_habit', 'habitId')
          store.createIndex('by_date', 'dateString')
        }
        if (!db.objectStoreNames.contains(IDB_STORES.REWARDS)) {
          db.createObjectStore(IDB_STORES.REWARDS, { keyPath: 'id' })
        }
      },
      blocked() {
        console.warn('[sparkle/idb] DB upgrade blocked by an open tab')
      },
      blocking() {
        // Another tab opened a newer schema — release this connection
        dbPromise = null
      },
    })
  }
  return dbPromise
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

type StoreName = keyof SparkleDB

export async function idbAdd<S extends StoreName>(
  store: S,
  record: SparkleDB[S]['value']
): Promise<void> {
  const db = await getDB()
  await db.add(store, record)
}

export async function idbGet<S extends StoreName>(
  store: S,
  key: string
): Promise<SparkleDB[S]['value'] | undefined> {
  const db = await getDB()
  return db.get(store, key)
}

export async function idbGetAll<S extends StoreName>(
  store: S
): Promise<SparkleDB[S]['value'][]> {
  const db = await getDB()
  return db.getAll(store)
}

export async function idbPut<S extends StoreName>(
  store: S,
  record: SparkleDB[S]['value']
): Promise<void> {
  const db = await getDB()
  await db.put(store, record)
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const db = await getDB()
  await db.delete(store, key)
}

// ─── Convenience: get all daily entries for a specific date ──────────────────

export async function getEntriesForDate(dateString: string): Promise<DailyEntry[]> {
  const db = await getDB()
  return db.getAllFromIndex(IDB_STORES.DAILY_ENTRIES, 'by_date', dateString)
}

// ─── Convenience: delete all daily entries for a specific date ───────────────

export async function deleteEntriesForDate(dateString: string): Promise<void> {
  const entries = await getEntriesForDate(dateString)
  const db = await getDB()
  for (const entry of entries) {
    await db.delete(IDB_STORES.DAILY_ENTRIES, entry.id)
  }
}

// ─── Convenience: get stars earned per day for the last N days ───────────────

export async function getStarsPerDay(days: number): Promise<{ date: string; stars: number }[]> {
  const result: { date: string; stars: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateString = d.toISOString().slice(0, 10)
    const entries = await getEntriesForDate(dateString)
    const stars = entries.reduce((sum, e) => sum + e.starsEarned + e.bonusStars, 0)
    result.push({ date: dateString, stars })
  }
  return result
}
