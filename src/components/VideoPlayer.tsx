import { useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import { useStore } from '../store/useStore'
import { buildStreamUrl, getShortEpg } from '../lib/xtream'

export default function VideoPlayer() {
  const { activeStream, credentials, setActiveStream, epgListings, setEpgListings, setLoadingEpg, loadingEpg, favorites, toggleFavorite } = useStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const isFavorite = activeStream ? favorites.includes(activeStream.stream_id) : false

  const loadEpg = useCallback(async () => {
    if (!activeStream || !credentials) return
    setLoadingEpg(true)
    try {
      const listings = await getShortEpg(credentials, activeStream.stream_id, 4)
      setEpgListings(listings)
    } catch {
      setEpgListings([])
    } finally {
      setLoadingEpg(false)
    }
  }, [activeStream, credentials, setEpgListings, setLoadingEpg])

  useEffect(() => {
    if (!activeStream || !credentials || !videoRef.current) return

    const streamUrl = buildStreamUrl(credentials, activeStream.stream_id)
    const video = videoRef.current

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari / iOS)
      video.src = streamUrl
      video.play().catch(() => {})
    }

    loadEpg()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [activeStream, credentials, loadEpg])

  if (!activeStream) return null

  const now = Date.now() / 1000
  const currentShow = epgListings.find(
    (l) => l.startTimestamp <= now && l.stopTimestamp > now
  ) || epgListings[0]

  const nextShow = epgListings.find(
    (l) => l.startTimestamp > now
  )

  function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Video */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          playsInline
          autoPlay
        />

        {/* Close button */}
        <button
          onClick={() => setActiveStream(null)}
          className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition z-10"
          aria-label="Close player"
        >
          ←
        </button>

        {/* Favorite button */}
        <button
          onClick={() => toggleFavorite(activeStream.stream_id)}
          className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition z-10"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      {/* Info bar */}
      <div className="bg-gray-900 px-4 py-3 flex-shrink-0">
        <div className="flex items-start gap-3">
          {activeStream.stream_icon && (
            <img
              src={activeStream.stream_icon}
              alt=""
              className="w-10 h-10 object-contain rounded flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{activeStream.name}</h2>
            {loadingEpg && (
              <p className="text-gray-400 text-xs mt-0.5">Loading guide...</p>
            )}
            {currentShow && !loadingEpg && (
              <div className="mt-0.5">
                <p className="text-blue-400 text-xs font-medium">
                  {formatTime(currentShow.startTimestamp)}–{formatTime(currentShow.stopTimestamp)} · {currentShow.title}
                </p>
                {nextShow && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    Next: {formatTime(nextShow.startTimestamp)} · {nextShow.title}
                  </p>
                )}
              </div>
            )}
            {!currentShow && !loadingEpg && (
              <p className="text-gray-500 text-xs mt-0.5">No guide info available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
