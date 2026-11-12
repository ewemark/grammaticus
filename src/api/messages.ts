import { request } from './client'

/** 留言条目(作者视角,需登录才能拉取) */
export interface Message {
  id: number
  name: string
  content: string
  created_at: string
}

/** 提交留言(公开接口,邮件通知作者) */
export function submitMessage(data: { name?: string; email?: string; content: string }) {
  return request<{ ok: boolean }>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** 拉取留言列表(仅登录用户) */
export function fetchMessages() {
  return request<Message[]>('/messages')
}
