import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Download,
  Shield,
  FolderOpen,
  Terminal,
  Settings,
  ArrowDownToLine,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVPNStatus } from '@/hooks/use-vpn'
import { useDownloadStats } from '@/hooks/use-downloads'
import { ROUTES } from '@/lib/constants'
import { formatSpeed } from '@/lib/utils'

interface SidebarProps {
  className?: string
  onClose?: () => void
}

const navItems = [
  { name: 'Dashboard',    to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Downloads',   to: ROUTES.DOWNLOADS,  icon: Download },
  { name: 'VPN Manager', to: ROUTES.VPN,        icon: Shield },
  { name: 'File Browser',to: ROUTES.FILES,       icon: FolderOpen },
  { name: 'Live Logs',   to: ROUTES.LOGS,        icon: Terminal },
  { name: 'Settings',    to: ROUTES.SETTINGS,    icon: Settings },
]

export default function Sidebar({ className, onClose }: SidebarProps) {
  const { data: vpn } = useVPNStatus()
  const { data: stats } = useDownloadStats()

  return (
    <aside
      className={cn(
        'sidebar-root flex flex-col h-screen w-64 text-slate-300',
        className
      )}
    >
      {/* ── Brand Header ── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.08]">
        {/* Logo mark */}
        <div
          className="relative flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, oklch(0.56 0.24 270), oklch(0.54 0.22 300))',
            boxShadow: '0 4px 16px oklch(0.55 0.24 270 / 0.40)',
          }}
        >
          <ArrowDownToLine className="w-5 h-5 text-white relative z-10" />
          {/* Shimmer sweep */}
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        <div className="leading-none">
          <p className="text-sm font-extrabold text-white tracking-tight">Download</p>
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-0.5">
            Gateway
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
          Navigation
        </p>

        {navItems.map(({ name, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn('nav-link', isActive ? 'active' : '')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'nav-icon-active' : 'nav-icon-inactive'
                  )}
                />
                <span>{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Live Speed Ticker ── */}
      <div className="px-4 pb-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Live Speed</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-medium">↓ Download</span>
            <span
              className="text-xs font-bold font-mono tabular-nums"
              style={{ color: 'oklch(0.70 0.17 155)' }}
            >
              {formatSpeed(stats?.download_speed ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40 font-medium">↑ Upload</span>
            <span
              className="text-xs font-bold font-mono tabular-nums"
              style={{ color: 'oklch(0.68 0.20 270)' }}
            >
              {formatSpeed(stats?.upload_speed ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ── VPN Status Footer ── */}
      <div className="px-3 pb-5 border-t border-white/[0.07] pt-4">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200',
            vpn?.connected
              ? 'bg-emerald-500/[0.08] border-emerald-500/[0.22]'
              : 'bg-rose-500/[0.07] border-rose-500/[0.20]'
          )}
        >
          {/* Status dot */}
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full shrink-0',
              vpn?.connected ? 'glow-connected' : 'bg-rose-500/80'
            )}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {vpn?.connected ? 'VPN Connected' : 'VPN Inactive'}
            </p>
            <p className="text-[10px] truncate mt-0.5"
              style={{
                color: vpn?.connected ? 'oklch(0.68 0.17 155)' : 'oklch(0.58 0.22 22)',
              }}
            >
              {vpn?.connected
                ? vpn.server_name || vpn.server_id || 'Tunnel Active'
                : 'Exposed — no tunnel'}
            </p>
          </div>
          <Shield
            className="w-4 h-4 shrink-0"
            style={{
              color: vpn?.connected
                ? 'oklch(0.68 0.17 155)'
                : 'oklch(0.50 0.22 22)',
            }}
          />
        </div>
      </div>
    </aside>
  )
}
