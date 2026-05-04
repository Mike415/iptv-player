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
    isAuthenticated,
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

  // Auto-authenticate on load if credentials are saved
  useEffect(() => {
    if (!credentials || isAuthenticated) return
    authenticate(credentials)
      .then(() => setAuthenticated(true))
      .catch(() => {
        setAuthError('Saved credentials are invalid. Please log in again.')
      })
  }, [credentials, isAuthenticated, setAuthenticated, setAuthError])

  // On auth: try cache first, then fetch fresh if needed
  useEffect(() => {
    if (!isAuthenticated || !credentials || initialLoadDone.current) return
    initialLoadDone.current = true

    async function loadChannels() {
      if (!credentials) return

      // Try loading from cache first — instant
      const cached = await loadFromCache()
      if (cached) {
        setCategories(cached.categories)
        setAllStreams(cached.streams)
        setStreams(cached.streams)
        setCacheTimestamp(cached.timestamp)
        // Don't show loading spinner since we have cached data
        return
      }

      // No cache — fetch fresh
      setLoadingStreams(true)
      try {
        const [categories, streams] = await Promise.all([
          getLiveCategories(credentials),
          getLiveStreams(credentials),
        ])
        setCategories(categories)
        setAllStreams(streams)
        setStreams(streams)
        setCacheTimestamp(Date.now())
        // Save to cache in background
        saveToCache(streams, categories).catch(console.error)
      } catch (err) {
        console.error('Failed to load channels:', err)
      } finally {
        setLoadingStreams(false)
      }
    }

    loadChannels()
  }, [isAuthenticated, credentials, setCategories, setStreams, setAllStreams, setLoadingStreams])

  // Load streams for a specific category when selected
  useEffect(() => {
    if (!isAuthenticated || !credentials || selectedCategoryId === null) return
    setLoadingStreams(true)
    getLiveStreams(credentials, selectedCategoryId)
      .then(setStreams)
      .catch(console.error)
      .finally(() => setLoadingStreams(false))
  }, [selectedCategoryId, isAuthenticated, credentials, setStreams, setLoadingStreams])

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
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
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
          {/* Cache age + refresh button — only shown when not watching */}
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
  const { credentials, isAuthenticated } = useStore()

  if (!credentials || !isAuthenticated) {
    return <LoginScreen />
  }

  return <MainApp />
}
