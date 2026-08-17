import { create } from 'zustand'
import { apiFetch as sharedApiFetch } from '../../../lib/apiFetch'

const SESSION_KEY_STORAGE_KEY = 'tienda.sessionKey'

function getOrCreateSessionKey(): string {
  const stored = localStorage.getItem(SESSION_KEY_STORAGE_KEY)
  if (stored) return stored
  const key = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY_STORAGE_KEY, key)
  return key
}

function sessionHeaders(): Record<string, string> {
  return { 'X-Session-Key': getOrCreateSessionKey() }
}

// Cart-specific fetch: always adds the session key header for anonymous support
async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  return sharedApiFetch(path, options, sessionHeaders())
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

  /**
   * IDs de producto cuyo botón está en vuelo (POST /cart/items/add/ en curso).
   * Evita doble envío y muestra spinner en la card correspondiente.
   */
  addingProductIds: Set<number>

  /**
   * IDs de producto que se acaban de agregar (feedback ¡Agregado! por 2 s).
   * El timer de limpieza corre dentro del store para que sea independiente
   * del ciclo de vida de cada ProductCard.
   */
  recentlyAddedIds: Set<number>

  /**
   * IDs de producto cuya cantidad está siendo actualizada (PATCH en curso).
   * Se usa para deshabilitar los +/- mientras la petición vuela.
   */
  updatingProductIds: Set<number>

  // ── Acciones ──────────────────────────────────────────────────────────────
  fetchCart: () => Promise<void>
  addItem: (productId: number, quantity?: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  /**
   * Incrementa o decrementa la cantidad de un producto directamente por su
   * product_id (útil desde la ProductCard sin necesidad de conocer el itemId).
   * delta = +1 | -1. Si la nueva cantidad llega a 0, elimina el item.
   */
  changeProductQuantity: (productId: number, delta: number) => Promise<void>
  clearCart: () => Promise<void>
  mergeCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<{ discount: number; message: string }>
  removeCoupon: () => void

  /** Devuelve el CartItemData del producto si ya está en el carrito. */
  getCartItem: (productId: number) => CartItemData | undefined
}

function parseCartResponse(data: unknown) {
  if (!data || typeof data !== 'object') return { items: [], total: 0, itemCount: 0 }
  const d = data as Record<string, unknown>
  return {
    items: Array.isArray(d.items) ? (d.items as CartItemData[]) : [],
    total:
      typeof d.total === 'string'
        ? parseFloat(d.total)
        : typeof d.total === 'number'
          ? d.total
          : 0,
    itemCount: typeof d.item_count === 'number' ? d.item_count : 0,
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  couponCode: null,
  discountAmount: 0,
  addingProductIds: new Set<number>(),
  recentlyAddedIds: new Set<number>(),
  updatingProductIds: new Set<number>(),

  // ── Selector ────────────────────────────────────────────────────────────────
  getCartItem: (productId) => get().items.find((i) => i.product_id === productId),

  // ── fetchCart ────────────────────────────────────────────────────────────────
  fetchCart: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch('/cart/current/')
      const parsed = parseCartResponse(data)
      set({ ...parsed, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  // ── addItem ──────────────────────────────────────────────────────────────────
  addItem: async (productId, quantity = 1) => {
    const { addingProductIds } = get()
    if (addingProductIds.has(productId)) return

    set({ addingProductIds: new Set([...addingProductIds, productId]) })

    try {
      await apiFetch('/cart/items/add/', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      })
      await get().fetchCart()

      // Marcar como recién agregado y programar la limpieza
      set((s) => ({ recentlyAddedIds: new Set([...s.recentlyAddedIds, productId]) }))
      setTimeout(() => {
        set((s) => {
          const next = new Set(s.recentlyAddedIds)
          next.delete(productId)
          return { recentlyAddedIds: next }
        })
      }, 2000)
    } finally {
      set((s) => {
        const next = new Set(s.addingProductIds)
        next.delete(productId)
        return { addingProductIds: next }
      })
    }
  },

  // ── removeItem (por itemId — usado en CartPage) ───────────────────────────
  removeItem: async (itemId) => {
    await apiFetch(`/cart/items/${itemId}/`, { method: 'DELETE' })
    await get().fetchCart()
  },

  // ── updateQuantity (por itemId — usado en CartPage) ──────────────────────
  updateQuantity: async (itemId, quantity) => {
    await apiFetch(`/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
    await get().fetchCart()
  },

  // ── changeProductQuantity (por productId — usado en ProductCard) ──────────
  changeProductQuantity: async (productId, delta) => {
    const { updatingProductIds } = get()
    if (updatingProductIds.has(productId)) return

    const cartItem = get().getCartItem(productId)
    if (!cartItem) return

    const newQty = cartItem.quantity + delta

    // Actualización optimista: refleja el cambio inmediatamente en la UI
    set((s) => ({
      updatingProductIds: new Set([...s.updatingProductIds, productId]),
      items: s.items.map((i) =>
        i.product_id === productId ? { ...i, quantity: newQty, subtotal: i.product_price * newQty } : i,
      ),
    }))

    try {
      if (newQty <= 0) {
        await apiFetch(`/cart/items/${cartItem.id}/`, { method: 'DELETE' })
      } else {
        await apiFetch(`/cart/items/${cartItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: newQty }),
        })
      }
      // Resync con el servidor para reflejar totales correctos
      await get().fetchCart()
    } catch {
      // Revertir la actualización optimista si el servidor la rechaza
      await get().fetchCart()
    } finally {
      set((s) => {
        const next = new Set(s.updatingProductIds)
        next.delete(productId)
        return { updatingProductIds: next }
      })
    }
  },

  // ── clearCart ────────────────────────────────────────────────────────────────
  clearCart: async () => {
    await apiFetch('/cart/clear/', { method: 'DELETE' })
    set({
      items: [],
      total: 0,
      itemCount: 0,
      couponCode: null,
      discountAmount: 0,
      recentlyAddedIds: new Set(),
    })
  },

  // ── mergeCart ────────────────────────────────────────────────────────────────
  mergeCart: async () => {
    try {
      await apiFetch('/cart/merge/', { method: 'POST' })
      await get().fetchCart()
    } catch {
      // silent — merge no debe bloquear el login
    }
  },

  // ── applyCoupon ──────────────────────────────────────────────────────────────
  applyCoupon: async (code) => {
    try {
      const data = await apiFetch('/coupons/validate/', {
        method: 'POST',
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

  // ── removeCoupon ─────────────────────────────────────────────────────────────
  removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
}))
