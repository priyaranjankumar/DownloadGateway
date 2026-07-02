import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
import { VPNStatus, ServerInfo, IPInfo, KillSwitchStatus } from '@/types/vpn'

export function useVPNStatus() {
  return useQuery<VPNStatus>({
    queryKey: QUERY_KEYS.VPN_STATUS,
    queryFn: async () => {
      const { data } = await api.get<VPNStatus>('/vpn')
      return data
    },
    refetchInterval: 5000,
  })
}

export function useVPNConnect() {
  const queryClient = useQueryClient()
  return useMutation<VPNStatus, Error, string>({
    mutationFn: async (serverId) => {
      const { data } = await api.post<VPNStatus>('/vpn/connect', { server_id: serverId })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.VPN_STATUS, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_IP })
    },
  })
}

export function useVPNDisconnect() {
  const queryClient = useQueryClient()
  return useMutation<VPNStatus, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<VPNStatus>('/vpn/disconnect')
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.VPN_STATUS, data)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VPN_IP })
    },
  })
}

export function useVPNServers() {
  return useQuery<ServerInfo[]>({
    queryKey: QUERY_KEYS.VPN_SERVERS,
    queryFn: async () => {
      const { data } = await api.get<ServerInfo[]>('/vpn/servers')
      return data
    },
  })
}

export function useCurrentIP() {
  return useQuery<IPInfo>({
    queryKey: QUERY_KEYS.VPN_IP,
    queryFn: async () => {
      const { data } = await api.get<IPInfo>('/vpn/ip')
      return data
    },
    refetchInterval: 15000,
  })
}

export function useKillSwitch() {
  return useQuery<KillSwitchStatus>({
    queryKey: QUERY_KEYS.KILL_SWITCH,
    queryFn: async () => {
      const { data } = await api.get<KillSwitchStatus>('/vpn/killswitch')
      return data
    },
  })
}

export function useEnableKillSwitch() {
  const queryClient = useQueryClient()
  return useMutation<KillSwitchStatus, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<KillSwitchStatus>('/vpn/killswitch/enable')
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.KILL_SWITCH, data)
    },
  })
}

export function useDisableKillSwitch() {
  const queryClient = useQueryClient()
  return useMutation<KillSwitchStatus, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<KillSwitchStatus>('/vpn/killswitch/disable')
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.KILL_SWITCH, data)
    },
  })
}
