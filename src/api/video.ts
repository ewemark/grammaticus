import { request } from './client'

export interface VideoItem {
  filename: string
  displayName: string
  size: number
}

/** 获取已导入的视频列表 */
export function fetchVideos() {
  return request<{ videos: VideoItem[] }>('/video/list')
}

/** 视频播放/下载地址 */
export function getVideoUrl(filename: string) {
  const base = import.meta.env.VITE_API_URL || '/api'
  return `${base}/video/${encodeURIComponent(filename)}`
}
