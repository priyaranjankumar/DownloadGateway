import { Globe, RefreshCw, Compass } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentIP } from '@/hooks/use-vpn'

export default function IPInfo() {
  const { data: ipInfo, isLoading, refetch, isRefetching } = useCurrentIP()

  return (
    <Card className="glass border-[#222533] flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Public IP Info
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Public visibility details</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg hover:bg-[#1a1f2e] text-slate-500 hover:text-white cursor-pointer"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-center min-h-[180px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-xs text-slate-500 font-semibold h-full">
            <div className="w-6 h-6 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin mb-2" />
            Locating...
          </div>
        ) : !ipInfo ? (
          <div className="text-center py-6 text-slate-500 text-xs h-full flex flex-col items-center justify-center">
            <Compass className="w-8 h-8 mb-2" />
            Unable to fetch IP info
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* IP Address */}
            <div className="text-center py-4 bg-[#0c101d]/60 border border-[#222533]/40 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Observed Address</span>
              <span className="text-xl md:text-2xl font-black text-white font-mono tracking-tight mt-0.5 block">
                {ipInfo.ip}
              </span>
            </div>

            {/* Meta details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="py-2.5 px-3.5 rounded-xl bg-[#0c101d]/30 border border-[#222533]/20">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Country / City</span>
                <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                  {ipInfo.country ? `${ipInfo.country} (${ipInfo.city || 'N/A'})` : 'Unknown'}
                </span>
              </div>
              <div className="py-2.5 px-3.5 rounded-xl bg-[#0c101d]/30 border border-[#222533]/20">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">ISP Provider</span>
                <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                  {ipInfo.provider || 'ISP Unknown'}
                </span>
              </div>
              <div className="py-2.5 px-3.5 rounded-xl bg-[#0c101d]/30 border border-[#222533]/20 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Autonomous System (ASN)</span>
                <span className="font-semibold text-slate-200 mt-0.5 block truncate font-mono">
                  {ipInfo.asn || 'AS0000'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
