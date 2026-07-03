import { ArrowDownCircle, ArrowUpCircle, Activity, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useDownloadStats } from '@/hooks/use-downloads'
import { useSystemStats } from '@/hooks/use-system'
import { formatSpeed, formatUptime } from '@/lib/utils'

export default function SpeedGauge() {
  const { data: stats } = useDownloadStats()
  const { data: sys } = useSystemStats()

  const downloadSpeed = stats?.download_speed ?? 0
  const uploadSpeed   = stats?.upload_speed   ?? 0
  const activeCount   = stats?.num_active      ?? 0
  const uptime        = sys ? formatUptime(sys.uptime ?? 0) : '—'

  return (
    <Card className="overflow-hidden min-h-[160px]">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.07]">

          {/* ── Download ── */}
          <div className="flex flex-col justify-center p-5 group">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: 'oklch(0.68 0.17 155 / 0.12)',
                  border: '1px solid oklch(0.68 0.17 155 / 0.22)',
                }}
              >
                <ArrowDownCircle
                  className="w-4 h-4"
                  style={{ color: 'oklch(0.72 0.17 155)' }}
                />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'oklch(0.48 0.04 255)' }}
              >
                Download
              </span>
            </div>
            <div className="font-black font-mono tabular-nums leading-none" style={{ fontSize: '1.6rem' }}>
              <span className="text-gradient-speed">{formatSpeed(downloadSpeed)}</span>
            </div>
            <div
              className="mt-1.5 text-[10px] font-semibold"
              style={{ color: 'oklch(0.40 0.04 255)' }}
            >
              {activeCount} active task{activeCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* ── Upload ── */}
          <div className="flex flex-col justify-center p-5 group">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: 'oklch(0.58 0.24 270 / 0.12)',
                  border: '1px solid oklch(0.58 0.24 270 / 0.22)',
                }}
              >
                <ArrowUpCircle
                  className="w-4 h-4"
                  style={{ color: 'oklch(0.70 0.20 270)' }}
                />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'oklch(0.48 0.04 255)' }}
              >
                Upload
              </span>
            </div>
            <div className="font-black font-mono tabular-nums leading-none" style={{ fontSize: '1.6rem' }}>
              <span className="text-gradient-brand">{formatSpeed(uploadSpeed)}</span>
            </div>
            <div
              className="mt-1.5 text-[10px] font-semibold"
              style={{ color: 'oklch(0.40 0.04 255)' }}
            >
              seeding ratio
            </div>
          </div>

          {/* ── Active Tasks ── */}
          <div
            className="flex flex-col justify-center p-5"
            style={{ background: 'oklch(0.10 0.016 255 / 0.40)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: 'oklch(0.75 0.16 80 / 0.12)',
                  border: '1px solid oklch(0.75 0.16 80 / 0.22)',
                }}
              >
                <Activity className="w-4 h-4" style={{ color: 'oklch(0.75 0.16 80)' }} />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'oklch(0.48 0.04 255)' }}
              >
                Active
              </span>
            </div>
            <div
              className="font-black tabular-nums leading-none animate-count-in"
              style={{ fontSize: '2rem', color: 'oklch(0.93 0.010 255)' }}
            >
              {activeCount}
            </div>
            <div
              className="mt-1.5 text-[10px] font-semibold"
              style={{ color: 'oklch(0.40 0.04 255)' }}
            >
              {activeCount === 0 ? 'queue empty' : `task${activeCount !== 1 ? 's' : ''} running`}
            </div>
          </div>

          {/* ── Uptime ── */}
          <div
            className="flex flex-col justify-center p-5"
            style={{ background: 'oklch(0.10 0.016 255 / 0.40)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: 'oklch(0.63 0.18 300 / 0.12)',
                  border: '1px solid oklch(0.63 0.18 300 / 0.22)',
                }}
              >
                <Clock className="w-4 h-4" style={{ color: 'oklch(0.68 0.16 300)' }} />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'oklch(0.48 0.04 255)' }}
              >
                Uptime
              </span>
            </div>
            <div
              className="font-black font-mono tabular-nums leading-none animate-count-in"
              style={{ fontSize: '1.5rem', color: 'oklch(0.93 0.010 255)' }}
            >
              {uptime}
            </div>
            <div
              className="mt-1.5 text-[10px] font-semibold"
              style={{ color: 'oklch(0.40 0.04 255)' }}
            >
              since last boot
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
