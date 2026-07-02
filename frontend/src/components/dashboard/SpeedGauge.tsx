import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useDownloadStats } from '@/hooks/use-downloads'
import { formatSpeed } from '@/lib/utils'

export default function SpeedGauge() {
  const { data: stats } = useDownloadStats()

  return (
    <Card className="glass border-[#222533] overflow-hidden flex flex-col justify-center min-h-[175px]">
      <CardContent className="p-6 grid grid-cols-2 gap-4 divide-x divide-[#222533]">
        {/* Download Speed */}
        <div className="flex items-center gap-4 pl-2">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
            <ArrowDownCircle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Download Speed</span>
            <span className="text-xl md:text-2xl font-black text-white font-mono leading-tight tracking-tight mt-0.5 block">
              {formatSpeed(stats?.download_speed || 0)}
            </span>
          </div>
        </div>

        {/* Upload Speed */}
        <div className="flex items-center gap-4 pl-6">
          <div className="p-3 rounded-2xl bg-[#4f46e5]/15 text-[#818cf8] border border-[#4f46e5]/20">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Upload Speed</span>
            <span className="text-xl md:text-2xl font-black text-white font-mono leading-tight tracking-tight mt-0.5 block">
              {formatSpeed(stats?.upload_speed || 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
