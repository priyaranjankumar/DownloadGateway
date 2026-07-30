import { useEffect, useState } from 'react'
import { Settings, Save, Lock, KeyRound, Bell, Clock, Copy, Check, Puzzle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import api from '@/lib/api'
import { useChangePassword } from '@/hooks/use-auth'
import { AppSettings } from '@/types/settings'
import { toast } from 'sonner'
import { isNotificationSupported, requestNotificationPermission } from '@/lib/notifications'

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
    notification_download_complete: true,
    notification_download_error: true,
    notification_vpn_disconnect: true,
    bw_day_start: '08:00',
    bw_day_end: '00:00',
    bw_day_limit: 0,
    bw_night_limit: 0,
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Account Password States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // API Token States (for browser extension)
  const [apiToken, setApiToken] = useState('')
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  // Notification permission status
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotifPermission(Notification.permission)
    } else {
      setNotifPermission('unsupported')
    }
  }, [])

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

  const handleGenerateToken = async () => {
    setIsGeneratingToken(true)
    try {
      const { data } = await api.post<{ token: string; expires_in_days: number }>('/auth/api-token')
      setApiToken(data.token)
      toast.success(`API token generated (expires in ${data.expires_in_days} days)`)
    } catch (err: any) {
      toast.error(`Failed to generate token: ${err.message}`)
    } finally {
      setIsGeneratingToken(false)
    }
  }

  const handleCopyToken = async () => {
    if (!apiToken) return
    await navigator.clipboard.writeText(apiToken)
    setTokenCopied(true)
    toast.success('API token copied to clipboard')
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    if (result) setNotifPermission(result)
  }

  const handleTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Download Gateway — Test', {
        body: 'Notifications are working correctly! 🎉',
        icon: '/assets/icon-192.png',
      })
    } else {
      toast.error('Notification permission not granted')
    }
  }

  // Toggle helper for notification switches
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? 'bg-[#4f46e5]' : 'bg-[#222533]'
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : ''
        }`}
      />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">Application Settings</h1>
        <p className="text-xs text-slate-500">Configure file paths, bandwidth parameters, notifications, and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Gateway settings config Form */}
        <div className="lg:col-span-2 space-y-6">
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

                {/* Bandwidth Scheduling Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Bandwidth Scheduling
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Auto-apply different speed limits based on time-of-day. Set 0 for unlimited.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Day Window Start
                      </label>
                      <Input
                        type="time"
                        value={settings.bw_day_start || '08:00'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, bw_day_start: e.target.value })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Day Window End
                      </label>
                      <Input
                        type="time"
                        value={settings.bw_day_end || '00:00'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, bw_day_end: e.target.value })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Day Speed Limit (bytes/s)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={settings.bw_day_limit || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, bw_day_limit: parseInt(e.target.value) || 0 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        placeholder="0 = unlimited"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Night Speed Limit (bytes/s)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={settings.bw_night_limit || 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, bw_night_limit: parseInt(e.target.value) || 0 })}
                        className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5]"
                        placeholder="0 = unlimited"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#222533]/50" />

                {/* VPN & Firewall Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    VPN & Firewall Settings
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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

                <Separator className="bg-[#222533]/50" />

                {/* Notifications Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      Notifications
                    </div>
                    <div className="flex items-center gap-2">
                      {notifPermission === 'granted' ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Enabled
                        </span>
                      ) : notifPermission === 'denied' ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                          Blocked
                        </span>
                      ) : notifPermission === 'unsupported' ? (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Unsupported
                        </span>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleRequestPermission}
                          className="text-[10px] font-bold px-2.5 py-1 h-auto bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg cursor-pointer"
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-slate-200 font-medium">Download Complete</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Notify when a download finishes successfully</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.notification_download_complete ?? true}
                        onChange={(v) => setSettings({ ...settings, notification_download_complete: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-slate-200 font-medium">Download Error</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Notify when a download fails</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.notification_download_error ?? true}
                        onChange={(v) => setSettings({ ...settings, notification_download_error: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-slate-200 font-medium">VPN Disconnect</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Notify when VPN tunnel drops</p>
                      </div>
                      <ToggleSwitch
                        checked={settings.notification_vpn_disconnect ?? true}
                        onChange={(v) => setSettings({ ...settings, notification_vpn_disconnect: v })}
                      />
                    </div>
                    {notifPermission === 'granted' && (
                      <Button
                        type="button"
                        onClick={handleTestNotification}
                        className="text-xs font-semibold px-3 py-2 h-auto bg-[#111625]/60 border border-[#222533] text-slate-300 hover:bg-[#1a1f2e] rounded-xl cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 mr-1.5" />
                        Send Test Notification
                      </Button>
                    )}
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

          {/* Browser Extension API Token Card */}
          <Card className="glass border-[#222533] p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
              <Puzzle className="w-4 h-4 text-indigo-400" />
              Browser Extension
            </div>
            <p className="text-[11px] text-slate-500">
              Generate an API token to use with the Download Gateway Chrome Extension. Paste this token into the extension&apos;s options page.
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleGenerateToken}
                  disabled={isGeneratingToken}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-4 px-4 shadow-lg shadow-indigo-950/20 gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                  {isGeneratingToken ? 'Generating...' : 'Generate API Token'}
                </Button>
              </div>
              {apiToken && (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={apiToken}
                    className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] font-mono text-[11px] flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyToken}
                    className="bg-[#111625]/60 border border-[#222533] text-slate-300 hover:bg-[#1a1f2e] rounded-xl py-4 px-3 cursor-pointer"
                  >
                    {tokenCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>
          </Card>
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
