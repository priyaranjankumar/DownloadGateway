import { Globe, Server } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useVPNServers, useVPNStatus, useVPNConnect } from '@/hooks/use-vpn'
import { toast } from 'sonner'

export default function ServerList() {
  const { data: servers, isLoading } = useVPNServers()
  const { data: vpn } = useVPNStatus()
  const connectMutation = useVPNConnect()

  // Helper to get country flag emoji
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return '🌐'
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const handleSelectServer = async (serverId: string, serverName: string) => {
    if (vpn?.connected && vpn.server_id === serverId) return

    toast.promise(connectMutation.mutateAsync(serverId), {
      loading: `Switching VPN server to ${serverName}...`,
      success: `VPN connected to ${serverName}`,
      error: (err) => `Failed to connect to ${serverName}: ${err.message}`,
    })
  }

  return (
    <Card className="glass border-[#222533] flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          VPN Servers
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Available locations parsed from /etc/wireguard/configs/
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 h-full text-xs text-slate-500 font-semibold">
            <div className="w-8 h-8 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin mb-3" />
            Scanning configs...
          </div>
        ) : !servers || servers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full">
            <Globe className="w-10 h-10 text-slate-600 mb-2 stroke-[1.2]" />
            <p className="text-sm font-semibold text-slate-400">No servers found</p>
            <p className="text-[11px] max-w-[200px] mt-1 leading-normal">
              Copy Surfshark config files into <code className="font-mono bg-[#111625] px-1 py-0.5 rounded text-slate-400 text-[10px]">/etc/wireguard/configs/</code> to list endpoints.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[360px] px-6 py-2">
            <div className="space-y-1.5 pb-4">
              {servers.map((srv) => {
                const isActive = vpn?.connected && vpn.server_id === srv.id
                return (
                  <button
                    key={srv.id}
                    onClick={() => handleSelectServer(srv.id, srv.name)}
                    disabled={connectMutation.isPending}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/10 text-white border-[#4f46e5] font-semibold pl-4'
                        : 'bg-[#111625]/20 hover:bg-[#111625]/60 border-[#222533]/40 hover:border-[#222533] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl" role="img" aria-label={srv.country}>
                        {getFlagEmoji(srv.country_code)}
                      </span>
                      <div>
                        <span className="text-xs font-semibold block">{srv.city || srv.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">
                          {srv.country_code || 'CONFIG'}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 glow-connected" />
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
