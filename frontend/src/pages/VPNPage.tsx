import VPNToggle from '@/components/vpn/VPNToggle'
import ServerList from '@/components/vpn/ServerList'
import IPInfo from '@/components/vpn/IPInfo'
import KillSwitchToggle from '@/components/vpn/KillSwitchToggle'

export default function VPNPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">VPN Manager</h1>
        <p className="text-xs text-slate-500">Configure WireGuard connections, view exit locations, and manage firewall protection.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Toggle & Details */}
        <div className="lg:col-span-2 space-y-6">
          <VPNToggle />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <IPInfo />
            <KillSwitchToggle />
          </div>
        </div>

        {/* Server List */}
        <div className="flex flex-col h-full">
          <ServerList />
        </div>
      </div>
    </div>
  )
}
