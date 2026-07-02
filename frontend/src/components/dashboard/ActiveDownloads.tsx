import { Link } from 'react-router'
import { Download, ArrowRight, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useDownloads } from '@/hooks/use-downloads'
import { formatBytes, formatSpeed } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export default function ActiveDownloads() {
  const { data: downloads } = useDownloads()
  
  // Filter active and waiting downloads
  const activeItems = (downloads || []).filter(
    (d) => d.status === 'active' || d.status === 'waiting'
  ).slice(0, 5)

  return (
    <Card className="glass border-[#222533] flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
            <Download className="w-5 h-5 text-[#818cf8]" />
            Active Tasks
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Currently executing downloads</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          render={<Link to={ROUTES.DOWNLOADS} />}
          className="text-slate-400 hover:text-white text-xs gap-1 font-semibold cursor-pointer"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center min-h-[220px]">
        {activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
            <Play className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-400">No active downloads</p>
            <p className="text-xs max-w-[200px] mt-1">Add links or torrent files in the download manager to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeItems.map((d) => {
              const progress = d.total_length > 0 ? (d.completed_length / d.total_length) * 100 : 0
              return (
                <div key={d.gid} className="space-y-1.5 py-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200 truncate max-w-[220px] block">
                      {d.name || 'Unnamed Download'}
                    </span>
                    <span className="font-mono text-slate-400 font-bold shrink-0">
                      {formatSpeed(d.download_speed)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1.5 bg-[#121624]" />
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                      <span className="uppercase">{d.status}</span>
                      <span>
                        {formatBytes(d.completed_length)} / {formatBytes(d.total_length)} ({progress.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
