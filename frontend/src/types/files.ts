export interface FileEntry {
  name: string
  path: string
  is_dir: boolean
  size: number | null
  modified: string | null
  children_count: number | null
}

export interface RenameRequest {
  path: string
  new_name: string
}

export interface MoveFileRequest {
  src: string
  dst: string
}

export interface CreateDirRequest {
  path: string
}
