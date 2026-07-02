import { Cpu, HardDrive, CpuIcon, Thermometer, Clock, Network } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSystemStats } from '@/hooks/use-system'
import { formatBytes, formatUptime } from '@/lib/utils'

export default function SystemMetrics() {
  const { data: stats } = useSystemStats()

  const metrics = [
    {
      name: 'CPU Load',
      value: `${stats?.cpu_percent || 0}%`,
      sub: `${stats?.cpu_count || 1} Cores`,
      progress: stats?.cpu_percent || 0,
      icon: Cpu,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500',
    },
    {
      name: 'RAM Memory',
      value: formatBytes(stats?.ram_used || 0, 1),
      sub: `of ${formatBytes(stats?.ram_total || 0, 0)}`,
      progress: stats?.ram_percent || 0,
      icon: CpuIcon,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500',
    },
    {
      name: 'Disk Storage',
      value: formatBytes(stats?.disk_used || 0, 1),
      sub: `of ${formatBytes(stats?.disk_total || 0, 0)}`,
      progress: stats?.disk_percent || 0,
      icon: HardDrive,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <Card key={m.name} className="glass border-[#222533]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-[#111625] border border-[#222533] ${m.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-semibold">{m.name}</span>
                    <span className="text-lg font-black text-white leading-tight font-mono tracking-tight">
                      {m.value}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-bold">{m.sub}</span>
              </div>
              <div className="space-y-1">
                <Progress value={m.progress} className="h-2 bg-[#121624] [&>div]:bg-gradient-to-r [&>div]:from-[#4f46e5] [&>div]:to-[#7c3aed]" />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>USED</span>
                  <span>{m.progress.toFixed(0)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Extra Info Grid (Uptime, Temp, Load) */}
      <Card className="glass border-[#222533] md:col-span-3">
        <CardContent className="p-4 grid grid-cols-3 gap-4 text-center divide-x divide-[#222533] text-xs">
          {/* Uptime */}
          <div className="flex flex-col items-center justify-center space-y-1 py-1">
            <Clock className="w-4 h-4 text-slate-500 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Uptime</span>
            <span className="font-semibold text-slate-300 font-mono">
              {formatUptime(stats?.uptime || 0)}
            </span>
          </div>

          {/* CPU Temperature */}
          <div className="flex flex-col items-center justify-center space-y-1 py-1 pl-4">
            <Thermometer className="w-4 h-4 text-slate-500 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">CPU Temp</span>
            <span className="font-semibold text-slate-300 font-mono">
              {stats?.cpu_temp ? `${stats.cpu_temp.toFixed(1)}°C` : 'N/A'}
            </span>
          </div>

          {/* Load Average */}
          <div className="flex flex-col items-center justify-center space-y-1 py-1 pl-4">
            <Network className="w-4 h-4 text-slate-500 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Load Average</span>
            <span className="font-semibold text-slate-300 font-mono">
              {stats?.load_avg ? stats.load_avg.map(l => l.toFixed(2)).join(', ') : '0.00, 0.00, 0.00'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
