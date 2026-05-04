/**
 * IndexedDB cache for IPTV channel data.
 * Stores all streams + categories with a 7-day TTL.
 * User can force a refresh at any time via the UI.
 */

import type { XtreamCategory, XtreamStream } from '../types/xtream'

const DB_NAME = 'iptv-cache'
const DB_VERSION = 1
const STORE_NAME = 'cache'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry {
  key: string
  data: unknown
  timestamp: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function get<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(key)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined
        if (!entry) return resolve(null)
        resolve({ data: entry.data as T, timestamp: entry.timestamp })
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function set(key: string, data: unknown): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const entry: CacheEntry = { key, data, timestamp: Date.now() }
      tx.objectStore(STORE_NAME).put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Cache write failure is non-fatal
  }
}

async function clear(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Ignore
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

const STREAMS_KEY = 'all_streams'
const CATEGORIES_KEY = 'categories'

export interface CachedChannelData {
  streams: XtreamStream[]
  categories: XtreamCategory[]
  timestamp: number
}

/**
 * Load channels + categories from cache.
 * Returns null if cache is missing or older than 7 days.
 */
export async function loadFromCache(): Promise<CachedChannelData | null> {
  const [streamsEntry, categoriesEntry] = await Promise.all([
    get<XtreamStream[]>(STREAMS_KEY),
    get<XtreamCategory[]>(CATEGORIES_KEY),
  ])

  if (!streamsEntry || !categoriesEntry) return null

  const age = Date.now() - streamsEntry.timestamp
  if (age > CACHE_TTL_MS) return null

  return {
    streams: streamsEntry.data,
    categories: categoriesEntry.data,
    timestamp: streamsEntry.timestamp,
  }
}

/**
 * Save channels + categories to cache with current timestamp.
 */
export async function saveToCache(
  streams: XtreamStream[],
  categories: XtreamCategory[]
): Promise<void> {
  await Promise.all([
    set(STREAMS_KEY, streams),
    set(CATEGORIES_KEY, categories),
  ])
}

/**
 * Clear the cache so the next load fetches fresh data.
 */
export async function clearCache(): Promise<void> {
  await Promise.all([clear(STREAMS_KEY), clear(CATEGORIES_KEY)])
}

/**
 * Returns a human-readable string of how old the cache is.
 * e.g. "2 hours ago", "3 days ago"
 */
export function cacheAgeLabel(timestamp: number): string {
  const ms = Date.now() - timestamp
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
