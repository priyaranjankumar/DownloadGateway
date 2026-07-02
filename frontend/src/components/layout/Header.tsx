import { useLocation } from 'react-router'
import {
  Shield,
  ShieldAlert,
  LogOut,
  User,
  Globe,
  Menu,
} from 'lucide-react'
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
import { ROUTES } from '@/lib/constants'

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation()
  const { data: vpn } = useVPNStatus()
  const { data: ipInfo } = useCurrentIP()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  // Derive page title from route path
  const getPageTitle = () => {
    switch (location.pathname) {
      case ROUTES.DASHBOARD:
        return 'System Dashboard'
      case ROUTES.DOWNLOADS:
        return 'Downloads Manager'
      case ROUTES.VPN:
        return 'Virtual Private Network'
      case ROUTES.FILES:
        return 'File Browser'
      case ROUTES.LOGS:
        return 'System Logs'
      case ROUTES.SETTINGS:
        return 'Application Settings'
      default:
        return 'Download Gateway'
    }
  }

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#222533] glass z-30 w-full">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-400 hover:text-white"
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold text-white tracking-wide">{getPageTitle()}</h2>
      </div>

      {/* Network & Profile Info */}
      <div className="flex items-center gap-4">
        {/* Public IP Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111625] border border-[#222533] text-xs text-slate-400 font-medium">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500">IP:</span>
          <span className="text-slate-300 font-mono">{ipInfo?.ip || 'Detecting...'}</span>
        </div>

        {/* VPN Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold select-none ${
            vpn?.connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
          }`}
        >
          {vpn?.connected ? (
            <>
              <Shield className="w-4 h-4" />
              <span>VPN: Secure</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>VPN: Unsecured</span>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl hover:bg-[#1a1f2e] text-slate-400 hover:text-white cursor-pointer"
              />
            }
          >
            <User className="w-5 h-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 glass border-[#222533] text-slate-300"
          >
            <DropdownMenuLabel className="text-white font-semibold">
              {user?.username || 'Administrator'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#222533]" />
            <DropdownMenuItem
              onClick={() => (window.location.href = ROUTES.SETTINGS)}
              className="focus:bg-[#1a1f2e] focus:text-white cursor-pointer"
            >
              Account settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#222533]" />
            <DropdownMenuItem
              onClick={logout}
              className="focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer text-rose-400 font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
