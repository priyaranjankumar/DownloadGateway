export interface DownloadInfo {
  gid: string
  status: string
  name: string | null
  total_length: number
  completed_length: number
  download_speed: number
  upload_speed: number
  connections: number
  num_seeders: number | null
  dir: string | null
  error_code: string | null
  error_message: string | null
  added_at: string | null
  completed_at: string | null
  info_hash: string | null
  is_torrent: boolean
}

export interface AddDownloadRequest {
  uris?: string[]
  torrent?: string
  options?: Record<string, string>
}

export interface GlobalStats {
  download_speed: number
  upload_speed: number
  num_active: number
  num_waiting: number
  num_stopped: number
}

export interface MoveRequest {
  gid: string
  position: number
  how?: string
}

export interface DownloadHistoryItem {
  id: number
  gid: string
  name: string
  size: number
  status: string
  download_speed: number
  completed_at: string
  uri: string | null
}
