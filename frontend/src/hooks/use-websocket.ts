import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { QUERY_KEYS, WS_EVENTS } from '@/lib/constants'
import { WSEvent } from '@/types/websocket'

export function useWebSocket() {
  const queryClient = useQueryClient()
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<number | null>(null)
  const reconnectDelay = useRef<number>(1000) // Initial delay 1s

  const connect = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws?token=${token}`

    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      reconnectDelay.current = 1000 // Reset reconnect delay on success
    }

    ws.current.onmessage = (event) => {
      try {
        const payload: WSEvent = JSON.parse(event.data)
        const { type, data } = payload

        switch (type) {
          case WS_EVENTS.DOWNLOAD_STARTED:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_STATS })
            toast.info(`Download started: ${data.gid}`)
            break

          case WS_EVENTS.DOWNLOAD_COMPLETED:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_STATS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_HISTORY })
            toast.success(`Download completed: ${data.gid}`)
            break

          case WS_EVENTS.DOWNLOAD_PAUSED:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
            toast.info(`Download paused`)
            break

          case WS_EVENTS.DOWNLOAD_ERROR:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_STATS })
            toast.error(`Download failed: ${data.gid}`)
            break

          case WS_EVENTS.VPN_CONNECTED:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_STATUS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_IP })
            toast.success(`VPN Connected to: ${data.server}`)
            break

          case WS_EVENTS.VPN_DISCONNECTED:
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_STATUS })
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_IP })
            toast.warning('VPN Disconnected')
            break

          case WS_EVENTS.IP_CHANGED:
            queryClient.setQueryData(QUERY_KEYS.VPN_IP, data)
            toast.info(`Public IP updated: ${data.ip}`)
            break

          case WS_EVENTS.IP_LEAK_WARNING:
            toast.error(`SECURITY ALERT: Possible IP Leak! Expected ${data.expected}, got ${data.actual}`, {
              duration: 10000,
            })
            break

          case WS_EVENTS.SYSTEM_STATS:
            // Inject system stats directly into React Query cache for real-time responsiveness
            queryClient.setQueryData(QUERY_KEYS.SYSTEM_STATS, data)
            break

          case WS_EVENTS.DOWNLOAD_STATS:
            // Inject stats directly into cache
            queryClient.setQueryData(QUERY_KEYS.DOWNLOAD_STATS, data)
            break

          default:
            break
        }
      } catch (err) {
        console.error('Error parsing WS message', err)
      }
    }

    ws.current.onclose = (event) => {
      console.log(`WebSocket closed: ${event.reason}. Reconnecting...`)
      ws.current = null
      scheduleReconnect()
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }

  const scheduleReconnect = () => {
    if (reconnectTimeout.current) {
      window.clearTimeout(reconnectTimeout.current)
    }

    reconnectTimeout.current = window.setTimeout(() => {
      connect()
      // Exponential backoff up to 30 seconds
      reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30000)
    }, reconnectDelay.current)
  }

  useEffect(() => {
    connect()

    return () => {
      if (ws.current) {
        ws.current.onclose = null // Prevent close handler from triggering reconnect on unmount
        ws.current.close()
      }
      if (reconnectTimeout.current) {
        window.clearTimeout(reconnectTimeout.current)
      }
    }
  }, [])
}
