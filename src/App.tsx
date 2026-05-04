import { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import { authenticate, getLiveCategories, getLiveStreams } from './lib/xtream'
import { loadFromCache, saveToCache, clearCache, cacheAgeLabel } from './lib/cache'
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

  // On mount: load channels from cache immediately, then verify auth in background
  useEffect(() => {
    if (!credentials || initialLoadDone.current) return
    initialLoadDone.current = true

    async function startup() {
      if (!credentials) return

      // Step 1: Load from cache immediately — no network needed, instant UI
      const cached = await loadFromCache()
      if (cached) {
        setCategories(cached.categories)
        setAllStreams(cached.streams)
        setStreams(cached.streams)
        setCacheTimestamp(cached.timestamp)
      } else {
        // No cache yet — fetch fresh
        setLoadingStreams(true)
        try {
          const [categories, streams] = await Promise.all([
            getLiveCategories(credentials),
            getLiveStreams(credentials),
          ])
          setCategories(categories)
          setAllStreams(streams)
          setStreams(streams)
          const now = Date.now()
          setCacheTimestamp(now)
          saveToCache(streams, categories).catch(console.error)
        } catch (err) {
          console.error('Failed to load channels:', err)
        } finally {
          setLoadingStreams(false)
        }
      }

      // Step 2: Verify auth in background — only log out if truly invalid
      // Don't block the UI on this
      try {
        await authenticate(credentials)
        setAuthenticated(true)
      } catch {
        // Only show login if auth explicitly fails (not just network issues)
        setAuthError('Session expired. Please log in again.')
        logout()
      }
    }

    startup()
  }, [credentials, setAuthenticated, setAuthError, setCategories, setStreams, setAllStreams, setLoadingStreams, logout])

  // Load streams for a specific category when selected
  useEffect(() => {
    if (!credentials || selectedCategoryId === null) return
    setLoadingStreams(true)
    getLiveStreams(credentials, selectedCategoryId)
      .then(setStreams)
      .catch(console.error)
      .finally(() => setLoadingStreams(false))
  }, [selectedCategoryId, credentials, setStreams, setLoadingStreams])

  // Force refresh — clears cache and re-fetches everything
  async function handleRefresh() {
    if (!credentials || refreshing) return
    setRefreshing(true)
    await clearCache()
    try {
      setLoadingStreams(true)
      const [categories, streams] = await Promise.all([
        getLiveCategories(credentials),
        getLiveStreams(credentials),
      ])
      setCategories(categories)
      setAllStreams(streams)
      setStreams(streams)
      const now = Date.now()
      setCacheTimestamp(now)
      saveToCache(streams, categories).catch(console.error)
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setLoadingStreams(false)
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
          <ChannelList />
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
    </div>
  )
}

export default function App() {
  const { credentials } = useStore()

  // If we have saved credentials, go straight to the main app
  // Auth verification happens in the background inside MainApp
  if (!credentials) {
    return <LoginScreen />
  }

  return <MainApp />
}
