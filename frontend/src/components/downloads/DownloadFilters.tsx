import { Search, Play, Pause } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DownloadFiltersProps {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onPauseAll: () => void
  onResumeAll: () => void
}

export default function DownloadFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onPauseAll,
  onResumeAll,
}: DownloadFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-2 px-1">
      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-5"
          />
        </div>

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
          <TabsList className="bg-[#111625]/60 border border-[#222533] rounded-xl p-1 h-auto">
            <TabsTrigger
              value="all"
              className="rounded-lg py-1.5 px-3 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-lg py-1.5 px-3 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="waiting"
              className="rounded-lg py-1.5 px-3 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
            >
              Waiting
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-lg py-1.5 px-3 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="failed"
              className="rounded-lg py-1.5 px-3 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
            >
              Failed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl py-4.5 px-4 font-semibold text-xs gap-1.5 cursor-pointer"
          onClick={onPauseAll}
        >
          <Pause className="w-3.5 h-3.5" />
          Pause All
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl py-4.5 px-4 font-semibold text-xs gap-1.5 cursor-pointer"
          onClick={onResumeAll}
        >
          <Play className="w-3.5 h-3.5" />
          Resume All
        </Button>
      </div>
    </div>
  )
}
