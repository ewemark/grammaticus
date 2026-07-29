import { request } from './client'

export interface User {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export function register(data: { username: string; email: string; password: string }) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function login(data: { email: string; password: string }) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMe() {
  return request<{ user: User }>('/auth/me')
}

/** Store token + clear function */
export function setToken(token: string) {
  localStorage.setItem('grammaticus_token', token)
}

export function getToken(): string | null {
  return localStorage.getItem('grammaticus_token')
}

export function clearToken() {
  localStorage.removeItem('grammaticus_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}
