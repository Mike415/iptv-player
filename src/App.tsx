import { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import { authenticate, getLiveCategories, getLiveStreams } from './lib/xtream'
import {
  loadCategoriesFromCache,
  loadAllStreamsFromCache,
  loadCategoryStreamsFromCache,
  saveCategoriesToCache,
  saveAllStreamsToCache,
  saveCategoryStreamsToCache,
  clearCache,
  cacheAgeLabel,
} from './lib/cache'
import LoginScreen from './components/LoginScreen'
import ChannelList from './components/ChannelList'
import VideoPlayer from './components/VideoPlayer'

function MainApp() {
  const {
    credentials,
    setAuthenticated,
    setAuthError,
    setCategories,
    setStreams,
    setAllStreams,
    setLoadingStreams,
    selectedCategoryId,
    activeStream,
    setActiveStream,
    logout,
  } = useStore()

  const initialLoadDone = useRef(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [backgroundLoading, setBackgroundLoading] = useState(false)

  // ── Startup: load categories instantly, then background-fetch all streams ──
  useEffect(() => {
    if (!credentials || initialLoadDone.current) return
    initialLoadDone.current = true

    async function startup() {
      if (!credentials) return

      // Step 1: Load categories — either from cache (instant) or network (~200ms)
      const cachedCats = await loadCategoriesFromCache()
      if (cachedCats) {
        setCategories(cachedCats.data)
        setCacheTimestamp(cachedCats.timestamp)
      } else {
        try {
          const categories = await getLiveCategories(credentials)
          setCategories(categories)
          setCacheTimestamp(Date.now())
          saveCategoriesToCache(categories).catch(console.error)
        } catch (err) {
          console.error('Failed to load categories:', err)
        }
      }

      // Step 2: Load all streams in background for search (non-blocking)
      const cachedAll = await loadAllStreamsFromCache()
      if (cachedAll) {
        setAllStreams(cachedAll.data)
      } else {
        // Fetch all streams in background — UI stays responsive
        setBackgroundLoading(true)
        try {
          const allStreams = await getLiveStreams(credentials)
          setAllStreams(allStreams)
          saveAllStreamsToCache(allStreams).catch(console.error)
        } catch (err) {
          console.error('Background stream load failed:', err)
        } finally {
          setBackgroundLoading(false)
        }
      }

      // Step 3: Verify auth silently in background
      try {
        await authenticate(credentials)
        setAuthenticated(true)
      } catch {
        setAuthError('Session expired. Please log in again.')
        logout()
      }
    }

    startup()
  }, [credentials, setAuthenticated, setAuthError, setCategories, setAllStreams, logout])

  // ── Load streams for selected category on demand ──
  useEffect(() => {
    if (!credentials || selectedCategoryId === null) return

    async function loadCategory() {
      if (!credentials || selectedCategoryId === null) return

      // Try cache first
      const cached = await loadCategoryStreamsFromCache(selectedCategoryId)
      if (cached) {
        setStreams(cached)
        return
      }

      // Fetch from network
      setLoadingStreams(true)
      try {
        const streams = await getLiveStreams(credentials, selectedCategoryId)
        setStreams(streams)
        saveCategoryStreamsToCache(selectedCategoryId, streams).catch(console.error)
      } catch (err) {
        console.error('Failed to load category streams:', err)
      } finally {
        setLoadingStreams(false)
      }
    }

    loadCategory()
  }, [selectedCategoryId, credentials, setStreams, setLoadingStreams])

  // ── Force refresh: clear all cache and reload ──
  async function handleRefresh() {
    if (!credentials || refreshing) return
    setRefreshing(true)
    await clearCache()
    initialLoadDone.current = false

    try {
      // Reload categories
      const categories = await getLiveCategories(credentials)
      setCategories(categories)
      saveCategoriesToCache(categories).catch(console.error)

      // Reload all streams in background
      setBackgroundLoading(true)
      const allStreams = await getLiveStreams(credentials)
      setAllStreams(allStreams)
      const now = Date.now()
      setCacheTimestamp(now)
      saveAllStreamsToCache(allStreams).catch(console.error)
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setBackgroundLoading(false)
      setRefreshing(false)
    }
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#030712' }}>
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {activeStream && (
            <button
              onClick={() => setActiveStream(null)}
              style={{ touchAction: 'manipulation' }}
              className="md:hidden text-blue-400 text-sm font-medium mr-1 transition"
            >
              ‹ Back
            </button>
          )}
          <span className="text-xl">📺</span>
          <span className="text-white font-semibold text-sm">
            {activeStream ? activeStream.name : 'IPTV Player'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!activeStream && (
            <>
              {/* Background loading indicator */}
              {backgroundLoading && (
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <span style={{
                    display: 'inline-block',
                    width: 10, height: 10,
                    border: '1.5px solid #6b7280',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span className="hidden sm:inline">Indexing...</span>
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ touchAction: 'manipulation' }}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-200 text-xs transition disabled:opacity-50"
                title={cacheTimestamp ? `Cached ${cacheAgeLabel(cacheTimestamp)}` : 'Refresh channels'}
              >
                <span className={refreshing ? 'animate-spin inline-block' : ''}>↻</span>
                {cacheTimestamp ? (
                  <span className="hidden sm:inline">{cacheAgeLabel(cacheTimestamp)}</span>
                ) : null}
              </button>
            </>
          )}

          <button
            onClick={logout}
            style={{ touchAction: 'manipulation' }}
            className="text-gray-400 hover:text-gray-200 text-xs transition px-2 py-1"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">

        {/* Channel list panel */}
        <div
          className={[
            activeStream ? 'hidden' : 'flex',
            'md:flex',
            'w-full md:w-80 lg:w-96 flex-shrink-0',
            'border-r border-gray-800',
            'flex-col',
          ].join(' ')}
        >
          <ChannelList backgroundLoading={backgroundLoading} />
        </div>

        {/* Player panel */}
        <div
          className={[
            activeStream ? 'flex' : 'hidden',
            'md:flex',
            'flex-1 flex-col',
          ].join(' ')}
        >
          {activeStream ? (
            <VideoPlayer />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-lg">Select a channel to start watching</p>
              </div>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const { credentials } = useStore()

  if (!credentials) {
    return <LoginScreen />
  }

  return <MainApp />
}
