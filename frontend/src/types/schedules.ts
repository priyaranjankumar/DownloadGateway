export interface ScheduledDownload {
  id: number
  uris: string
  torrent_b64: string | null
  options: string | null
  schedule_at: string
  status: 'pending' | 'dispatched' | 'failed' | 'cancelled'
  created_at: string
  dispatched_at: string | null
  error_message: string | null
}

export interface CreateScheduleRequest {
  uris?: string[]
  torrent?: string
  options?: Record<string, string>
  schedule_at: string
}
