import { request } from './client'

export interface WordLearning {
  id: number
  word: string
  stability: number
  interval_hours: number
  next_review_at: string | null
  error_count: number
  total_reviews: number
  memory_anchor: string
  credit_violations: number
  state: 'new' | 'learning' | 'active' | 'dormant'
}

export interface LearnStats {
  total: number; active: number; dormant: number; due: number
}

export async function fetchQueue(): Promise<WordLearning[]> {
  return request<WordLearning[]>('/learn/queue')
}

export async function fetchStats(): Promise<LearnStats> {
  return request<LearnStats>('/learn/stats')
}

export async function startLearning(word: string, meaning: string, anchor: string) {
  return request<WordLearning>('/learn/start', {
    method: 'POST',
    body: JSON.stringify({ word, meaning, anchor }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function submitReview(word: string, correct: boolean, errors: number) {
  return request<WordLearning>('/learn/review', {
    method: 'POST',
    body: JSON.stringify({ word, correct, errors }),
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function fetchWordState(word: string): Promise<WordLearning | null> {
  return request<WordLearning | null>(`/learn/${encodeURIComponent(word)}`)
}
