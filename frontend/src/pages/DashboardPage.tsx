import VPNStatusCard from '@/components/dashboard/VPNStatusCard'
import SpeedGauge from '@/components/dashboard/SpeedGauge'
import SystemMetrics from '@/components/dashboard/SystemMetrics'
import ActiveDownloads from '@/components/dashboard/ActiveDownloads'
import SpeedChart from '@/components/dashboard/SpeedChart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Overview stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speed indicators (Download / Upload) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SpeedGauge />
          <SpeedChart />
        </div>

        {/* VPN connection manager card */}
        <div className="flex flex-col h-full">
          <VPNStatusCard />
        </div>
      </div>

      {/* System hardware resources usage gauges */}
      <SystemMetrics />

      {/* Active running tasks summary */}
      <div className="grid grid-cols-1 gap-6">
        <ActiveDownloads />
      </div>
    </div>
  )
}
