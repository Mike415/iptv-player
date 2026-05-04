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
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">📺</span>
          <span className="text-white font-semibold text-sm">IPTV Player</span>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-gray-200 text-xs transition"
        >
          Disconnect
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Channel list — hidden on mobile when player is active */}
        <div className={`${activeStream ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-gray-800`}>
          <div className="w-full">
            <ChannelList />
          </div>
        </div>

        {/* Player area */}
        <div className={`${activeStream ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
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
