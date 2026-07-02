import { Shield, ShieldAlert, Power } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useVPNStatus, useVPNConnect, useVPNDisconnect, useVPNServers } from '@/hooks/use-vpn'
import { toast } from 'sonner'

export default function VPNToggle() {
  const { data: vpn } = useVPNStatus()
  const { data: servers } = useVPNServers()
  const connectMutation = useVPNConnect()
  const disconnectMutation = useVPNDisconnect()

  const isTransitioning = connectMutation.isPending || disconnectMutation.isPending

  const handleToggle = async () => {
    if (vpn?.connected) {
      toast.promise(disconnectMutation.mutateAsync(), {
        loading: 'Tearing down VPN tunnel...',
        success: 'VPN Disconnected',
        error: (err) => `Disconnect failed: ${err.message}`,
      })
    } else {
      const defaultServer = servers && servers[0]?.id
      if (!defaultServer) {
        toast.error('No VPN server configs found. Please add Surfshark WireGuard files.')
        return
      }
      toast.promise(connectMutation.mutateAsync(defaultServer), {
        loading: 'Establishing secure tunnel...',
        success: `VPN Connected!`,
        error: (err) => `Connection failed: ${err.message}`,
      })
    }
  }

  return (
    <Card className="glass border-[#222533] flex flex-col items-center justify-center p-8 min-h-[300px] text-center">
      <CardContent className="space-y-6 flex flex-col items-center justify-center p-0 w-full">
        {/* Large Shield Shield Alert button */}
        <div className="relative">
          <button
            onClick={handleToggle}
            disabled={isTransitioning}
            className={`w-32 h-32 rounded-full border flex items-center justify-center transition-all duration-500 hover:scale-105 shadow-2xl cursor-pointer ${
              vpn?.connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-950/20 hover:shadow-emerald-500/30 glow-connected'
                : 'bg-rose-500/5 text-rose-500 border-rose-500/20 shadow-rose-950/10 hover:shadow-rose-500/20'
            }`}
          >
            {vpn?.connected ? (
              <Shield className="w-16 h-16 stroke-[1.5]" />
            ) : (
              <ShieldAlert className="w-16 h-16 stroke-[1.5] animate-pulse" />
            )}
          </button>
          
          {/* Quick toggle indicator */}
          <div className={`absolute bottom-1 right-1 p-2 rounded-full border text-white ${
            vpn?.connected ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'
          }`}>
            <Power className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text descriptions */}
        <div className="space-y-1">
          <h3 className="text-lg font-black text-white leading-tight">
            {vpn?.connected ? 'VPN is Active' : 'VPN is Inactive'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {vpn?.connected
              ? `Connected via WireGuard protocol to ${vpn.server_name || vpn.server_id}`
              : 'Your connection is unsecured. Torrents are blocked if Kill Switch is active.'}
          </p>
        </div>

        {/* Quick info panel */}
        {vpn?.connected && (
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex gap-4">
            <div>
              <span>Sent:</span> <span className="text-slate-300 font-mono font-semibold ml-1">{vpn.transfer_tx || '0 B'}</span>
            </div>
            <div>
              <span>Recv:</span> <span className="text-slate-300 font-mono font-semibold ml-1">{vpn.transfer_rx || '0 B'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
