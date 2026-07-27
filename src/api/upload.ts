import { request } from './client'

export interface PastDoc {
  id: number
  filename: string
  created_at: string
}

export interface UploadResult {
  id: number
  text: string
  filename: string
}

export interface DocFull {
  id: number
  filename: string
  content: string
  created_at: string
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/** 上传文件（multipart/form-data，不走 JSON 客户端） */
export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE_URL}/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `上传失败 (${res.status})`)
  }
  return res.json()
}

/** 获取历史上传列表 */
export async function fetchPastDocs(): Promise<PastDoc[]> {
  return request<PastDoc[]>('/upload/list')
}

/** 获取单篇文档 */
export async function fetchDoc(id: number): Promise<DocFull> {
  return request<DocFull>(`/upload/${id}`)
}

/** 删除文档 */
export async function deleteDoc(id: number): Promise<void> {
  await request<{ ok: boolean }>(`/upload/${id}`, { method: 'DELETE' })
}