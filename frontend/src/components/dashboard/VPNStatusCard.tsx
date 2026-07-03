import { useState } from 'react'
import { Shield, ShieldCheck, ShieldOff, ArrowDownUp, Server, Globe, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useVPNStatus, useVPNConnect, useVPNDisconnect, useVPNServers } from '@/hooks/use-vpn'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function VPNStatusCard() {
  const { data: vpn, isLoading: statusLoading, refetch } = useVPNStatus()
  const { data: servers } = useVPNServers()
  const connectMutation    = useVPNConnect()
  const disconnectMutation = useVPNDisconnect()
  const [selectedServer, setSelectedServer] = useState<string>('')

  const isTransitioning = connectMutation.isPending || disconnectMutation.isPending
  const connected = vpn?.connected ?? false

  const handleConnect = async () => {
    const target = selectedServer || servers?.[0]?.id
    if (!target) {
      toast.error('No VPN server configurations found')
      return
    }
    toast.promise(connectMutation.mutateAsync(target), {
      loading: 'Initiating VPN tunnel…',
      success: '🔒 VPN Tunnel established!',
      error:   (err) => `VPN failed: ${err.message}`,
    })
  }

  const handleDisconnect = async () => {
    toast.promise(disconnectMutation.mutateAsync(), {
      loading: 'Tearing down tunnel…',
      success: 'VPN Disconnected',
      error:   (err) => `Disconnect failed: ${err.message}`,
    })
  }

  return (
    <Card className="relative overflow-hidden flex flex-col h-full">
      {/* Ambient glow behind card */}
      <div
        className="absolute inset-0 pointer-events-none opacity-100"
        style={{
          background: connected
            ? 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.68 0.17 155 / 0.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.58 0.22 22 / 0.07) 0%, transparent 70%)',
          transition: 'background 0.5s ease',
        }}
      />

      <CardHeader className="flex flex-row items-center justify-between pb-0 relative">
        <div>
          <CardTitle className="flex items-center gap-2.5 text-sm">
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: connected
                  ? 'oklch(0.68 0.17 155 / 0.14)'
                  : 'oklch(0.58 0.22 22 / 0.14)',
                border: `1px solid ${connected
                  ? 'oklch(0.68 0.17 155 / 0.28)'
                  : 'oklch(0.58 0.22 22 / 0.28)'}`,
              }}
            >
              {connected
                ? <ShieldCheck className="w-4 h-4" style={{ color: 'oklch(0.72 0.17 155)' }} />
                : <ShieldOff   className="w-4 h-4" style={{ color: 'oklch(0.65 0.22 22)' }} />
              }
            </div>
            VPN Gateway
          </CardTitle>
          <CardDescription>Surfshark WireGuard</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* Status badge */}
          <div
            className={cn(
              'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider select-none',
            )}
            style={connected
              ? { background:'oklch(0.68 0.17 155 / 0.12)', color:'oklch(0.72 0.17 155)', border:'1px solid oklch(0.68 0.17 155 / 0.28)' }
              : { background:'oklch(0.58 0.22 22 / 0.12)',  color:'oklch(0.65 0.22 22)',  border:'1px solid oklch(0.58 0.22 22 / 0.28)' }
            }
          >
            {statusLoading ? 'Polling…' : connected ? 'Active' : 'Inactive'}
          </div>

          {/* Pulse dot */}
          <div
            className={cn('w-2 h-2 rounded-full', connected ? 'glow-connected' : 'bg-rose-500/80')}
          />

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="w-7 h-7 rounded-lg cursor-pointer"
            style={{ color: 'oklch(0.50 0.04 255)' }}
          >
            <RefreshCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-4 relative">
        {/* Stats grid */}
        <div
          className="grid grid-cols-2 gap-2 p-3 rounded-xl text-xs"
          style={{
            background: 'oklch(0.09 0.018 255 / 0.65)',
            border: '1px solid oklch(0.22 0.03 255 / 0.45)',
          }}
        >
          <Stat
            label="Location"
            value={connected ? `${vpn?.country ?? ''} – ${vpn?.city ?? ''}` : 'No tunnel'}
            icon={<Globe className="w-3.5 h-3.5" />}
          />
          <Stat
            label="Exit IP"
            value={connected ? vpn?.public_ip ?? 'Fetching…' : 'ISP IP'}
            icon={<Server className="w-3.5 h-3.5" />}
            mono
          />
          <Stat
            label="RX / TX"
            value={connected ? `${vpn?.transfer_rx ?? '0 B'} / ${vpn?.transfer_tx ?? '0 B'}` : '—'}
            icon={<ArrowDownUp className="w-3.5 h-3.5" />}
          />
          <Stat
            label="Protocol"
            value={vpn?.protocol ?? 'WireGuard'}
            icon={<Shield className="w-3.5 h-3.5" />}
          />
        </div>

        {/* Server selection */}
        {!connected && servers && servers.length > 0 && (
          <div className="space-y-1.5">
            <label
              className="text-[10px] font-bold uppercase tracking-widest block"
              style={{ color: 'oklch(0.45 0.04 255)' }}
            >
              Select Server
            </label>
            <Select value={selectedServer} onValueChange={(v) => setSelectedServer(v || '')}>
              <SelectTrigger
                className="w-full rounded-xl text-sm"
                style={{
                  background: 'oklch(0.12 0.018 255 / 0.65)',
                  border: '1px solid oklch(0.26 0.04 255 / 0.55)',
                  color: 'oklch(0.82 0.015 255)',
                }}
              >
                <SelectValue placeholder="Choose server…" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((srv) => (
                  <SelectItem key={srv.id} value={srv.id} className="cursor-pointer">
                    {srv.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Action button */}
        <div className="mt-auto">
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={isTransitioning}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'oklch(0.58 0.22 22 / 0.14)',
                border: '1px solid oklch(0.58 0.22 22 / 0.35)',
                color: 'oklch(0.65 0.20 22)',
                boxShadow: '0 4px 16px oklch(0.58 0.22 22 / 0.15)',
              }}
            >
              {isTransitioning ? 'Disconnecting…' : 'Disconnect VPN'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isTransitioning || !servers || servers.length === 0}
              className="btn-brand w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {isTransitioning ? 'Connecting…' : 'Connect VPN'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  icon,
  mono,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'oklch(0.42 0.04 255)' }}
      >
        {icon}
        {label}
      </div>
      <p
        className={`text-xs font-semibold truncate ${mono ? 'font-mono' : ''}`}
        style={{ color: 'oklch(0.85 0.015 255)' }}
      >
        {value}
      </p>
    </div>
  )
}
