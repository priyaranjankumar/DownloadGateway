export interface SystemStats {
  cpu_percent: number
  cpu_count: number
  ram_used: number
  ram_total: number
  ram_percent: number
  disk_used: number
  disk_total: number
  disk_percent: number
  cpu_temp: number | null
  uptime: number
  load_avg: number[]
  net_sent: number
  net_recv: number
  net_speed_up: number
  net_speed_down: number
}
