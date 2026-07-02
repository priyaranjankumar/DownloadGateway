import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import Sidebar from './Sidebar'
import Header from './Header'
import { useCurrentUser } from '@/hooks/use-auth'
import { useWebSocket } from '@/hooks/use-websocket'
import { ROUTES } from '@/lib/constants'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function AppLayout() {
  const { data: user, isLoading, isError } = useCurrentUser()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Start the background WebSocket updates when layout mounts (logged in)
  const token = localStorage.getItem('token')
  if (token) {
    useWebSocket()
  }

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!token) {
      navigate(ROUTES.LOGIN)
    }
  }, [token, navigate])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="w-12 h-12 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-slate-400 text-sm font-medium">Authorising session...</p>
      </div>
    )
  }

  if (isError || (!user && token)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19] text-center px-4">
        <h3 className="text-xl font-bold text-white mb-2">Session Expired</h3>
        <p className="text-slate-400 text-sm mb-6">Your authentication token is invalid or has expired.</p>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            navigate(ROUTES.LOGIN)
          }}
          className="px-6 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-medium transition-colors"
        >
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden">
      {/* Sidebar for Desktop */}
      <Sidebar className="hidden md:flex flex-shrink-0" />

      {/* Sidebar Drawer for Mobile */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 bg-transparent border-0 max-w-[256px]">
          <Sidebar onClose={() => setMobileSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#0b0f19] p-6 text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
