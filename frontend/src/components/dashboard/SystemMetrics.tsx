import { Cpu, HardDrive, CpuIcon, Thermometer, Clock, Network } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSystemStats } from '@/hooks/use-system'
import { formatBytes, formatUptime } from '@/lib/utils'

interface MetricConfig {
  name: string
  value: string
  sub?: string
  progress: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  glow: string
  progressClass: string
}

function MetricCard({ m }: { m: MetricConfig }) {
  const Icon = m.icon
  const pct = Math.min(m.progress, 100)

  // Dynamic color for high usage
  const isWarning = pct > 75
  const isCritical = pct > 90

  return (
    <Card className="overflow-hidden group">
      <CardContent className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ background: m.color, border: `1px solid ${m.glow}` }}
            >
              <Icon className="w-[18px] h-[18px]" style={{ color: m.glow.replace('/ 0.22', '') }} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: 'oklch(0.48 0.04 255)' }}
              >
                {m.name}
              </p>
              {m.sub && (
                <p className="text-[11px] font-medium" style={{ color: 'oklch(0.55 0.04 255)' }}>
                  {m.sub}
                </p>
              )}
            </div>
          </div>

          {/* Big percentage/value */}
          <div
            className="text-right font-black font-mono tabular-nums leading-none"
            style={{
              fontSize: '1.55rem',
              color: isCritical
                ? 'oklch(0.65 0.22 22)'
                : isWarning
                ? 'oklch(0.75 0.16 75)'
                : 'oklch(0.93 0.010 255)',
              textShadow: isCritical
                ? '0 0 20px oklch(0.65 0.22 22 / 0.35)'
                : undefined,
            }}
          >
            {m.value}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <Progress
            value={pct}
            className={`h-1.5 ${m.progressClass}`}
          />
          <div className="flex justify-between items-center">
            <div
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: 'oklch(0.38 0.04 255)' }}
            >
              {isCritical ? '⚠ Critical' : isWarning ? '△ High' : 'Normal'}
            </div>
            <div
              className="text-[10px] font-mono font-bold"
              style={{ color: 'oklch(0.55 0.04 255)' }}
            >
              {pct.toFixed(0)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SystemMetrics() {
  const { data: stats } = useSystemStats()

  const metrics: MetricConfig[] = [
    {
      name: 'CPU Load',
      value: `${(stats?.cpu_percent ?? 0).toFixed(1)}%`,
      sub: `${stats?.cpu_count ?? 1} Cores`,
      progress: stats?.cpu_percent ?? 0,
      icon: Cpu,
      color: 'oklch(0.58 0.24 270 / 0.12)',
      glow: 'oklch(0.62 0.22 270 / 0.22)',
      progressClass: 'progress-brand',
    },
    {
      name: 'RAM Memory',
      value: formatBytes(stats?.ram_used ?? 0, 1),
      sub: `of ${formatBytes(stats?.ram_total ?? 0, 0)}`,
      progress: stats?.ram_percent ?? 0,
      icon: CpuIcon,
      color: 'oklch(0.65 0.16 220 / 0.12)',
      glow: 'oklch(0.68 0.14 220 / 0.22)',
      progressClass: 'progress-sky',
    },
    {
      name: 'Disk Storage',
      value: formatBytes(stats?.disk_used ?? 0, 1),
      sub: `of ${formatBytes(stats?.disk_total ?? 0, 0)}`,
      progress: stats?.disk_percent ?? 0,
      icon: HardDrive,
      color: 'oklch(0.68 0.17 155 / 0.12)',
      glow: 'oklch(0.70 0.17 155 / 0.22)',
      progressClass: 'progress-green',
    },
  ]

  return (
    <div className="space-y-4">
      {/* Main 3-column metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <MetricCard key={m.name} m={m} />
        ))}
      </div>

      {/* Extra info strip: Uptime · CPU Temp · Load Avg */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x divide-white/[0.07]">

            {/* Uptime */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  background: 'oklch(0.63 0.18 300 / 0.12)',
                  border: '1px solid oklch(0.63 0.18 300 / 0.20)',
                }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: 'oklch(0.68 0.16 300)' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.45 0.04 255)' }}>
                  Uptime
                </p>
                <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'oklch(0.88 0.012 255)' }}>
                  {formatUptime(stats?.uptime ?? 0)}
                </p>
              </div>
            </div>

            {/* CPU Temp */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  background: 'oklch(0.58 0.22 22 / 0.12)',
                  border: '1px solid oklch(0.58 0.22 22 / 0.20)',
                }}
              >
                <Thermometer className="w-3.5 h-3.5" style={{ color: 'oklch(0.65 0.20 22)' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.45 0.04 255)' }}>
                  CPU Temp
                </p>
                <p className="text-sm font-bold font-mono mt-0.5" style={{ color: 'oklch(0.88 0.012 255)' }}>
                  {stats?.cpu_temp != null ? `${stats.cpu_temp.toFixed(1)}°C` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Load Average */}
            <div className="flex items-center gap-3 px-5 py-3.5">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{
                  background: 'oklch(0.75 0.16 80 / 0.12)',
                  border: '1px solid oklch(0.75 0.16 80 / 0.20)',
                }}
              >
                <Network className="w-3.5 h-3.5" style={{ color: 'oklch(0.75 0.16 80)' }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.45 0.04 255)' }}>
                  Load Avg
                </p>
                <p className="text-xs font-bold font-mono mt-0.5" style={{ color: 'oklch(0.88 0.012 255)' }}>
                  {stats?.load_avg
                    ? stats.load_avg.map((l: number) => l.toFixed(2)).join(' · ')
                    : '— · — · —'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
