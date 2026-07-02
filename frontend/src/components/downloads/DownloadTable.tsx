import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import DownloadRow from './DownloadRow'
import { DownloadInfo } from '@/types/downloads'
import { Inbox } from 'lucide-react'

interface DownloadTableProps {
  downloads: DownloadInfo[]
}

export default function DownloadTable({ downloads }: DownloadTableProps) {
  if (downloads.length === 0) {
    return (
      <Card className="glass border-[#222533] py-12">
        <CardContent className="flex flex-col items-center justify-center text-center text-slate-500">
          <Inbox className="w-12 h-12 text-slate-600 mb-3 stroke-[1.2]" />
          <h4 className="text-sm font-bold text-slate-300">No downloads found</h4>
          <p className="text-xs max-w-xs mt-1">There are no tasks that match your current filter selection or search query.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-[#222533] overflow-hidden">
      <ScrollArea className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-[#222533] bg-[#0c101d]/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Progress</th>
              <th className="px-6 py-4">Speed</th>
              <th className="px-6 py-4">ETA</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222533]/40 bg-transparent">
            {downloads.map((d, index) => (
              <DownloadRow
                key={d.gid}
                download={d}
                index={index}
                totalCount={downloads.length}
              />
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </Card>
  )
}
