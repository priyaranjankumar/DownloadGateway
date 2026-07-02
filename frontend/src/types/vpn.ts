export interface VPNStatus {
  connected: boolean
  server_id: string | null
  server_name: string | null
  country: string | null
  city: string | null
  endpoint: string | null
  public_ip: string | null
  connected_since: string | null
  last_handshake: string | null
  transfer_rx: string | null
  transfer_tx: string | null
  protocol: string
}

export interface VPNConnectRequest {
  server_id: string
}

export interface ServerInfo {
  id: string
  name: string
  country: string
  city: string
  hostname: string
  country_code: string
}

export interface IPInfo {
  ip: string
  country: string | null
  city: string | null
  asn: string | null
  provider: string | null
}

export interface KillSwitchStatus {
  enabled: boolean
}
