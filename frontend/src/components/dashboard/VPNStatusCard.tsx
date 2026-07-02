import { useState } from 'react'
import { Shield, ArrowDownUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVPNStatus, useVPNConnect, useVPNDisconnect, useVPNServers } from '@/hooks/use-vpn'
import { toast } from 'sonner'

export default function VPNStatusCard() {
  const { data: vpn, isLoading: statusLoading } = useVPNStatus()
  const { data: servers } = useVPNServers()
  const connectMutation = useVPNConnect()
  const disconnectMutation = useVPNDisconnect()
  const [selectedServer, setSelectedServer] = useState<string>('')

  const isTransitioning = connectMutation.isPending || disconnectMutation.isPending

  const handleConnect = async () => {
    const target = selectedServer || (servers && servers[0]?.id)
    if (!target) {
      toast.error('No VPN server configurations found')
      return
    }
    toast.promise(connectMutation.mutateAsync(target), {
      loading: 'Initiating VPN connection...',
      success: 'VPN Tunnel established!',
      error: (err) => `VPN Connection failed: ${err.message}`,
    })
  }

  const handleDisconnect = async () => {
    toast.promise(disconnectMutation.mutateAsync(), {
      loading: 'Tearing down VPN tunnel...',
      success: 'VPN Disconnected',
      error: (err) => `Disconnect failed: ${err.message}`,
    })
  }

  return (
    <Card className="glass border-[#222533]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
            <Shield className={`w-5 h-5 ${vpn?.connected ? 'text-emerald-400' : 'text-slate-500'}`} />
            VPN Gateway
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Surfshark WireGuard Client</CardDescription>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            vpn?.connected ? 'bg-emerald-500 glow-connected' : 'bg-rose-500'
          }`}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* VPN State Details */}
        <div className="grid grid-cols-2 gap-4 py-2.5 px-3.5 rounded-xl bg-[#0c101d]/60 border border-[#222533]/40 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Current Status</span>
            <span className={`font-semibold ${vpn?.connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {statusLoading ? 'Polling...' : vpn?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Exit Location</span>
            <span className="font-semibold text-slate-200 truncate block">
              {vpn?.connected ? `${vpn.country} – ${vpn.city}` : 'No Protection'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Exit IP</span>
            <span className="font-mono text-xs text-slate-300 block font-semibold truncate">
              {vpn?.connected ? vpn.public_ip || 'Fetching...' : 'ISP Address'}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Transfer (Rx/Tx)</span>
            <span className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
              {vpn?.connected ? `${vpn.transfer_rx || '0 B'} / ${vpn.transfer_tx || '0 B'}` : '--'}
            </span>
          </div>
        </div>

        {/* Server Selection & Action Button */}
        <div className="space-y-3 pt-2">
          {!vpn?.connected && servers && servers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Select VPN Server
              </label>
              <Select value={selectedServer} onValueChange={(val) => setSelectedServer(val || '')}>
                <SelectTrigger className="w-full bg-[#111625]/60 border-[#222533] text-slate-300 rounded-xl focus:ring-[#4f46e5]">
                  <SelectValue placeholder="Choose server..." />
                </SelectTrigger>
                <SelectContent className="glass border-[#222533] text-slate-300 max-h-60">
                  {servers.map((srv) => (
                    <SelectItem
                      key={srv.id}
                      value={srv.id}
                      className="focus:bg-[#1a1f2e] focus:text-white cursor-pointer"
                    >
                      {srv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            {vpn?.connected ? (
              <Button
                variant="destructive"
                className="w-full rounded-xl py-5 font-semibold text-sm shadow-lg shadow-rose-950/20 hover:shadow-rose-950/40 cursor-pointer"
                onClick={handleDisconnect}
                disabled={isTransitioning}
              >
                Disconnect VPN
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl py-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-sm shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 cursor-pointer"
                onClick={handleConnect}
                disabled={isTransitioning || !servers || servers.length === 0}
              >
                Connect VPN
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
