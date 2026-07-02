import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function SpeedChart() {
  const { data: stats } = useDownloadStats()
  const [dataPoints, setDataPoints] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    if (!stats) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    setDataPoints((prev) => {
      const next = [
        ...prev,
        {
          time: timeStr,
          download: stats.download_speed,
          upload: stats.upload_speed,
        },
      ]
      // Maintain maximum of 20 points
      if (next.length > 20) {
        return next.slice(next.length - 20)
      }
      return next
    })
  }, [stats])

  // Custom tooltips formatter to display sizes in B/KB/MB/GB
  const formatTooltipValue = (value: number) => {
    return `${formatBytes(value)}/s`
  }

  return (
    <Card className="glass border-[#222533] w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Real-time Network Speed
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">Live download vs upload throughput</CardDescription>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        {dataPoints.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Awaiting data streams...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222533" opacity={0.5} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatBytes(val, 0)}
              />
              <Tooltip
                contentStyle={{
                  background: 'oklch(0.12 0.02 244)',
                  borderColor: 'oklch(0.22 0.03 244)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                itemStyle={{ padding: '2px 0' }}
                formatter={(val: any) => [formatTooltipValue(val), '']}
              />
              <Area
                type="monotone"
                dataKey="download"
                name="Download"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDownload)"
              />
              <Area
                type="monotone"
                dataKey="upload"
                name="Upload"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUpload)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
