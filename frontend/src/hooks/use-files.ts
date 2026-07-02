import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
import { FileEntry, RenameRequest, MoveFileRequest, CreateDirRequest } from '@/types/files'

export function useFiles(path: string = '') {
  return useQuery<FileEntry[]>({
    queryKey: [...QUERY_KEYS.FILES, path],
    queryFn: async () => {
      const { data } = await api.get<FileEntry[]>('/files', {
        params: { path },
      })
      return data
    },
  })
}

export function useRenameFile() {
  const queryClient = useQueryClient()
  return useMutation<FileEntry, Error, RenameRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<FileEntry>('/files/rename', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES })
    },
  })
}

export function useDeleteFile() {
  const queryClient = useQueryClient()
  return useMutation<any, Error, string>({
    mutationFn: async (path) => {
      const { data } = await api.delete('/files', {
        params: { path },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES })
    },
  })
}

export function useMoveFile() {
  const queryClient = useQueryClient()
  return useMutation<FileEntry, Error, MoveFileRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<FileEntry>('/files/move', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES })
    },
  })
}

export function useCreateDir() {
  const queryClient = useQueryClient()
  return useMutation<FileEntry, Error, CreateDirRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<FileEntry>('/files/mkdir', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES })
    },
  })
}
