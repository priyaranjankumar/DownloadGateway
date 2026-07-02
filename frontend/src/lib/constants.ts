export const ROUTES = {
  DASHBOARD: '/',
  DOWNLOADS: '/downloads',
  VPN: '/vpn',
  FILES: '/files',
  LOGS: '/logs',
  SETTINGS: '/settings',
  LOGIN: '/login',
}

export const QUERY_KEYS = {
  CURRENT_USER: ['auth', 'current-user'],
  VPN_STATUS: ['vpn', 'status'],
  VPN_SERVERS: ['vpn', 'servers'],
  VPN_IP: ['vpn', 'ip'],
  KILL_SWITCH: ['vpn', 'killswitch'],
  DOWNLOADS: ['downloads', 'list'],
  DOWNLOAD_STATS: ['downloads', 'stats'],
  DOWNLOAD_HISTORY: ['downloads', 'history'],
  SYSTEM_STATS: ['system', 'stats'],
  FILES: ['files', 'list'],
  LOGS: ['logs', 'tail'],
}

export const WS_EVENTS = {
  DOWNLOAD_STARTED: 'download:started',
  DOWNLOAD_COMPLETED: 'download:completed',
  DOWNLOAD_ERROR: 'download:error',
  DOWNLOAD_PAUSED: 'download:paused',
  VPN_CONNECTED: 'vpn:connected',
  VPN_DISCONNECTED: 'vpn:disconnected',
  IP_CHANGED: 'ip:changed',
  IP_LEAK_WARNING: 'ip:leak_warning',
  SYSTEM_STATS: 'system:stats',
  DOWNLOAD_STATS: 'download:stats',
}
