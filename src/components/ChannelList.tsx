import { useMemo } from 'react'
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
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mx-1 transition-colors ${
        isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
      }`}
      onClick={() => onSelect(stream)}
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
        {stream.stream_icon ? (
          <img
            src={stream.stream_icon}
            alt=""
            className="w-8 h-8 object-contain rounded"
            onError={(e) => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              el.nextElementSibling?.removeAttribute('style')
            }}
          />
        ) : null}
        <span
          className="text-gray-500 text-xs"
          style={{ display: stream.stream_icon ? 'none' : 'block' }}
        >
          📺
        </span>
      </div>

      <span className={`flex-1 text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>
        {stream.name}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite(stream.stream_id)
        }}
        className={`flex-shrink-0 text-base transition-colors ${
          isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
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

  const favoriteStreams = useMemo(
    () => allStreams.filter((s) => favorites.includes(s.stream_id)),
    [allStreams, favorites]
  )

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-800 flex-shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Category sidebar */}
        <div className="w-36 flex-shrink-0 border-r border-gray-800 overflow-y-auto">
          <div className="py-1">
            {/* Favorites tab */}
            <button
              onClick={() => setShowFavoritesOnly(true)}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                showFavoritesOnly
                  ? 'bg-yellow-600/20 text-yellow-400 border-r-2 border-yellow-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              ★ Favorites
              {favoriteStreams.length > 0 && (
                <span className="ml-1 text-gray-500">({favoriteStreams.length})</span>
              )}
            </button>

            {/* All channels */}
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                !selectedCategoryId && !showFavoritesOnly && !searchQuery
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              All Channels
            </button>

            {/* Category list */}
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategoryId(cat.category_id)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  selectedCategoryId === cat.category_id
                    ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <span className="block truncate">{cat.category_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto">
          {loadingStreams ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              Loading channels...
            </div>
          ) : displayedStreams.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
              {showFavoritesOnly ? 'No favorites yet — star a channel to add it' : 'No channels found'}
            </div>
          ) : (
            <div className="py-1">
              {displayedStreams.map((stream) => (
                <ChannelItem
                  key={stream.stream_id}
                  stream={stream}
                  isFavorite={favorites.includes(stream.stream_id)}
                  isActive={activeStream?.stream_id === stream.stream_id}
                  onSelect={setActiveStream}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
