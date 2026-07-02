import { ShieldAlert, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useKillSwitch, useEnableKillSwitch, useDisableKillSwitch } from '@/hooks/use-vpn'
import { toast } from 'sonner'

export default function KillSwitchToggle() {
  const { data: killswitch, isLoading } = useKillSwitch()
  const enableMutation = useEnableKillSwitch()
  const disableMutation = useDisableKillSwitch()

  const isTransitioning = enableMutation.isPending || disableMutation.isPending

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      toast.promise(enableMutation.mutateAsync(), {
        loading: 'Installing firewall rules...',
        success: 'VPN Kill Switch Enabled',
        error: (err) => `Failed to enable: ${err.message}`,
      })
    } else {
      toast.promise(disableMutation.mutateAsync(), {
        loading: 'Flushing firewall rules...',
        success: 'VPN Kill Switch Disabled (Protection off)',
        error: (err) => `Failed to disable: ${err.message}`,
      })
    }
  }

  return (
    <Card className="glass border-[#222533]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${killswitch?.enabled ? 'text-amber-400' : 'text-slate-500'}`} />
          VPN Kill Switch
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Enforce iptables rules to prevent IP leaks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle option */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c101d]/60 border border-[#222533]/40">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white block">Enable Kill Switch</span>
            <span className="text-[10px] text-slate-500 block">
              Block all outbound WAN traffic when VPN goes down
            </span>
          </div>
          <Switch
            checked={killswitch?.enabled || false}
            onCheckedChange={handleToggle}
            disabled={isLoading || isTransitioning}
            className="data-[state=checked]:bg-[#4f46e5] data-[state=unchecked]:bg-[#121624] cursor-pointer"
          />
        </div>

        {/* Warning card block */}
        <div className="p-3.5 rounded-xl bg-[#111625]/60 border border-[#222533]/40 flex gap-3 text-xs leading-normal">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">How it works</p>
            <p className="text-[11px]">
              When enabled, firewall rules drop all outgoing connections that are not routed through the WireGuard interface (<code className="font-mono bg-[#0c101d] px-1 py-0.2 rounded text-[10px]">wg0</code>). 
            </p>
            <p className="text-[11px] font-medium text-amber-500">
              Access to your local LAN (web UI, SSH, Plex) will remain available.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
