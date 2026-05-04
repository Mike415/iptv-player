import { create } from 'zustand'
import type { XtreamCredentials, XtreamCategory, XtreamStream, DecodedEpgListing } from '../types/xtream'

const CREDS_KEY = 'iptv_credentials'
const FAVORITES_KEY = 'iptv_favorites'

function loadCredentials(): XtreamCredentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

interface AppState {
  // Auth
  credentials: XtreamCredentials | null
  isAuthenticated: boolean
  authError: string | null

  // Data
  categories: XtreamCategory[]
  streams: XtreamStream[]
  allStreams: XtreamStream[]
  loadingStreams: boolean

  // Navigation
  selectedCategoryId: string | null
  searchQuery: string
  showFavoritesOnly: boolean

  // Player
  activeStream: XtreamStream | null
  epgListings: DecodedEpgListing[]
  loadingEpg: boolean

  // Favorites
  favorites: number[]

  // Actions
  setCredentials: (creds: XtreamCredentials) => void
  setAuthenticated: (val: boolean) => void
  setAuthError: (err: string | null) => void
  setCategories: (cats: XtreamCategory[]) => void
  setStreams: (streams: XtreamStream[]) => void
  setAllStreams: (streams: XtreamStream[]) => void
  setLoadingStreams: (val: boolean) => void
  setSelectedCategoryId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setShowFavoritesOnly: (val: boolean) => void
  setActiveStream: (stream: XtreamStream | null) => void
  setEpgListings: (listings: DecodedEpgListing[]) => void
  setLoadingEpg: (val: boolean) => void
  toggleFavorite: (streamId: number) => void
  logout: () => void
}

export const useStore = create<AppState>((set, get) => ({
  credentials: loadCredentials(),
  isAuthenticated: false,
  authError: null,

  categories: [],
  streams: [],
  allStreams: [],
  loadingStreams: false,

  selectedCategoryId: null,
  searchQuery: '',
  showFavoritesOnly: false,

  activeStream: null,
  epgListings: [],
  loadingEpg: false,

  favorites: loadFavorites(),

  setCredentials: (creds) => {
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
    set({ credentials: creds })
  },
  setAuthenticated: (val) => set({ isAuthenticated: val }),
  setAuthError: (err) => set({ authError: err }),
  setCategories: (cats) => set({ categories: cats }),
  setStreams: (streams) => set({ streams }),
  setAllStreams: (streams) => set({ allStreams: streams }),
  setLoadingStreams: (val) => set({ loadingStreams: val }),
  setSelectedCategoryId: (id) => set({ selectedCategoryId: id, searchQuery: '', showFavoritesOnly: false }),
  setSearchQuery: (q) => set({ searchQuery: q, selectedCategoryId: null, showFavoritesOnly: false }),
  setShowFavoritesOnly: (val) => set({ showFavoritesOnly: val, selectedCategoryId: null, searchQuery: '' }),
  setActiveStream: (stream) => set({ activeStream: stream, epgListings: [] }),
  setEpgListings: (listings) => set({ epgListings: listings }),
  setLoadingEpg: (val) => set({ loadingEpg: val }),

  toggleFavorite: (streamId) => {
    const current = get().favorites
    const updated = current.includes(streamId)
      ? current.filter((id) => id !== streamId)
      : [...current, streamId]
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated))
    set({ favorites: updated })
  },

  logout: () => {
    localStorage.removeItem(CREDS_KEY)
    set({
      credentials: null,
      isAuthenticated: false,
      authError: null,
      categories: [],
      streams: [],
      allStreams: [],
      selectedCategoryId: null,
      searchQuery: '',
      showFavoritesOnly: false,
      activeStream: null,
      epgListings: [],
    })
  },
}))
