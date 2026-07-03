import { useLocation } from 'react-router'
import { Shield, ShieldAlert, LogOut, User, Globe, Menu, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVPNStatus, useCurrentIP } from '@/hooks/use-vpn'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'
import { useSystemStats } from '@/hooks/use-system'
import { ROUTES } from '@/lib/constants'

interface HeaderProps {
  onMenuToggle: () => void
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.DASHBOARD]:  { title: 'Dashboard',        subtitle: 'Overview of your download gateway' },
  [ROUTES.DOWNLOADS]:  { title: 'Downloads',         subtitle: 'Manage your download queue' },
  [ROUTES.VPN]:        { title: 'VPN Manager',       subtitle: 'WireGuard tunnel control' },
  [ROUTES.FILES]:      { title: 'File Browser',      subtitle: 'Browse downloaded files' },
  [ROUTES.LOGS]:       { title: 'Live Logs',         subtitle: 'Real-time system log streams' },
  [ROUTES.SETTINGS]:   { title: 'Settings',          subtitle: 'Configure your gateway' },
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation()
  const { data: vpn } = useVPNStatus()
  const { data: ipInfo } = useCurrentIP()
  const { data: user } = useCurrentUser()
  const { data: sys } = useSystemStats()
  const logout = useLogout()

  const page = PAGE_TITLES[location.pathname] ?? { title: 'Download Gateway', subtitle: '' }

  return (
    <header className="header-root flex items-center justify-between px-6 h-16 z-30 w-full">
      {/* ── Left: Title ── */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-9 h-9 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.07]"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:block">
          <h2
            className="text-base font-bold leading-none"
            style={{ color: 'oklch(0.96 0.010 255)' }}
          >
            {page.title}
          </h2>
          <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'oklch(0.45 0.04 255)' }}>
            {page.subtitle}
          </p>
        </div>
      </div>

      {/* ── Right: Status Chips + Profile ── */}
      <div className="flex items-center gap-2">

        {/* CPU Load chip */}
        {sys && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: 'oklch(0.16 0.025 260 / 0.70)',
              border: '1px solid oklch(0.28 0.04 260 / 0.45)',
              color: 'oklch(0.72 0.14 300)',
            }}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{sys.cpu_percent?.toFixed(0) ?? '—'}%</span>
          </div>
        )}

        {/* Public IP chip */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: 'oklch(0.14 0.020 255 / 0.65)',
            border: '1px solid oklch(0.26 0.04 255 / 0.45)',
            color: 'oklch(0.62 0.04 255)',
          }}
        >
          <Globe className="w-3.5 h-3.5" style={{ color: 'oklch(0.50 0.04 255)' }} />
          <span className="font-mono tabular-nums" style={{ color: 'oklch(0.82 0.015 255)' }}>
            {ipInfo?.ip ?? '—'}
          </span>
        </div>

        {/* VPN Status pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold select-none"
          style={
            vpn?.connected
              ? {
                  background: 'oklch(0.68 0.17 155 / 0.10)',
                  border: '1px solid oklch(0.68 0.17 155 / 0.28)',
                  color: 'oklch(0.72 0.17 155)',
                }
              : {
                  background: 'oklch(0.58 0.22 22 / 0.10)',
                  border: '1px solid oklch(0.58 0.22 22 / 0.28)',
                  color: 'oklch(0.65 0.20 22)',
                  animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                }
          }
        >
          {vpn?.connected ? (
            <>
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Secure</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exposed</span>
            </>
          )}
        </div>

        {/* ── User Dropdown ── */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl cursor-pointer"
                style={{
                  background: 'oklch(0.15 0.020 260 / 0.65)',
                  border: '1px solid oklch(0.26 0.04 255 / 0.45)',
                  color: 'oklch(0.65 0.04 255)',
                }}
              />
            }
          >
            {/* Avatar initial */}
            <span
              className="text-xs font-bold uppercase"
              style={{ color: 'oklch(0.78 0.15 270)' }}
            >
              {(user?.username ?? 'A')[0]}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 glass-popover"
            style={{ minWidth: '13rem' }}
          >
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5 py-1">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold uppercase shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, oklch(0.56 0.24 270), oklch(0.54 0.22 300))',
                    color: '#fff',
                  }}
                >
                  {(user?.username ?? 'A')[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.username ?? 'Administrator'}</p>
                  <p className="text-[10px]" style={{ color: 'oklch(0.48 0.04 255)' }}>System Admin</p>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => (window.location.href = ROUTES.SETTINGS)}
              className="cursor-pointer text-sm py-2.5 gap-2 rounded-lg"
              style={{ color: 'oklch(0.78 0.03 255)' }}
            >
              <User className="w-4 h-4" />
              Account Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-sm py-2.5 gap-2 rounded-lg font-semibold"
              style={{ color: 'oklch(0.65 0.22 22)' }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
