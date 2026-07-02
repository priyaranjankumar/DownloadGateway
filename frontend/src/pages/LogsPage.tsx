import LogViewer from '@/components/logs/LogViewer'

export default function LogsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Diagnostic Logs</h1>
        <p className="text-xs text-slate-500">Examine logs from downloads, WireGuard VPN connectivity, and backend tasks.</p>
      </div>

      {/* Log Console Grid */}
      <div className="grid grid-cols-1 gap-6">
        <LogViewer />
      </div>
    </div>
  )
}
