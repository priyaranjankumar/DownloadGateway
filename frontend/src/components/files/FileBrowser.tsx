import { useState } from 'react'
import {
  Folder,
  File,
  ChevronRight,
  Home,
  Trash2,
  Edit2,
  FolderPlus,
  ArrowLeft,
  Inbox,
  Clock,
  HardDrive,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFiles, useRenameFile, useDeleteFile, useCreateDir } from '@/hooks/use-files'
import { formatBytes } from '@/lib/utils'
import { toast } from 'sonner'

export default function FileBrowser() {
  const [currentPath, setCurrentPath] = useState<string>('')
  const { data: files, isLoading } = useFiles(currentPath)

  const renameMutation = useRenameFile()
  const deleteMutation = useDeleteFile()
  const createDirMutation = useCreateDir()

  // Modal States
  const [mkdirOpen, setMkdirOpen] = useState(false)
  const [newDirName, setNewDirName] = useState('')
  
  const [renameOpen, setRenameOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')

  // Navigate folder
  const navigateTo = (path: string) => {
    setCurrentPath(path)
  }

  // Navigate parent
  const navigateUp = () => {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
  }

  // Breadcrumbs builder
  const renderBreadcrumbs = () => {
    const parts = currentPath.split('/').filter((p) => p.length > 0)
    return (
      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium select-none bg-[#111625]/40 py-2.5 px-4 rounded-xl border border-[#222533]/30">
        <button
          onClick={() => navigateTo('')}
          className="flex items-center gap-1 text-slate-500 hover:text-white transition-colors cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Root</span>
        </button>
        {parts.map((p, index) => {
          const path = parts.slice(0, index + 1).join('/')
          return (
            <div key={path} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button
                onClick={() => navigateTo(path)}
                className="hover:text-white transition-colors cursor-pointer font-semibold text-slate-300"
              >
                {p}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const handleMkdir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDirName.trim()) return

    const fullPath = currentPath ? `${currentPath}/${newDirName.trim()}` : newDirName.trim()
    toast.promise(createDirMutation.mutateAsync({ path: fullPath }), {
      loading: 'Creating folder...',
      success: `Folder "${newDirName}" created`,
      error: 'Failed to create folder',
    })
    setNewDirName('')
    setMkdirOpen(false)
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !renameInput.trim()) return

    const fullPath = currentPath ? `${currentPath}/${selectedFile}` : selectedFile
    toast.promise(
      renameMutation.mutateAsync({
        path: fullPath,
        new_name: renameInput.trim(),
      }),
      {
        loading: 'Renaming file...',
        success: 'File renamed successfully',
        error: 'Failed to rename file',
      }
    )
    setSelectedFile(null)
    setRenameInput('')
    setRenameOpen(false)
  }

  const handleDelete = (name: string) => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name
    if (confirm(`Are you sure you want to delete "${name}"? This action is permanent.`)) {
      toast.promise(deleteMutation.mutateAsync(fullPath), {
        loading: 'Deleting file...',
        success: 'Deleted successfully',
        error: 'Failed to delete file',
      })
    }
  }

  return (
    <Card className="glass border-[#222533] w-full flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-[#222533]/50 pb-4">
        <div>
          <CardTitle className="text-white font-bold text-base tracking-wide flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            File Sandbox
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Securely browse and manage downloaded items under /downloads/
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {currentPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={navigateUp}
              className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl gap-1.5 cursor-pointer font-semibold text-xs py-4 px-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <Button
            onClick={() => setMkdirOpen(true)}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-4 px-3 gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4 flex-1">
        {/* Breadcrumb row */}
        {renderBreadcrumbs()}

        {/* Directory Listing */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-xs text-slate-500 font-semibold h-60">
            <div className="w-8 h-8 border-4 border-[#4f46e5] border-t-transparent rounded-full animate-spin mb-3" />
            Reading sandbox path...
          </div>
        ) : !files || files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 h-60 border border-dashed border-[#222533]/50 rounded-2xl">
            <Inbox className="w-10 h-10 text-slate-600 mb-2 stroke-[1.2]" />
            <p className="text-sm font-semibold text-slate-400">Empty directory</p>
            <p className="text-[11px] max-w-[200px] mt-1">This directory doesn't contain any files or folders.</p>
          </div>
        ) : (
          <div className="border border-[#222533]/30 rounded-2xl overflow-hidden">
            <table className="w-full border-collapse text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-[#222533]/50 bg-[#0c101d]/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider select-none">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Modified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222533]/30 bg-transparent">
                {files.map((file) => {
                  return (
                    <tr
                      key={file.name}
                      className="hover:bg-[#111625]/20 border-[#222533]/30 transition-colors"
                    >
                      {/* Name / Navigation */}
                      <td className="px-6 py-3.5 font-medium max-w-[320px]">
                        {file.is_dir ? (
                          <button
                            onClick={() => navigateTo(file.path)}
                            className="flex items-center gap-3 text-[#818cf8] hover:text-white font-semibold text-left transition-colors cursor-pointer w-full group"
                          >
                            <div className="p-2 rounded-xl bg-[#111625] border border-[#222533] group-hover:bg-[#1a1f2e] transition-colors text-indigo-400">
                              <Folder className="w-4 h-4 fill-indigo-500/20" />
                            </div>
                            <span className="truncate">{file.name}</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 text-slate-100">
                            <div className="p-2 rounded-xl bg-[#111625] border border-[#222533] text-slate-400">
                              <File className="w-4 h-4" />
                            </div>
                            <span className="truncate">{file.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-6 py-3.5 font-mono font-medium text-slate-400">
                        {file.is_dir ? `${file.children_count || 0} items` : formatBytes(file.size || 0)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-3.5 text-slate-400 font-medium">
                        {file.modified ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {new Date(file.modified).toLocaleDateString()}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>

                      {/* Item Actions */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedFile(file.name)
                              setRenameInput(file.name)
                              setRenameOpen(true)
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-[#1a1f2e] text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(file.name)}
                            className="w-8 h-8 rounded-lg hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* New Folder Modal */}
      <Dialog open={mkdirOpen} onOpenChange={setMkdirOpen}>
        <DialogContent className="glass border-[#222533] sm:max-w-md text-slate-300">
          <form onSubmit={handleMkdir}>
            <DialogHeader>
              <DialogTitle className="text-white font-bold flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                Create New Folder
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Type the name of the new directory to create inside the current folder path.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Folder name"
                value={newDirName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDirName(e.target.value)}
                required
                className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-4 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMkdirOpen(false)}
                className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl py-4.5 px-4 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-4.5 px-4 cursor-pointer"
              >
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Modal */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="glass border-[#222533] sm:max-w-md text-slate-300">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle className="text-white font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Rename Item
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Rename the file or folder selected.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="New name"
                value={renameInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameInput(e.target.value)}
                required
                className="bg-[#111625]/60 border-[#222533] text-slate-200 rounded-xl focus:ring-[#4f46e5] w-full py-4 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                className="border-[#222533] hover:bg-[#1a1f2e] text-slate-400 hover:text-white rounded-xl py-4.5 px-4 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold text-xs rounded-xl py-4.5 px-4 cursor-pointer"
              >
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
