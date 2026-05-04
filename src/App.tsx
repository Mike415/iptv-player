import { useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { authenticate, getLiveCategories, getLiveStreams } from './lib/xtream'
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

  // Track whether we've done the initial full load
  const initialLoadDone = useRef(false)

  // Auto-authenticate on load if credentials are saved
  useEffect(() => {
    if (!credentials || isAuthenticated) return
    authenticate(credentials)
      .then(() => setAuthenticated(true))
      .catch(() => {
        setAuthError('Saved credentials are invalid. Please log in again.')
      })
  }, [credentials, isAuthenticated, setAuthenticated, setAuthError])

  // On auth: load categories immediately (fast), then load ALL streams in background
  // This lets the user see categories and interact right away
  useEffect(() => {
    if (!isAuthenticated || !credentials || initialLoadDone.current) return
    initialLoadDone.current = true

    // Step 1: Load categories — fast, shows UI immediately
    getLiveCategories(credentials)
      .then(setCategories)
      .catch(console.error)

    // Step 2: Load all streams in background — non-blocking
    // Use setTimeout to yield to the browser first so UI renders
    setTimeout(() => {
      setLoadingStreams(true)
      getLiveStreams(credentials)
        .then((streams) => {
          setAllStreams(streams)
          setStreams(streams)
        })
        .catch(console.error)
        .finally(() => setLoadingStreams(false))
    }, 100)
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

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Back button — only shown on mobile when player is active */}
          {activeStream && (
            <button
              onClick={() => setActiveStream(null)}
              className="md:hidden text-blue-400 hover:text-blue-300 text-sm font-medium mr-1 flex items-center gap-1 transition"
            >
              ‹ Back
            </button>
          )}
          <span className="text-xl">📺</span>
          <span className="text-white font-semibold text-sm">
            {activeStream ? activeStream.name : 'IPTV Player'}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-gray-200 text-xs transition px-2 py-1"
        >
          Disconnect
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">

        {/* Channel list panel — full width on mobile, sidebar on desktop */}
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

        {/* Player panel — full width on mobile when active, right side on desktop */}
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
