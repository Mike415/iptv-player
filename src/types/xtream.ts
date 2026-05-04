export interface XtreamCredentials {
  server: string
  username: string
  password: string
}

export interface XtreamUserInfo {
  username: string
  password: string
  message: string
  auth: number
  status: string
  exp_date: string
  is_trial: string
  active_cons: string
  created_at: string
  max_connections: string
  allowed_output_formats: string[]
}

export interface XtreamServerInfo {
  url: string
  port: string
  https_port: string
  server_protocol: string
  rtmp_port: string
  timezone: string
  timestamp_now: number
  time_now: string
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo
  server_info: XtreamServerInfo
}

export interface XtreamCategory {
  category_id: string
  category_name: string
  parent_id: number
}

export interface XtreamStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string
  added: string
  is_adult: number
  category_id: string
  category_ids: number[]
  custom_sid: string | null
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export interface XtreamEpgListing {
  id: string
  epg_id: string
  title: string // base64 encoded
  lang: string
  start: string
  end: string
  description: string // base64 encoded
  channel_id: string
  start_timestamp: number
  stop_timestamp: number
  now_playing: number
  has_archive: number
}

export interface XtreamEpgResponse {
  epg_listings: XtreamEpgListing[]
}

export interface DecodedEpgListing {
  id: string
  title: string
  description: string
  start: string
  end: string
  startTimestamp: number
  stopTimestamp: number
  nowPlaying: boolean
}
