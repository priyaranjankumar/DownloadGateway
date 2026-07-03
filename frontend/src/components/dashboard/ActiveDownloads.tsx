import { Link } from 'react-router'
import { Download, ArrowRight, Inbox, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useDownloads } from '@/hooks/use-downloads'
import { formatBytes, formatSpeed } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

export default function ActiveDownloads() {
  const { data: downloads, isLoading } = useDownloads()

  const activeItems = (downloads ?? [])
    .filter((d) => d.status === 'active' || d.status === 'waiting')
    .slice(0, 5)

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" style={{ color: 'oklch(0.70 0.20 270)' }} />
            Active Tasks
          </CardTitle>
          <CardDescription>Currently executing downloads</CardDescription>
        </div>

        <Link
          to={ROUTES.DOWNLOADS}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-all"
          style={{
            color: 'oklch(0.70 0.20 270)',
            background: 'oklch(0.58 0.24 270 / 0.10)',
            border: '1px solid oklch(0.58 0.24 270 / 0.22)',
          }}
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 min-h-[200px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'oklch(0.58 0.24 270)' }} />
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'oklch(0.14 0.020 255 / 0.70)', border: '1px solid oklch(0.24 0.03 255 / 0.45)' }}
            >
              <Inbox className="w-6 h-6" style={{ color: 'oklch(0.42 0.04 255)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'oklch(0.65 0.03 255)' }}>
              Queue is empty
            </p>
            <p className="text-xs mt-1" style={{ color: 'oklch(0.42 0.04 255)' }}>
              Add a URL or magnet link to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map((d) => {
              const pct = d.total_length > 0
                ? Math.min((d.completed_length / d.total_length) * 100, 100)
                : 0

              return (
                <div
                  key={d.gid}
                  className="p-3 rounded-xl space-y-2.5 transition-all duration-150"
                  style={{
                    background: 'oklch(0.09 0.018 255 / 0.65)',
                    border: '1px solid oklch(0.22 0.03 255 / 0.50)',
                  }}
                >
                  {/* Name & speed row */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-semibold truncate flex-1"
                      style={{ color: 'oklch(0.88 0.012 255)' }}
                    >
                      {d.name || 'Unnamed Download'}
                    </span>
                    {d.status === 'active' && (
                      <span
                        className="text-[10px] font-bold font-mono shrink-0"
                        style={{ color: 'oklch(0.70 0.17 155)' }}
                      >
                        ↓ {formatSpeed(d.download_speed)}
                      </span>
                    )}
                    {d.status === 'waiting' && (
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md"
                        style={{
                          color: 'oklch(0.75 0.16 80)',
                          background: 'oklch(0.75 0.16 80 / 0.12)',
                          border: '1px solid oklch(0.75 0.16 80 / 0.25)',
                        }}
                      >
                        Queued
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'oklch(0.17 0.025 255 / 0.80)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: d.status === 'active'
                            ? 'linear-gradient(90deg, oklch(0.60 0.18 155), oklch(0.68 0.17 165))'
                            : 'linear-gradient(90deg, oklch(0.60 0.22 270), oklch(0.62 0.20 290))',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold font-mono">
                      <span style={{ color: 'oklch(0.42 0.04 255)' }}>
                        {pct.toFixed(1)}%
                      </span>
                      <span style={{ color: 'oklch(0.42 0.04 255)' }}>
                        {formatBytes(d.completed_length)} / {formatBytes(d.total_length)}
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
