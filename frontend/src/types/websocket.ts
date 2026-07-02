export interface WSEvent<T = any> {
  type: string
  data: T
  timestamp: string
}
