import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
import { DownloadInfo, GlobalStats, AddDownloadRequest, MoveRequest, DownloadHistoryItem } from '@/types/downloads'

export function useDownloads() {
  return useQuery<DownloadInfo[]>({
    queryKey: QUERY_KEYS.DOWNLOADS,
    queryFn: async () => {
      const { data } = await api.get<DownloadInfo[]>('/downloads')
      return data
    },
    refetchInterval: 2000,
  })
}

export function useActiveDownloads() {
  return useQuery<DownloadInfo[]>({
    queryKey: ['downloads', 'active'],
    queryFn: async () => {
      const { data } = await api.get<DownloadInfo[]>('/downloads/active')
      return data
    },
    refetchInterval: 2000,
  })
}

export function useDownloadStats() {
  return useQuery<GlobalStats>({
    queryKey: QUERY_KEYS.DOWNLOAD_STATS,
    queryFn: async () => {
      const { data } = await api.get<GlobalStats>('/downloads/stats')
      return data
    },
    refetchInterval: 2000,
  })
}

export function useDownloadHistory() {
  return useQuery<DownloadHistoryItem[]>({
    queryKey: QUERY_KEYS.DOWNLOAD_HISTORY,
    queryFn: async () => {
      const { data } = await api.get<DownloadHistoryItem[]>('/downloads/history')
      return data
    },
  })
}

export function useAddDownload() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, AddDownloadRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post('/downloads', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_STATS })
    },
  })
}

export function usePauseDownload() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: async (gid) => {
      const { data } = await api.post(`/downloads/${gid}/pause`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
    },
  })
}

export function useResumeDownload() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: async (gid) => {
      const { data } = await api.post(`/downloads/${gid}/resume`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
    },
  })
}

export function useRemoveDownload() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: async (gid) => {
      const { data } = await api.delete(`/downloads/${gid}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_STATS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOAD_HISTORY })
    },
  })
}

export function useMoveDownload() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, MoveRequest>({
    mutationFn: async (req) => {
      const { data } = await api.post(`/downloads/${req.gid}/move`, req)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
    },
  })
}

export function usePauseAll() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/downloads/pause-all')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
    },
  })
}

export function useResumeAll() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post('/downloads/resume-all')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DOWNLOADS })
    },
  })
}
