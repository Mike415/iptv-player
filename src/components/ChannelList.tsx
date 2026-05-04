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
    // Use a real <button> so iOS Safari fires click reliably
    <div className={`flex items-center border-b border-gray-800/50 ${isActive ? 'bg-blue-600' : ''}`}>
      <button
        type="button"
        onClick={() => onSelect(stream)}
        className="flex items-center gap-3 flex-1 px-4 py-3 text-left min-w-0"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Channel logo */}
        <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded overflow-hidden bg-gray-800">
          {stream.stream_icon ? (
            <img
              src={stream.stream_icon}
              alt=""
              className="w-9 h-9 object-contain"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <span className="text-gray-500 text-base">📺</span>
          )}
        </div>
        {/* Channel name */}
        <span className={`flex-1 text-sm truncate ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>
          {stream.name}
        </span>
      </button>

      {/* Favorite button — separate from the channel select button */}
      <button
        type="button"
        onClick={() => onToggleFavorite(stream.stream_id)}
        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center text-xl pr-2 ${
          isFavorite ? 'text-yellow-400' : 'text-gray-600'
        }`}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  )
}

interface ChannelListProps {
  backgroundLoading?: boolean
}

export default function ChannelList({ backgroundLoading }: ChannelListProps) {
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
    // Outer container: fixed height, no overflow — children manage their own scroll
    <div className="flex flex-col bg-gray-950" style={{ height: '100%', overflow: 'hidden' }}>

      {/* Search bar — fixed, never scrolls */}
      <div style={{ flexShrink: 0, padding: '12px 12px 8px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: '#6b7280', fontSize: 14, pointerEvents: 'none', userSelect: 'none'
          }}>🔍</span>
          <input
            type="text"
            inputMode="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={backgroundLoading ? 'Indexing channels...' : 'Search channels...'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            style={{
              width: '100%',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 12,
              paddingLeft: 36,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16, /* Must be >=16px to prevent iOS Safari auto-zoom on focus */
              color: 'white',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Category tabs — horizontal scroll, fixed height */}
      <div
        ref={tabsRef}
        style={{
          flexShrink: 0,
          display: 'flex',
          gap: 8,
          padding: '0 12px 8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          // Prevent this scroll from conflicting with vertical channel list scroll
          touchAction: 'pan-x',
        }}
      >
        <button
          type="button"
          onClick={() => setShowFavoritesOnly(true)}
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            background: showFavoritesOnly ? '#eab308' : '#1f2937',
            color: showFavoritesOnly ? '#000' : '#d1d5db',
          }}
        >
          ★ Favorites{favoriteCount > 0 ? ` (${favoriteCount})` : ''}
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategoryId(null)}
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            background: (!selectedCategoryId && !showFavoritesOnly && !searchQuery) ? '#2563eb' : '#1f2937',
            color: (!selectedCategoryId && !showFavoritesOnly && !searchQuery) ? '#fff' : '#d1d5db',
          }}
        >
          All Channels
        </button>

        {categories.map((cat) => (
          <button
            key={cat.category_id}
            type="button"
            onClick={() => setSelectedCategoryId(cat.category_id)}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              background: selectedCategoryId === cat.category_id ? '#2563eb' : '#1f2937',
              color: selectedCategoryId === cat.category_id ? '#fff' : '#d1d5db',
            }}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {/* Channel list — takes remaining height, scrolls vertically */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        // Allow vertical scroll only — prevents conflict with horizontal tab scroll
        touchAction: 'pan-y',
        minHeight: 0,
      }}>
        {displayedStreams.length === 0 && loadingStreams ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 12 }}>
            <div style={{
              width: 24, height: 24,
              border: '2px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ color: '#6b7280', fontSize: 14 }}>Loading channels...</span>
          </div>
        ) : displayedStreams.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, color: '#6b7280', fontSize: 14, gap: 8 }}>
            {showFavoritesOnly
              ? <><span style={{ fontSize: 32 }}>☆</span><span>No favorites yet — tap ☆ on any channel</span></>
              : <span>No channels found</span>
            }
          </div>
        ) : (
          <>
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
            {loadingStreams && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8, color: '#4b5563', fontSize: 12 }}>
                <div style={{
                  width: 12, height: 12,
                  border: '1px solid #4b5563',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Loading more...
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
