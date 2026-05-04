import type {
  XtreamCredentials,
  XtreamAuthResponse,
  XtreamCategory,
  XtreamStream,
  XtreamEpgResponse,
  DecodedEpgListing,
} from '../types/xtream'

function buildApiUrl(creds: XtreamCredentials, params: Record<string, string>): string {
  const base = creds.server.replace(/\/$/, '')
  const query = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    ...params,
  })
  return `${base}/player_api.php?${query.toString()}`
}

export function buildStreamUrl(creds: XtreamCredentials, streamId: number): string {
  const base = creds.server.replace(/\/$/, '')
  return `${base}/live/${creds.username}/${creds.password}/${streamId}.m3u8`
}

export async function authenticate(creds: XtreamCredentials): Promise<XtreamAuthResponse> {
  const url = buildApiUrl(creds, {})
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data.user_info || data.user_info.auth !== 1) {
    throw new Error('Authentication failed — check your credentials')
  }
  return data as XtreamAuthResponse
}

export async function getLiveCategories(creds: XtreamCredentials): Promise<XtreamCategory[]> {
  const url = buildApiUrl(creds, { action: 'get_live_categories' })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getLiveStreams(
  creds: XtreamCredentials,
  categoryId?: string
): Promise<XtreamStream[]> {
  const params: Record<string, string> = { action: 'get_live_streams' }
  if (categoryId) params.category_id = categoryId
  const url = buildApiUrl(creds, params)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function decodeBase64(str: string): string {
  if (!str) return ''
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return str
  }
}

export async function getShortEpg(
  creds: XtreamCredentials,
  streamId: number,
  limit = 4
): Promise<DecodedEpgListing[]> {
  const url = buildApiUrl(creds, {
    action: 'get_short_epg',
    stream_id: String(streamId),
    limit: String(limit),
  })
  const res = await fetch(url)
  if (!res.ok) return []
  const data: XtreamEpgResponse = await res.json()
  return (data.epg_listings || []).map((l) => ({
    id: l.id,
    title: decodeBase64(l.title),
    description: decodeBase64(l.description),
    start: l.start,
    end: l.end,
    startTimestamp: l.start_timestamp,
    stopTimestamp: l.stop_timestamp,
    nowPlaying: l.now_playing === 1,
  }))
}
