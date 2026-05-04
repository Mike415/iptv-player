/**
 * IndexedDB cache for IPTV channel data.
 * - Categories: cached separately, 7-day TTL
 * - All streams: cached separately for search, 7-day TTL
 * - Per-category streams: cached per category_id, 7-day TTL
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

async function clearKey(key: string): Promise<void> {
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

async function clearAll(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Ignore
  }
}

// ─── Keys ──────────────────────────────────────────────────────────────────────
const CATEGORIES_KEY = 'categories'
const ALL_STREAMS_KEY = 'all_streams'
const categoryStreamsKey = (id: string) => `streams_cat_${id}`

// ─── Categories ────────────────────────────────────────────────────────────────

export async function loadCategoriesFromCache(): Promise<{ data: XtreamCategory[]; timestamp: number } | null> {
  const entry = await get<XtreamCategory[]>(CATEGORIES_KEY)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
  return entry
}

export async function saveCategoriesToCache(categories: XtreamCategory[]): Promise<void> {
  await set(CATEGORIES_KEY, categories)
}

// ─── All Streams (for search) ──────────────────────────────────────────────────

export async function loadAllStreamsFromCache(): Promise<{ data: XtreamStream[]; timestamp: number } | null> {
  const entry = await get<XtreamStream[]>(ALL_STREAMS_KEY)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
  return entry
}

export async function saveAllStreamsToCache(streams: XtreamStream[]): Promise<void> {
  await set(ALL_STREAMS_KEY, streams)
}

// ─── Per-category Streams ──────────────────────────────────────────────────────

export async function loadCategoryStreamsFromCache(categoryId: string): Promise<XtreamStream[] | null> {
  const entry = await get<XtreamStream[]>(categoryStreamsKey(categoryId))
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
  return entry.data
}

export async function saveCategoryStreamsToCache(categoryId: string, streams: XtreamStream[]): Promise<void> {
  await set(categoryStreamsKey(categoryId), streams)
}

// ─── Clear ─────────────────────────────────────────────────────────────────────

export async function clearCache(): Promise<void> {
  await clearAll()
}

// ─── Legacy compat (used by old code paths) ────────────────────────────────────

export interface CachedChannelData {
  streams: XtreamStream[]
  categories: XtreamCategory[]
  timestamp: number
}

export async function loadFromCache(): Promise<CachedChannelData | null> {
  const [streamsEntry, categoriesEntry] = await Promise.all([
    loadAllStreamsFromCache(),
    loadCategoriesFromCache(),
  ])
  if (!streamsEntry || !categoriesEntry) return null
  return {
    streams: streamsEntry.data,
    categories: categoriesEntry.data,
    timestamp: streamsEntry.timestamp,
  }
}

export async function saveToCache(streams: XtreamStream[], categories: XtreamCategory[]): Promise<void> {
  await Promise.all([
    saveAllStreamsToCache(streams),
    saveCategoriesToCache(categories),
  ])
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
