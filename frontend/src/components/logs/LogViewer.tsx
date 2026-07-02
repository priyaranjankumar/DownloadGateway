import { useEffect, useState, useRef } from 'react'
import { Terminal, RefreshCw, Scroll, Shield, AppWindow } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function LogViewer() {
  const [source, setSource] = useState<string>('aria2')
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)
  const [filterText, setFilterText] = useState('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async (isManual = false) => {
    if (isManual) setIsRefetching(true)
    else setIsLoading(true)

    try {
      const { data } = await api.get<string[]>(`/logs/${source}`, {
        params: { lines: 150 },
      })
      setLogs(data)
    } catch (err: any) {
      toast.error(`Failed to load ${source} logs: ${err.message}`)
    } finally {
      setIsLoading(false)
      setIsRefetching(false)
    }
  }

  // Poll logs every 5 seconds
  useEffect(() => {
    fetchLogs()
    const timer = setInterval(() => fetchLogs(), 5000)
    return () => clearInterval(timer)
  }, [source])

  // Auto scroll to bottom when new logs load
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // Filter logic
  const filteredLogs = logs.filter((line) =>
    line.toLowerCase().includes(filterText.toLowerCase())
  )

  const sources = [
    { id: 'aria2', name: 'Aria2 Engine', icon: Scroll },
    { id: 'backend', name: 'Gateway Backend', icon: AppWindow },
    { id: 'wireguard', name: 'WireGuard VPN', icon: Shield },
    { id: 'system', name: 'Host System', icon: Terminal },
  ]

  return (
    <Card className="glass border-[#222533] flex flex-col h-[calc(100vh-12rem)] w-full">
      <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#222533]/50 pb-4 gap-4">
        <div>
          <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Diagnostic Logs
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Live tail summaries of appliance processes
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {/* Quick filter input */}
          <input
            placeholder="Filter logs..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-[#111625]/60 border border-[#222533] text-slate-200 rounded-xl px-3 text-xs focus:ring-1 focus:ring-[#4f46e5] focus:outline-none w-full sm:w-44"
          />
          <Button
            variant="outline"
            size="icon"
            className="w-9 h-9 rounded-xl border-[#222533] hover:bg-[#1a1f2e] text-slate-500 hover:text-white cursor-pointer shrink-0"
            onClick={() => fetchLogs(true)}
            disabled={isLoading || isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        {/* Source switchers */}
        <div className="border-b border-[#222533]/40 p-4 bg-[#0c101d]/20">
          <Tabs value={source} onValueChange={setSource} className="w-full">
            <TabsList className="bg-[#111625]/60 border border-[#222533] rounded-xl p-1 h-auto w-full grid grid-cols-2 md:grid-cols-4 gap-1">
              {sources.map((src) => {
                const Icon = src.icon
                return (
                  <TabsTrigger
                    key={src.id}
                    value={src.id}
                    className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {src.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Logs Output Console */}
        <div className="flex-1 bg-[#060913] p-6 font-mono text-[11px] leading-relaxed overflow-y-auto text-slate-400 select-text" ref={logContainerRef}>
          {isLoading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <div className="w-6 h-6 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin mb-3" />
              Opening log channel...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-700 italic select-none">
              {filterText ? 'No matching logs found' : 'Console buffer empty'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((line, idx) => {
                let colorClass = 'text-slate-400'
                if (line.includes('ERROR') || line.includes('error') || line.includes('ERR')) colorClass = 'text-rose-400 font-semibold'
                else if (line.includes('WARN') || line.includes('warning') || line.includes('WRN')) colorClass = 'text-amber-400'
                else if (line.includes('INFO') || line.includes('info')) colorClass = 'text-slate-300'
                
                return (
                  <div key={idx} className={`${colorClass} whitespace-pre-wrap break-all`}>
                    <span className="text-slate-600 mr-3.5 select-none">{String(idx + 1).padStart(3, '0')}</span>
                    {line}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
