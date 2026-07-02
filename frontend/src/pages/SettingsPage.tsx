import { useEffect, useState } from 'react'
import { Settings, Save, Lock, KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/api'
import { useChangePassword } from '@/hooks/use-auth'
import { AppSettings } from '@/types/settings'
import { toast } from 'sonner'

export default function SettingsPage() {
  const changePasswordMutation = useChangePassword()

  // App Settings States
  const [settings, setSettings] = useState<AppSettings>({
    download_dir: '/downloads',
    max_concurrent_downloads: 5,
    max_download_speed: 0,
    max_upload_speed: 0,
    aria2_rpc_secret: '',
    vpn_auto_connect: false,
    killswitch_auto_enable: false,
    ip_check_interval: 30,
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Account Password States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchSettings = async () => {
    try {
      const { data } = await api.get<AppSettings>('/settings')
      setSettings(data)
    } catch (err: any) {
      toast.error(`Failed to load settings: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { data } = await api.put<AppSettings>('/settings', settings)
      setSettings(data)
      toast.success('Configuration saved successfully!')
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    try {
      await toast.promise(
        changePasswordMutation.mutateAsync({
          current_password: currentPassword,
          new_password: newPassword,
        }),
        {
          loading: 'Updating security parameters...',
          success: 'Password changed successfully',
          error: (err) => `Failed to update password: ${err.message}`,
        }
      )
      
      // Clear password states
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      // Handled by toast.promise
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Application Settings</h1>
        <p className="text-xs text-slate-500">Configure file paths, bandwidth parameters, and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Gateway settings config Form */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0c101d]/20 border border-[#222533]/40 rounded-2xl">
              <div className="w-10 h-10 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-500 text-xs font-semibold">Reading configuration records...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <Card className="glass border-[#222533] space-y-6 p-6">
                {/* Download Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    Download Configuration
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Default Download Folder
                      </label>
                      <Input
                        value={settings.download_dir || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, download_dir: e.target.value })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Max Concurrent Tasks
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={settings.max_concurrent_downloads || 5}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, max_concurrent_downloads: parseInt(e.target.value) || 5 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Max Download Speed (bytes/s, 0=unlimited)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={settings.max_download_speed || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, max_download_speed: parseInt(e.target.value) || 0 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Max Upload Speed (bytes/s, 0=unlimited)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={settings.max_upload_speed || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, max_upload_speed: parseInt(e.target.value) || 0 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#222533]/50" />

                {/* VPN Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    VPN & Firewall Settings
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        IP Check Interval (seconds)
                      </label>
                      <Input
                        type="number"
                        min="10"
                        max="300"
                        value={settings.ip_check_interval || 30}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, ip_check_interval: parseInt(e.target.value) || 30 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Aria2 RPC Secret Token
                      </label>
                      <Input
                        type="password"
                        placeholder="RPC Secret token"
                        value={settings.aria2_rpc_secret || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, aria2_rpc_secret: e.target.value })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-5 px-5 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 gap-1.5 cursor-pointer"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>

        {/* Change password card */}
        <div className="flex flex-col h-full">
          <form onSubmit={handlePasswordSubmit}>
            <Card className="glass border-[#222533]">
              <CardHeader>
                <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" />
                  Update Security
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Modify account administrative password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    required
                    className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    required
                    className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                  />
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-5 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 cursor-pointer"
                    disabled={changePasswordMutation.isPending}
                  >
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
