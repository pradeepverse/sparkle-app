/**
 * Typed localStorage helpers.
 * All values are JSON-serialized. Corrupt/missing data returns null, never throws.
 */

export function lsGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    console.warn(`[sparkle/ls] Failed to read "${key}"`)
    return null
  }
}

export function lsSet<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn(`[sparkle/ls] Failed to write "${key}"`)
  }
}

export function lsRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    console.warn(`[sparkle/ls] Failed to remove "${key}"`)
  }
}
