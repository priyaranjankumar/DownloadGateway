import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Shield, Lock, User, ArrowRight, KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLogin, useSetup } from '@/hooks/use-auth'
import api from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'

export default function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const setupMutation = useSetup()

  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Check setup status
  const checkSetupStatus = async () => {
    try {
      const { data } = await api.get<{ setup_complete: boolean }>('/auth/setup-status')
      setIsSetupComplete(data.setup_complete)
      if (!data.setup_complete) {
        setIsRegistering(true)
      }
    } catch (err) {
      setIsSetupComplete(true) // Fallback to login
    }
  }

  useEffect(() => {
    // If token exists, direct to dashboard
    if (localStorage.getItem('token')) {
      navigate(ROUTES.DASHBOARD)
    } else {
      checkSetupStatus()
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isRegistering) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }

      try {
        await toast.promise(
          setupMutation.mutateAsync({ username, password }),
          {
            loading: 'Creating admin user record...',
            success: 'First-run setup complete! Please log in.',
            error: (err) => `Setup failed: ${err.message}`,
          }
        )
        // Reset to login mode
        setIsRegistering(false)
        setPassword('')
        setConfirmPassword('')
        setIsSetupComplete(true)
      } catch (err) {
        // Handled by toast.promise
      }
    } else {
      try {
        await toast.promise(
          loginMutation.mutateAsync({ username, password }),
          {
            loading: 'Authenticating credentials...',
            success: 'Welcome to Download Gateway!',
            error: (err) => `Authentication failed: ${err.message}`,
          }
        )
        navigate(ROUTES.DASHBOARD)
      } catch (err) {
        // Handled by toast.promise
      }
    }
  }

  if (isSetupComplete === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19]">
        <div className="w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#060913] items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c101d_1px,transparent_1px),linear-gradient(to_bottom,#0c101d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
      <div className="absolute w-[450px] h-[450px] rounded-full bg-[#4f46e5]/10 blur-[120px] top-1/4 left-1/4" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-[#7c3aed]/10 blur-[100px] bottom-1/4 right-1/4" />

      {/* Main Form container card */}
      <Card className="glass border-[#222533] w-full max-w-[420px] relative z-10 p-4">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-[#818cf8] border border-indigo-500/15 shadow-xl shadow-indigo-950/20">
              <Shield className="w-8 h-8 stroke-[1.5]" />
            </div>
          </div>
          <CardTitle className="text-white font-black text-xl tracking-wide">
            {isRegistering ? 'Setup Admin Account' : 'Download Gateway'}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            {isRegistering
              ? 'Create the first administrative account to secure your gateway'
              : 'Sign in to access your download client and VPN controls'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <Input
                  placeholder="admin"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                  className="pl-10 pr-4 bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-5 text-xs"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-4 bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-5 text-xs"
                />
              </div>
            </div>

            {/* Confirm Password (Setup mode) */}
            {isRegistering && (
              <div className="space-y-1.5 text-xs text-slate-400">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 pr-4 bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-5 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-5.5 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 gap-1.5 mt-2 cursor-pointer"
              disabled={loginMutation.isPending || setupMutation.isPending}
            >
              {isRegistering ? 'Complete Setup' : 'Authorize Entrance'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
