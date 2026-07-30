import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { ScheduledDownload, CreateScheduleRequest } from '@/types/schedules'

const SCHEDULED_DOWNLOADS_KEY = ['schedules', 'list']

export function useScheduledDownloads() {
  return useQuery<ScheduledDownload[]>({
    queryKey: SCHEDULED_DOWNLOADS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ScheduledDownload[]>('/schedules')
      return data
    },
    refetchInterval: 30000,  // Check every 30s for status changes
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation<ScheduledDownload, Error, CreateScheduleRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ScheduledDownload>('/schedules', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_DOWNLOADS_KEY })
    },
  })
}

export function useCancelSchedule() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, number>({
    mutationFn: async (scheduleId) => {
      const { data } = await api.delete(`/schedules/${scheduleId}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHEDULED_DOWNLOADS_KEY })
    },
  })
}
