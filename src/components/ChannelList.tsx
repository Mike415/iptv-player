import { useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'
import type { XtreamStream } from '../types/xtream'

interface ChannelItemProps {
  stream: XtreamStream
  isFavorite: boolean
  isActive: boolean
  onSelect: (stream: XtreamStream) => void
  onToggleFavorite: (id: number) => void
}

function ChannelItem({ stream, isFavorite, isActive, onSelect, onToggleFavorite }: ChannelItemProps) {
  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-800/50 ${
        isActive ? 'bg-blue-600' : 'active:bg-gray-700'
      }`}
      onClick={() => onSelect(stream)}
    >
      {/* Channel logo */}
      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded overflow-hidden bg-gray-800">
        {stream.stream_icon ? (
          <img
            src={stream.stream_icon}
            alt=""
            className="w-9 h-9 object-contain"
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
            }}
          />
        ) : (
          <span className="text-gray-500 text-base">📺</span>
        )}
      </div>

      {/* Channel name */}
      <span className={`flex-1 text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>
        {stream.name}
      </span>

      {/* Favorite button — large tap target */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(stream.stream_id)
        }}
        style={{ touchAction: 'manipulation' }}
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl ${
          isFavorite ? 'text-yellow-400' : 'text-gray-600'
        }`}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  )
}

export default function ChannelList() {
  const {
    streams,
    allStreams,
    categories,
    selectedCategoryId,
    searchQuery,
    showFavoritesOnly,
    activeStream,
    favorites,
    loadingStreams,
    setSelectedCategoryId,
    setSearchQuery,
    setShowFavoritesOnly,
    setActiveStream,
    toggleFavorite,
  } = useStore()

  const tabsRef = useRef<HTMLDivElement>(null)

  const displayedStreams = useMemo(() => {
    if (showFavoritesOnly) {
      return allStreams.filter((s) => favorites.includes(s.stream_id))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return allStreams.filter((s) => s.name.toLowerCase().includes(q))
    }
    return streams
  }, [streams, allStreams, searchQuery, showFavoritesOnly, favorites])

  const favoriteCount = useMemo(
    () => allStreams.filter((s) => favorites.includes(s.stream_id)).length,
    [allStreams, favorites]
  )

  return (
    <div className="flex flex-col h-full bg-gray-950" style={{ WebkitOverflowScrolling: 'touch' }}>

      {/* Search bar */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none select-none">🔍</span>
          <input
            type="search"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Category tabs — horizontal scroll */}
      <div
        ref={tabsRef}
        className="flex-shrink-0 flex gap-2 px-3 pb-2 overflow-x-auto"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Favorites tab */}
        <button
          onClick={() => setShowFavoritesOnly(true)}
          style={{ touchAction: 'manipulation' }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            showFavoritesOnly
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-800 text-gray-300'
          }`}
        >
          ★ Favorites{favoriteCount > 0 ? ` (${favoriteCount})` : ''}
        </button>

        {/* All Channels tab */}
        <button
          onClick={() => setSelectedCategoryId(null)}
          style={{ touchAction: 'manipulation' }}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            !selectedCategoryId && !showFavoritesOnly && !searchQuery
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300'
          }`}
        >
          All Channels
        </button>

        {/* Category tabs */}
        {categories.map((cat) => (
          <button
            key={cat.category_id}
            onClick={() => setSelectedCategoryId(cat.category_id)}
            style={{ touchAction: 'manipulation' }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedCategoryId === cat.category_id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {displayedStreams.length === 0 && loadingStreams ? (
          /* Loading state — only show when list is empty AND loading */
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading channels...</span>
          </div>
        ) : displayedStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm gap-2">
            {showFavoritesOnly
              ? <><span className="text-3xl">☆</span><span>No favorites yet — tap ☆ on any channel</span></>
              : <span>No channels found</span>
            }
          </div>
        ) : (
          displayedStreams.map((stream) => (
            <ChannelItem
              key={stream.stream_id}
              stream={stream}
              isFavorite={favorites.includes(stream.stream_id)}
              isActive={activeStream?.stream_id === stream.stream_id}
              onSelect={setActiveStream}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}

        {/* Subtle loading indicator at bottom when channels are present but still loading */}
        {displayedStreams.length > 0 && loadingStreams && (
          <div className="flex items-center justify-center py-4 gap-2 text-gray-600 text-xs">
            <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
            Loading more...
          </div>
        )}
      </div>
    </div>
  )
}
