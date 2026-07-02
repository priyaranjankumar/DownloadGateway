import { useState } from 'react'
import DownloadFilters from '@/components/downloads/DownloadFilters'
import DownloadTable from '@/components/downloads/DownloadTable'
import AddDownloadDialog from '@/components/downloads/AddDownloadDialog'
import { useDownloads, usePauseAll, useResumeAll } from '@/hooks/use-downloads'

export default function DownloadsPage() {
  const { data: downloads, isLoading } = useDownloads()
  const pauseAllMutation = usePauseAll()
  const resumeAllMutation = useResumeAll()

  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
    </div>
  )
}
