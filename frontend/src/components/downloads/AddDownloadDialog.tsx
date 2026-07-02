import { useState, useRef } from 'react'
import { Plus, Link as LinkIcon, FileUp, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddDownload } from '@/hooks/use-downloads'
import { toast } from 'sonner'

export default function AddDownloadDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('uris')
  const [urisInput, setUrisInput] = useState('')
  const [torrentB64, setTorrentB64] = useState('')
  const [torrentName, setTorrentName] = useState('')
  const [downloadDir, setDownloadDir] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const addDownloadMutation = useAddDownload()

  // Convert uploaded torrent file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTorrentName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // base64 payload is the content after "data:application/x-bittorrent;base64,"
      const b64 = result.split(',')[1]
      setTorrentB64(b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const options: Record<string, string> = {}
    if (downloadDir.trim()) {
      options.dir = downloadDir.trim()
    }

    try {
      if (activeTab === 'uris') {
        const uris = urisInput
          .split('\n')
          .map((u) => u.trim())
          .filter((u) => u.length > 0)
        
        if (uris.length === 0) {
          toast.error('Please enter at least one URL')
          return
        }

        await toast.promise(
          addDownloadMutation.mutateAsync({
            uris,
            options,
          }),
          {
            loading: 'Submitting task to aria2...',
            success: 'Task added successfully!',
            error: (err) => `Failed to add task: ${err.message}`,
          }
        )
      } else {
        if (!torrentB64) {
          toast.error('Please upload a torrent file')
          return
        }

        await toast.promise(
          addDownloadMutation.mutateAsync({
            torrent: torrentB64,
            options,
          }),
          {
            loading: 'Uploading torrent metadata to aria2...',
            success: 'Torrent download initialized!',
            error: (err) => `Failed to start torrent: ${err.message}`,
          }
        )
      }

      // Reset form states
      setUrisInput('')
      setTorrentB64('')
      setTorrentName('')
      setDownloadDir('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setOpen(false)
    } catch (err) {
      // Errors handled by toast.promise
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-4.5 px-4 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 gap-1.5 cursor-pointer" />}>
        <Plus className="w-4 h-4" />
        Add Task
      </DialogTrigger>
      <DialogContent className="glass border-[#222533] sm:max-w-lg text-slate-300">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Add New Download Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submit HTTP/FTP links, magnet URIs, or upload .torrent files directly.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="py-4 space-y-4">
            <TabsList className="bg-[#111625]/60 border border-[#222533] rounded-xl p-1 h-auto w-full grid grid-cols-2">
              <TabsTrigger
                value="uris"
                className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
              >
                <LinkIcon className="w-4 h-4 mr-1.5" />
                URL / Magnet Links
              </TabsTrigger>
              <TabsTrigger
                value="torrent"
                className="rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-[#4f46e5] data-[state=active]:text-white focus:outline-none"
              >
                <FileUp className="w-4 h-4 mr-1.5" />
                Torrent Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uris" className="space-y-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Resource URLs (one per line)
              </label>
              <textarea
                placeholder="https://example.com/file.zip&#10;magnet:?xt=urn:btih:..."
                value={urisInput}
                onChange={(e) => setUrisInput(e.target.value)}
                className="w-full min-h-[120px] bg-[#111625]/60 border border-[#222533] rounded-xl p-3 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-[#4f46e5] focus:outline-none resize-none placeholder:text-slate-700"
              />
            </TabsContent>

            <TabsContent value="torrent" className="space-y-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Torrent File (.torrent)
              </label>
              <div
                className="border-2 border-dashed border-[#222533] hover:border-[#4f46e5]/40 rounded-2xl p-6 text-center cursor-pointer bg-[#111625]/30 hover:bg-[#111625]/60 transition-colors flex flex-col items-center justify-center space-y-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="w-8 h-8 text-slate-500" />
                <p className="text-xs text-slate-300 font-semibold">
                  {torrentName || 'Click to select or drop a torrent file here'}
                </p>
                <p className="text-[10px] text-slate-500">Supports .torrent binary file format</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".torrent"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </TabsContent>

            {/* Custom Options */}
            <div className="space-y-1.5 border-t border-[#222533]/40 pt-4">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Custom Output Directory (Optional)
              </label>
              <Input
                placeholder="e.g. /downloads/complete/movies"
                value={downloadDir}
                onChange={(e) => setDownloadDir(e.target.value)}
                className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-4 text-xs"
              />
            </div>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl py-5 px-4 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-5 px-5 shadow-lg shadow-indigo-950/20 hover:shadow-indigo-950/40 cursor-pointer"
              disabled={addDownloadMutation.isPending}
            >
              {addDownloadMutation.isPending ? 'Adding task...' : 'Start Download'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
