import { createContext, createElement, useContext, useState, type ReactNode } from 'react'

export type UserRole = 'USER' | 'PROVIDER' | 'STAFF' | 'ADMIN'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
  email?: string | null
}

export interface RegisterAccountPayload {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<AuthUser>
  register: (payload: RegisterAccountPayload) => Promise<AuthUser>
  logout: () => void
}

interface LoginResponsePayload {
  user: AuthUser
  access: string
  refresh: string
}

interface StoredSessionState {
  user: AuthUser | null
  token: string | null
  loading: boolean
}

const ACCESS_TOKEN_STORAGE_KEY = 'tienda.accessToken'
const REFRESH_TOKEN_STORAGE_KEY = 'tienda.refreshToken'
const USER_STORAGE_KEY = 'tienda.user'
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringList(value: unknown) {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return []
}

function formatFieldLabel(fieldName: string) {
  switch (fieldName) {
    case 'username':
      return 'Usuario'
    case 'email':
      return 'Correo'
    case 'password':
      return 'Contrasena'
    case 'non_field_errors':
      return 'Formulario'
    default:
      return fieldName
  }
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function parseUser(payload: unknown): AuthUser | null {
  if (!isRecord(payload)) {
    return null
  }

  const id = payload.id
  const username = payload.username
  const role = payload.role
  const email = payload.email

  if (typeof id !== 'number' || typeof username !== 'string' || typeof role !== 'string') {
    return null
  }

  return {
    id,
    username,
    role: role as UserRole,
    email: typeof email === 'string' ? email : null,
  }
}

function parseLoginResponse(payload: unknown): LoginResponsePayload | null {
  if (!isRecord(payload)) {
    return null
  }

  const user = parseUser(payload.user)
  const access = payload.access
  const refresh = payload.refresh

  if (!user || typeof access !== 'string' || typeof refresh !== 'string') {
    return null
  }

  return {
    user,
    access,
    refresh,
  }
}

function readStoredUser() {
  const serializedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!serializedUser) {
    return null
  }

  try {
    return parseUser(JSON.parse(serializedUser))
  } catch {
    return null
  }
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

function persistSession(session: LoginResponsePayload) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.access)
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refresh)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user))
}

// Traducimos los errores del backend a un mensaje legible para los formularios.
async function getResponseErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as unknown

  if (!isRecord(payload)) {
    return fallback
  }

  if (typeof payload.detail === 'string') {
    return payload.detail
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  const messages = Object.entries(payload).flatMap(([key, value]) => {
    const parts = toStringList(value)

    if (!parts.length) {
      return []
    }

    return [`${formatFieldLabel(key)}: ${parts.join(' ')}`]
  })

  return messages.join(' ') || fallback
}

// Restauramos la sesion guardada para que el usuario vuelva autenticado al refrescar.
function getInitialSessionState(): StoredSessionState {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      loading: false,
    }
  }

  const savedToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  const savedUser = readStoredUser()

  if (savedToken && savedUser) {
    return {
      user: savedUser,
      token: savedToken,
      loading: false,
    }
  }

  clearStoredSession()

  return {
    user: null,
    token: null,
    loading: false,
  }
}

/**
 * Attempts a silent token refresh using the stored refresh token.
 * Returns the new access token on success, or null if the refresh token
 * is missing, expired, or blacklisted.
 */
export async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  if (!refreshToken) return null

  try {
    const response = await fetch(buildApiUrl('/auth/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      // Refresh token is expired or blacklisted — clear everything.
      clearStoredSession()
      return null
    }

    const data = (await response.json()) as unknown
    if (!isRecord(data) || typeof data.access !== 'string') return null

    const newAccess = data.access
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, newAccess)

    // simplejwt with ROTATE_REFRESH_TOKENS returns a new refresh token too.
    if (typeof data.refresh === 'string') {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refresh)
    }

    return newAccess
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSessionState>(() => getInitialSessionState())

  const login = async (username: string, password: string) => {
    const response = await fetch(buildApiUrl('/auth/login/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    })

    if (!response.ok) {
      throw new Error(await getResponseErrorMessage(response, 'No se pudo iniciar sesion.'))
    }

    const nextSession = parseLoginResponse(await response.json())

    if (!nextSession) {
      throw new Error('La respuesta del backend no tiene el formato esperado.')
    }

    persistSession(nextSession)
    setSession({
      user: nextSession.user,
      token: nextSession.access,
      loading: false,
    })

    return nextSession.user
  }

  const register = async ({
    username,
    email,
    password,
    confirmPassword,
  }: RegisterAccountPayload) => {
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()

    if (!trimmedUsername) {
      throw new Error('El usuario es obligatorio.')
    }

    if (!trimmedEmail) {
      throw new Error('El correo es obligatorio.')
    }

    if (password !== confirmPassword) {
      throw new Error('Las contrasenas no coinciden.')
    }

    const response = await fetch(buildApiUrl('/auth/register/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      }),
    })

    if (!response.ok) {
      throw new Error(await getResponseErrorMessage(response, 'No se pudo crear la cuenta.'))
    }

    return login(trimmedUsername, password)
  }

  const logout = async () => {
    // Blacklist the refresh token on the server before clearing local state.
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
    const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)

    if (refreshToken && accessToken) {
      try {
        await fetch(buildApiUrl('/auth/logout/'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })
      } catch {
        // Ignore network errors — local session is cleared regardless.
      }
    }

    clearStoredSession()
    setSession({
      user: null,
      token: null,
      loading: false,
    })
  }

  const value: AuthContextValue = {
    user: session.user,
    token: session.token,
    loading: session.loading,
    login,
    register,
    logout,
  }

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
