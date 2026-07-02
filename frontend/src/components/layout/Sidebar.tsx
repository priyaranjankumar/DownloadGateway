import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Download,
  Shield,
  FolderOpen,
  Terminal,
  Settings,
  ArrowDownToLine,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVPNStatus } from '@/hooks/use-vpn'
import { ROUTES } from '@/lib/constants'

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export default function Sidebar({ className, onClose }: SidebarProps) {
  const { data: vpn } = useVPNStatus()

  const navItems = [
    { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Downloads', to: ROUTES.DOWNLOADS, icon: Download },
    { name: 'VPN Manager', to: ROUTES.VPN, icon: Shield },
    { name: 'File Browser', to: ROUTES.FILES, icon: FolderOpen },
    { name: 'Live Logs', to: ROUTES.LOGS, icon: Terminal },
    { name: 'Settings', to: ROUTES.SETTINGS, icon: Settings },
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-screen w-64 glass border-r border-[#222533] text-slate-300',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#222533]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-[#4f46e5] to-[#7c3aed]">
          <ArrowDownToLine className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-white tracking-wide text-sm">GATEWAY</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#7c3aed]" /> download hub
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group hover:text-white',
                  isActive
                    ? 'bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/10 text-white border-l-2 border-[#4f46e5] pl-3'
                    : 'hover:bg-[#1a1f2e]/60 text-slate-400'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform group-hover:scale-110 duration-200',
                      isActive ? 'text-[#818cf8]' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* VPN Status Box at Bottom */}
      <div className="p-4 border-t border-[#222533] bg-[#0c101d]/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#111625] border border-[#222533]">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              vpn?.connected
                ? 'bg-emerald-500 glow-connected'
                : 'bg-rose-500'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {vpn?.connected ? 'VPN Connected' : 'VPN Disconnected'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {vpn?.connected ? vpn.server_name || vpn.server_id : 'Protection inactive'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
