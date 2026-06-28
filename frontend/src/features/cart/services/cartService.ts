import { create } from 'zustand'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'
const SESSION_KEY_STORAGE_KEY = 'tienda.sessionKey'

function getOrCreateSessionKey(): string {
  const stored = localStorage.getItem(SESSION_KEY_STORAGE_KEY)
  if (stored) return stored
  const key = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY_STORAGE_KEY, key)
  return key
}

export interface CartItemData {
  id: number
  product_id: number
  product_title: string
  product_price: number
  product_image: string | null
  product_stock: number
  quantity: number
  subtotal: number
}

export interface CartState {
  items: CartItemData[]
  total: number
  itemCount: number
  loading: boolean
  couponCode: string | null
  discountAmount: number
  addItem: (productId: number, quantity?: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  fetchCart: () => Promise<void>
  mergeCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<{ discount: number; message: string }>
  removeCoupon: () => void
}

function getAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

function getSessionHeaders(): Record<string, string> {
  return { 'X-Session-Key': getOrCreateSessionKey() }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error en la solicitud' }))
    throw new Error(error.error || error.detail || `Error ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

function parseCartResponse(data: unknown) {
  if (!data || typeof data !== 'object') return { items: [], total: 0, itemCount: 0 }
  const d = data as Record<string, unknown>
  return {
    items: Array.isArray(d.items) ? (d.items as CartItemData[]) : [],
    total: typeof d.total === 'string' ? parseFloat(d.total) : (typeof d.total === 'number' ? d.total : 0),
    itemCount: typeof d.item_count === 'number' ? d.item_count : 0,
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  couponCode: null,
  discountAmount: 0,

  fetchCart: async () => {
    set({ loading: true })
    try {
      const token = localStorage.getItem('tienda.accessToken')
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      } else {
        headers['X-Session-Key'] = getOrCreateSessionKey()
      }
      const data = await apiFetch('/cart/current/', { headers })
      const parsed = parseCartResponse(data)
      set({ ...parsed, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addItem: async (productId: number, quantity = 1) => {
    const token = localStorage.getItem('tienda.accessToken')
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
      ...getSessionHeaders(),
    }
    await apiFetch('/cart/items/add/', {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId, quantity }),
    })
    await get().fetchCart()
  },

  removeItem: async (itemId: number) => {
    const token = localStorage.getItem('tienda.accessToken')
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
      ...getSessionHeaders(),
    }
    await apiFetch(`/cart/items/${itemId}/`, { method: 'DELETE', headers })
    await get().fetchCart()
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    const token = localStorage.getItem('tienda.accessToken')
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
      ...getSessionHeaders(),
    }
    await apiFetch(`/cart/items/${itemId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ quantity }),
    })
    await get().fetchCart()
  },

  clearCart: async () => {
    const token = localStorage.getItem('tienda.accessToken')
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
      ...getSessionHeaders(),
    }
    await apiFetch('/cart/clear/', { method: 'DELETE', headers })
    set({ items: [], total: 0, itemCount: 0, couponCode: null, discountAmount: 0 })
  },

  mergeCart: async () => {
    const token = localStorage.getItem('tienda.accessToken')
    if (!token) return
    try {
      await fetch(`${API_BASE_URL}/cart/merge/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Session-Key': getOrCreateSessionKey(),
        },
      })
      await get().fetchCart()
    } catch {
      // silent fail on merge
    }
  },

  applyCoupon: async (code: string) => {
    const token = localStorage.getItem('tienda.accessToken')
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
      ...getSessionHeaders(),
    }
    try {
      const data = await apiFetch('/coupons/validate/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, subtotal: get().total }),
      })
      const result = data as Record<string, unknown>
      const discountAmount = parseFloat(result.discount_amount as string) || 0
      set({ couponCode: code, discountAmount })
      return { discount: discountAmount, message: `Cupón aplicado: -$${discountAmount.toFixed(2)}` }
    } catch (err) {
      return { discount: 0, message: (err as Error).message }
    }
  },

  removeCoupon: () => {
    set({ couponCode: null, discountAmount: 0 })
  },
}))
