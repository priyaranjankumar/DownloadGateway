import FileBrowser from '@/components/files/FileBrowser'

export default function FilesPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-wide">File Browser</h1>
        <p className="text-xs text-slate-500">Explore, rename, and clean up completed files inside the download directories.</p>
      </div>

      {/* File Browser Grid */}
      <div className="grid grid-cols-1 gap-6">
        <FileBrowser />
      </div>
    </div>
  )
}
