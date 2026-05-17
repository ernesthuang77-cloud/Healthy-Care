import { formatMoney } from '@/lib/money'

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string }

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code)
  }
}

const getToken = () => localStorage.getItem('yc_token') || ''

const request = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const token = getToken()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, { ...init, headers })
  const json = (await res.json().catch(() => null)) as ApiResult<T> | null
  if (!res.ok || !json || json.success === false) {
    const code = json && 'error' in json ? json.error : 'REQUEST_FAILED'
    throw new ApiError(res.status, code, code)
  }
  return json.data
}

export const apiGet = <T>(path: string) => request<T>(path)
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
export const apiDelete = <T>(path: string) => request<T>(path, { method: 'DELETE' })

export { formatMoney }

