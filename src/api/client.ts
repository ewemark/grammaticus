/**
 * API 基础 HTTP 客户端
 *
 * 所有后端通信都通过这个模块，组件不应直接调用 fetch。
 * 后端 API 地址通过环境变量 VITE_API_URL 配置。
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/** 供流式请求(SSE)复用同一 API 基地址 */
export { BASE_URL }

/** API 错误类 */
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** 通用请求函数 — 自动附带 JWT token */
export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const token = localStorage.getItem('grammaticus_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { headers, ...options })

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(body || `请求失败 (${res.status})`, res.status)
  }

  return res.json() as Promise<T>
}
