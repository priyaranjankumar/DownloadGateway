export interface AppSettings {
  download_dir?: string | null
  max_concurrent_downloads?: number | null
  max_download_speed?: number | null
  max_upload_speed?: number | null
  aria2_rpc_secret?: string | null
  vpn_auto_connect?: boolean | null
  vpn_auto_connect_server?: string | null
  killswitch_auto_enable?: boolean | null
  ip_check_interval?: number | null
  theme?: string | null
  notification_download_complete?: boolean | null
  notification_download_error?: boolean | null
  notification_vpn_disconnect?: boolean | null
}
