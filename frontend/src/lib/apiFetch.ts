/**
 * Shared authenticated fetch utility with automatic 401 → token refresh.
 *
 * On a 401 response the function attempts a silent refresh via
 * POST /auth/token/refresh/ and retries the original request once with the
 * new access token.  If the refresh also fails the stored session is cleared
 * and the caller receives the original 401 error.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

const ACCESS_TOKEN_KEY = 'tienda.accessToken'
const REFRESH_TOKEN_KEY = 'tienda.refreshToken'

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) return null

  try {
    const res = await fetch(buildApiUrl('/auth/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!res.ok) {
      // Refresh token expired or blacklisted — clear session.
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem('tienda.user')
      return null
    }

    const data = (await res.json()) as Record<string, unknown>
    const newAccess = typeof data.access === 'string' ? data.access : null
    if (!newAccess) return null

    localStorage.setItem(ACCESS_TOKEN_KEY, newAccess)

    // simplejwt rotates the refresh token when ROTATE_REFRESH_TOKENS=True.
    if (typeof data.refresh === 'string') {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
    }

    return newAccess
  } catch {
    return null
  }
}

// Prevents multiple simultaneous refresh requests from racing each other.
let inflightRefresh: Promise<string | null> | null = null

async function getValidAccessToken(): Promise<string | null> {
  const stored = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (stored) return stored

  if (!inflightRefresh) {
    inflightRefresh = refreshAccessToken().finally(() => {
      inflightRefresh = null
    })
  }

  return inflightRefresh
}

function parseErrorBody(body: unknown, statusCode: number): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (typeof b.error === 'string') return b.error
    if (typeof b.detail === 'string') return b.detail
  }
  return `Error ${statusCode}`
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const token = await getValidAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
    ...(options.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(buildApiUrl(path), { ...options, headers })

  // Happy path
  if (response.ok) {
    if (response.status === 204) return null
    return response.json()
  }

  // 401: try refreshing once then retry
  if (response.status === 401) {
    // Clear stored access token so getValidAccessToken triggers a refresh.
    localStorage.removeItem(ACCESS_TOKEN_KEY)

    if (!inflightRefresh) {
      inflightRefresh = refreshAccessToken().finally(() => {
        inflightRefresh = null
      })
    }

    const newToken = await inflightRefresh

    if (newToken) {
      const retryHeaders: Record<string, string> = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      }
      const retryResponse = await fetch(buildApiUrl(path), {
        ...options,
        headers: retryHeaders,
      })

      if (retryResponse.ok) {
        if (retryResponse.status === 204) return null
        return retryResponse.json()
      }

      const retryBody = await retryResponse.json().catch(() => null)
      throw new Error(parseErrorBody(retryBody, retryResponse.status))
    }
  }

  const errorBody = await response.json().catch(() => null)
  throw new Error(parseErrorBody(errorBody, response.status))
}
