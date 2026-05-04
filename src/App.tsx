import { useEffect } from 'react'
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

  // Auto-authenticate on load if credentials are saved
  useEffect(() => {
    if (!credentials || isAuthenticated) return
    authenticate(credentials)
      .then(() => setAuthenticated(true))
      .catch(() => {
        setAuthError('Saved credentials are invalid. Please log in again.')
      })
  }, [credentials, isAuthenticated, setAuthenticated, setAuthError])

  // Load categories + all streams once authenticated
  useEffect(() => {
    if (!isAuthenticated || !credentials) return
    getLiveCategories(credentials).then(setCategories).catch(console.error)
    setLoadingStreams(true)
    getLiveStreams(credentials)
      .then((streams) => {
        setAllStreams(streams)
        setStreams(streams)
      })
      .catch(console.error)
      .finally(() => setLoadingStreams(false))
  }, [isAuthenticated, credentials, setCategories, setStreams, setAllStreams, setLoadingStreams])

  // Load streams when category changes
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

        {/*
          Mobile: show either channel list OR player (not both)
          Desktop (md+): show channel list on left, player on right
        */}

        {/* Channel list panel */}
        <div
          className={[
            // Mobile: full width, hidden when player is active
            activeStream ? 'hidden' : 'flex',
            // Desktop: always visible as a sidebar
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
            // Mobile: full width, only shown when player is active
            activeStream ? 'flex' : 'hidden',
            // Desktop: always visible, fills remaining space
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
