import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
import { SystemStats } from '@/types/system'

export function useSystemStats() {
  return useQuery<SystemStats>({
    queryKey: QUERY_KEYS.SYSTEM_STATS,
    queryFn: async () => {
      const { data } = await api.get<SystemStats>('/system')
      return data
    },
    refetchInterval: 5000,
  })
}
