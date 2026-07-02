import {
  Play,
  Pause,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileVideo,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  usePauseDownload,
  useResumeDownload,
  useRemoveDownload,
  useMoveDownload,
} from '@/hooks/use-downloads'
import { DownloadInfo } from '@/types/downloads'
import { formatBytes, formatSpeed, formatDuration } from '@/lib/utils'
import { toast } from 'sonner'

interface DownloadRowProps {
  download: DownloadInfo
  index: number
  totalCount: number
}

export default function DownloadRow({ download, index, totalCount }: DownloadRowProps) {
  const pauseMutation = usePauseDownload()
  const resumeMutation = useResumeDownload()
  const removeMutation = useRemoveDownload()
  const moveMutation = useMoveDownload()

  const progress = download.total_length > 0
    ? (download.completed_length / download.total_length) * 100
    : 0

  // Calculate ETA in seconds
  const eta = download.download_speed > 0
    ? (download.total_length - download.completed_length) / download.download_speed
    : 0

  const handlePause = () => {
    toast.promise(pauseMutation.mutateAsync(download.gid), {
      loading: 'Pausing download...',
      success: 'Download paused',
      error: 'Failed to pause download',
    })
  }

  const handleResume = () => {
    toast.promise(resumeMutation.mutateAsync(download.gid), {
      loading: 'Resuming download...',
      success: 'Download active',
      error: 'Failed to resume download',
    })
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove and delete "${download.name}"?`)) {
      toast.promise(removeMutation.mutateAsync(download.gid), {
        loading: 'Deleting task...',
        success: 'Task removed',
        error: 'Failed to delete task',
      })
    }
  }

  const handleMoveUp = () => {
    if (index === 0) return
    moveMutation.mutate({
      gid: download.gid,
      position: index - 1,
      how: 'POS_SET',
    })
  }

  const handleMoveDown = () => {
    if (index === totalCount - 1) return
    moveMutation.mutate({
      gid: download.gid,
      position: index + 1,
      how: 'POS_SET',
    })
  }

  // Get matching icon based on file extension
  const getFileIcon = (name: string | null) => {
    if (!name) return FileIcon
    const ext = name.split('.').pop()?.toLowerCase() || ''
    
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv'].includes(ext)) return FileVideo
    if (['zip', 'rar', 'tar', 'gz', '7z', 'iso'].includes(ext)) return FileArchive
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return FileAudio
    if (['py', 'js', 'ts', 'html', 'json', 'cpp'].includes(ext)) return FileCode
    if (['txt', 'pdf', 'doc', 'docx', 'md'].includes(ext)) return FileText
    return FileIcon
  }

  // Status style maps
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none">Active</Badge>
      case 'paused':
        return <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none">Paused</Badge>
      case 'waiting':
        return <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none">Queued</Badge>
      case 'complete':
        return (
          <Badge className="bg-[#4f46e5]/10 text-indigo-400 border border-[#4f46e5]/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Done
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Failed
          </Badge>
        )
      default:
        return <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 py-0.5 rounded-lg text-[10px] font-bold uppercase select-none">{status}</Badge>
    }
  }

  const IconComponent = getFileIcon(download.name)
  const isTransitioning = pauseMutation.isPending || resumeMutation.isPending || removeMutation.isPending

  return (
    <tr className="border-b border-[#222533]/40 hover:bg-[#111625]/20 transition-colors text-slate-300 text-xs">
      {/* File Icon & Name */}
      <td className="px-6 py-4 font-medium text-slate-100 max-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#111625] border border-[#222533] text-slate-400 shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold block truncate" title={download.name || ''}>
              {download.name || 'Unnamed download'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate max-w-[220px]">
              GID: {download.gid}
            </span>
          </div>
        </div>
      </td>

      {/* File Size */}
      <td className="px-6 py-4 font-mono font-semibold whitespace-nowrap">
        {formatBytes(download.total_length)}
      </td>

      {/* Progress & Speed */}
      <td className="px-6 py-4 min-w-[180px]">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span className="font-mono font-bold">{progress.toFixed(1)}%</span>
            <span className="font-mono font-bold text-slate-500">
              {formatBytes(download.completed_length)}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 bg-[#121624] rounded-lg [&>div]:bg-gradient-to-r [&>div]:from-[#4f46e5] [&>div]:to-[#7c3aed]" />
        </div>
      </td>

      {/* Rates Speed */}
      <td className="px-6 py-4 font-mono whitespace-nowrap font-bold text-slate-200">
        {download.status === 'active' ? formatSpeed(download.download_speed) : '--'}
      </td>

      {/* ETA */}
      <td className="px-6 py-4 font-mono whitespace-nowrap text-slate-400 font-medium">
        {download.status === 'active' ? formatDuration(eta) : '--'}
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(download.status)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 justify-end">
          {/* Pause / Play */}
          {download.status === 'active' || download.status === 'waiting' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePause}
              disabled={isTransitioning}
              className="w-8 h-8 rounded-lg hover:bg-amber-500/10 text-amber-500 hover:text-amber-400 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </Button>
          ) : download.status === 'paused' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResume}
              disabled={isTransitioning}
              className="w-8 h-8 rounded-lg hover:bg-emerald-500/10 text-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : null}

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isTransitioning}
            className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* Queue swaps (only waiting items) */}
          {download.status === 'waiting' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMoveUp}
                disabled={index === 0}
                className="w-8 h-8 rounded-lg hover:bg-[#1a1f2e] text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMoveDown}
                disabled={index === totalCount - 1}
                className="w-8 h-8 rounded-lg hover:bg-[#1a1f2e] text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
