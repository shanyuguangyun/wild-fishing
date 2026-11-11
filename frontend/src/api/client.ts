/**
 * 统一的请求封装。
 *
 * - 自动携带 Bearer token
 * - 把后端的 detail 字段转成可直接展示的错误信息
 * - 401 时清空本地登录态并广播事件，由 AuthProvider 统一处理跳转
 */

const TOKEN_KEY = 'wf_token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  auth?: boolean
  query?: Record<string, string | number | boolean | null | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  if (!query) return path
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(buildUrl(`/api${path}`, options.query), {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })

  if (response.status === 401 && options.auth !== false) {
    clearToken()
    window.dispatchEvent(new Event('wf:auth-expired'))
  }

  if (!response.ok) {
    let message = '请求失败，请稍后重试'
    try {
      const data = await response.json()
      if (typeof data?.detail === 'string') message = data.detail
      else if (Array.isArray(data?.detail)) message = data.detail[0]?.msg ?? message
    } catch {
      /* 后端返回非 JSON 时保留默认文案 */
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
