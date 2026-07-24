import { useState, useEffect, useCallback } from 'react'

/**
 * useApi - 通用数据请求 Hook
 *
 * 统一处理三种状态：
 * - loading: 请求进行中
 * - error: 请求失败，错误信息
 * - data: 请求成功，类型安全的数据
 *
 * @param fetcher 异步请求函数
 * @param deps 依赖数组，变化时重新请求（默认 []，仅挂载时请求一次）
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    execute()
  }, [execute])

  const refetch = useCallback(() => {
    execute()
  }, [execute])

  return { data, error, loading, refetch }
}
