import { useState } from 'react'
import DownloadFilters from '@/components/downloads/DownloadFilters'
import DownloadTable from '@/components/downloads/DownloadTable'
import AddDownloadDialog from '@/components/downloads/AddDownloadDialog'
import { useDownloads, usePauseAll, useResumeAll } from '@/hooks/use-downloads'
import { useScheduledDownloads, useCancelSchedule } from '@/hooks/use-schedules'
import { Clock, X, CheckCircle, AlertCircle, Ban } from 'lucide-react'
import { toast } from 'sonner'

export default function DownloadsPage() {
  const { data: downloads, isLoading } = useDownloads()
  const pauseAllMutation = usePauseAll()
  const resumeAllMutation = useResumeAll()

  const { data: scheduledDownloads } = useScheduledDownloads()
  const cancelScheduleMutation = useCancelSchedule()

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCancelSchedule = (id: number) => {
    toast.promise(cancelScheduleMutation.mutateAsync(id), {
      loading: 'Cancelling schedule...',
      success: 'Schedule cancelled',
      error: 'Failed to cancel schedule',
    })
  }

  const handlePauseAll = () => {
    pauseAllMutation.mutate()
  }

  const handleResumeAll = () => {
    resumeAllMutation.mutate()
  }

  // Filter & Search logic
  const filteredDownloads = (downloads || []).filter((d) => {
    // 1. Tab filter
    if (activeTab === 'active' && d.status !== 'active') return false
    if (activeTab === 'waiting' && d.status !== 'waiting') return false
    if (activeTab === 'completed' && d.status !== 'complete') return false
    if (activeTab === 'failed' && d.status !== 'error') return false

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = d.name?.toLowerCase().includes(q)
      const matchesGid = d.gid.toLowerCase().includes(q)
      return matchesName || matchesGid
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Top Header bar with Add dialog */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Downloads Manager</h1>
          <p className="text-xs text-slate-500">Monitor, pause, and control your download queue.</p>
        </div>
        <AddDownloadDialog />
      </div>

      {/* Filter tab bar */}
      <DownloadFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPauseAll={handlePauseAll}
        onResumeAll={handleResumeAll}
      />

      {/* Main Download Listing */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0c101d]/20 border border-[#222533]/40 rounded-2xl">
          <div className="w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-500 text-xs font-semibold">Syncing queue with aria2...</p>
        </div>
      ) : (
        <DownloadTable downloads={filteredDownloads} />
      )}

      {/* Scheduled Downloads Section */}
      {scheduledDownloads && scheduledDownloads.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-[#222533]/40">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Scheduled Downloads
          </h2>
          <div className="bg-[#0c101d]/40 border border-[#222533]/50 rounded-2xl overflow-hidden">
            {scheduledDownloads.map((item) => {
              let parsedUris: string[] = []
              try {
                parsedUris = JSON.parse(item.uris)
              } catch (e) {}

              const isPending = item.status === 'pending'
              const statusColors = {
                pending: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                dispatched: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                failed: 'bg-red-500/10 text-red-400 border-red-500/20',
                cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
              }
              const Icon = {
                pending: Clock,
                dispatched: CheckCircle,
                failed: AlertCircle,
                cancelled: Ban,
              }[item.status] || Clock

              return (
                <div key={item.id} className="flex items-center justify-between p-4 border-b border-[#222533]/40 last:border-b-0 hover:bg-[#111625]/40 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[item.status as keyof typeof statusColors] || statusColors.pending}`}>
                        <Icon className="w-3 h-3" />
                        {item.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {new Date(item.schedule_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {item.torrent_b64 ? 'Torrent Upload' : parsedUris.join(', ') || 'No URIs'}
                    </div>
                    {item.error_message && (
                      <div className="text-[11px] text-red-400 mt-1 truncate">
                        {item.error_message}
                      </div>
                    )}
                  </div>
                  {isPending && (
                    <button
                      onClick={() => handleCancelSchedule(item.id)}
                      disabled={cancelScheduleMutation.isPending}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      title="Cancel schedule"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
