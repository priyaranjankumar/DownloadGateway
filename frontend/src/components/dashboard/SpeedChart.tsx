import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDownloadStats } from '@/hooks/use-downloads'
import { formatBytes } from '@/lib/utils'

interface ChartDataPoint {
  time: string
  download: number
  upload: number
}

const DOWNLOAD_COLOR = 'oklch(0.70 0.17 155)' // emerald
const UPLOAD_COLOR   = 'oklch(0.68 0.20 270)'  // indigo

export default function SpeedChart() {
  const { data: stats } = useDownloadStats()
  const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    if (!stats) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    setDataPoints((prev) => {
      const next = [
        ...prev,
        { time: timeStr, download: stats.download_speed, upload: stats.upload_speed },
      ]
      return next.length > 30 ? next.slice(next.length - 30) : next
    })
  }, [stats])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'oklch(0.13 0.020 255 / 0.94)',
          border: '1px solid oklch(0.28 0.04 260 / 0.55)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px oklch(0.04 0.01 255 / 0.65)',
        }}
      >
        <p className="font-bold mb-1.5" style={{ color: 'oklch(0.48 0.04 255)' }}>
          {label}
        </p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="font-mono font-semibold" style={{ color: entry.stroke }}>
            {entry.name === 'download' ? '↓' : '↑'} {formatBytes(entry.value)}/s
          </p>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" style={{ color: 'oklch(0.68 0.20 270)' }} />
          Network Throughput
        </CardTitle>
        <CardDescription>
          <span className="flex items-center gap-4 mt-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: DOWNLOAD_COLOR }}
              />
              <span>Download</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: UPLOAD_COLOR }}
              />
              <span>Upload</span>
            </span>
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div style={{ height: 220 }}>
          {dataPoints.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full gap-2"
              style={{ color: 'oklch(0.42 0.04 255)' }}
            >
              <Activity className="w-8 h-8 opacity-30 animate-pulse" />
              <p className="text-xs font-medium">Awaiting data stream…</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataPoints} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  {/* Download gradient */}
                  <linearGradient id="gDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={DOWNLOAD_COLOR} stopOpacity={0.30} />
                    <stop offset="100%" stopColor={DOWNLOAD_COLOR} stopOpacity={0}    />
                  </linearGradient>
                  {/* Upload gradient */}
                  <linearGradient id="gUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={UPLOAD_COLOR} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={UPLOAD_COLOR} stopOpacity={0}    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.22 0.03 255 / 0.35)"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  stroke="oklch(0.35 0.04 255)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                  interval="preserveStartEnd"
                  tick={{ fill: 'oklch(0.38 0.04 255)', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <YAxis
                  stroke="oklch(0.35 0.04 255)"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatBytes(v, 0)}
                  tick={{ fill: 'oklch(0.38 0.04 255)', fontFamily: 'JetBrains Mono, monospace' }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="download"
                  name="download"
                  stroke={DOWNLOAD_COLOR}
                  strokeWidth={2}
                  fill="url(#gDownload)"
                  dot={false}
                  activeDot={{ r: 4, fill: DOWNLOAD_COLOR, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  name="upload"
                  stroke={UPLOAD_COLOR}
                  strokeWidth={2}
                  fill="url(#gUpload)"
                  dot={false}
                  activeDot={{ r: 4, fill: UPLOAD_COLOR, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
