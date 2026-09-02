import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
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

async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  return sharedApiFetch(path, options, sessionHeaders())
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface CartItemData {
  id: number
  product_id: number
  product_title: string
  product_price: number
  product_image: string | null
  product_stock: number
  quantity: number
  subtotal: number
  variant_id: number | null
}

export interface CartState {
  items: CartItemData[]
  total: number
  itemCount: number
  loading: boolean
  couponCode: string | null
  discountAmount: number
  addingProductIds: Set<number>
  recentlyAddedIds: Set<number>
  updatingProductIds: Set<number>

  fetchCart: () => Promise<void>
  addItem: (productId: number, quantity?: number, variantId?: number) => Promise<void>
  removeItem: (itemId: number, productId?: number) => Promise<void>
  updateQuantity: (itemId: number, quantity: number) => Promise<void>
  changeProductQuantity: (productId: number, delta: number) => Promise<void>
  clearCart: () => Promise<void>
  mergeCart: () => Promise<void>
  applyCoupon: (code: string) => Promise<{ discount: number; message: string }>
  removeCoupon: () => void
  getCartItem: (productId: number) => CartItemData | undefined
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCartResponse(data: unknown) {
  if (!data || typeof data !== 'object') return { items: [] as CartItemData[], total: 0, itemCount: 0 }
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

/**
 * Recalcula total e itemCount desde el array de items local,
 * sin necesidad de hacer un GET al servidor.
 */
function deriveCartTotals(items: CartItemData[]) {
  const total = items.reduce((sum, i) => sum + i.product_price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  return { total, itemCount }
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

  getCartItem: (productId) => get().items.find((i) => i.product_id === productId),

  // ── fetchCart — solo para carga inicial y post-merge ──────────────────────
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

  // ── addItem — actualiza estado local, sin re-fetch ────────────────────────
  addItem: async (productId, quantity = 1, variantId) => {
    const { addingProductIds } = get()
    if (addingProductIds.has(productId)) return

    set({ addingProductIds: new Set([...addingProductIds, productId]) })

    try {
      const raw = await apiFetch('/cart/items/add/', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity, ...(variantId ? { variant_id: variantId } : {}) }),
      })
      // El servidor devuelve el CartItem actualizado — lo aplicamos localmente
      const serverItem = raw as CartItemData
      set((s) => {
        const exists = s.items.some((i) => i.product_id === productId)
        const nextItems = exists
          ? s.items.map((i) => (i.product_id === productId ? serverItem : i))
          : [...s.items, serverItem]
        return { items: nextItems, ...deriveCartTotals(nextItems) }
      })

      // Feedback "¡Agregado!" durante 2 s (gestionado en el store, no en la card)
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

  // ── removeItem — elimina del estado local, sin re-fetch ───────────────────
  removeItem: async (itemId, productId?) => {
    // Optimista: quitar del estado antes de la llamada
    set((s) => {
      const nextItems = s.items.filter((i) => i.id !== itemId)
      // Si se provee productId, limpiar también el feedback "recién agregado"
      const nextRecentlyAdded = productId
        ? (() => { const n = new Set(s.recentlyAddedIds); n.delete(productId); return n })()
        : s.recentlyAddedIds
      return { items: nextItems, recentlyAddedIds: nextRecentlyAdded, ...deriveCartTotals(nextItems) }
    })
    try {
      await apiFetch(`/cart/items/${itemId}/`, { method: 'DELETE' })
    } catch {
      // Revertir si falla
      await get().fetchCart()
    }
  },

  // ── updateQuantity (por itemId, usado en CartPage) — sin re-fetch ─────────
  updateQuantity: async (itemId, quantity) => {
    // Actualización optimista inmediata
    set((s) => {
      const nextItems = s.items.map((i) =>
        i.id === itemId
          ? { ...i, quantity, subtotal: i.product_price * quantity }
          : i,
      )
      return { items: nextItems, ...deriveCartTotals(nextItems) }
    })
    try {
      await apiFetch(`/cart/items/${itemId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      })
    } catch {
      // Revertir si el servidor rechaza (ej. stock insuficiente)
      await get().fetchCart()
    }
  },

  // ── changeProductQuantity (por productId, usado en ProductCard) ───────────
  changeProductQuantity: async (productId, delta) => {
    const { updatingProductIds } = get()
    if (updatingProductIds.has(productId)) return

    const cartItem = get().getCartItem(productId)
    if (!cartItem) return

    const newQty = cartItem.quantity + delta
    // Bloquear mientras vuela la petición (solo deshabilita el botón, no recarga nada)
    set((s) => ({ updatingProductIds: new Set([...s.updatingProductIds, productId]) }))

    // Actualización optimista: cambia el número en el store inmediatamente
    if (newQty <= 0) {
      set((s) => {
        const nextItems = s.items.filter((i) => i.product_id !== productId)
        return { items: nextItems, ...deriveCartTotals(nextItems) }
      })
    } else {
      set((s) => {
        const nextItems = s.items.map((i) =>
          i.product_id === productId
            ? { ...i, quantity: newQty, subtotal: i.product_price * newQty }
            : i,
        )
        return { items: nextItems, ...deriveCartTotals(nextItems) }
      })
    }

    try {
      if (newQty <= 0) {
        await apiFetch(`/cart/items/${cartItem.id}/`, { method: 'DELETE' })
      } else {
        await apiFetch(`/cart/items/${cartItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: newQty }),
        })
      }
      // Éxito: el estado local ya es correcto, no hay re-fetch
    } catch {
      // Solo revertir si el servidor lo rechaza
      await get().fetchCart()
    } finally {
      set((s) => {
        const next = new Set(s.updatingProductIds)
        next.delete(productId)
        return { updatingProductIds: next }
      })
    }
  },

  // ── clearCart ─────────────────────────────────────────────────────────────
  clearCart: async () => {
    await apiFetch('/cart/clear/', { method: 'DELETE' })
    set({ items: [], total: 0, itemCount: 0, couponCode: null, discountAmount: 0, recentlyAddedIds: new Set() })
  },

  // ── mergeCart — sí necesita re-fetch porque el servidor fusiona dos carritos
  mergeCart: async () => {
    try {
      await apiFetch('/cart/merge/', { method: 'POST' })
      await get().fetchCart()
    } catch {
      // silent
    }
  },

  // ── applyCoupon ───────────────────────────────────────────────────────────
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

  removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
}))

// ── Selectores granulares (evitan re-renders innecesarios) ────────────────────

/** Solo re-renderiza cuando cambia itemCount — para el Navbar badge */
export function useCartItemCount() {
  return useCartStore((s) => s.itemCount)
}

/** Solo re-renderiza cuando cambia el item de este producto — para ProductCard */
export function useCartItemForProduct(productId: number) {
  return useCartStore(
    useShallow((s) => {
      const item = s.items.find((i) => i.product_id === productId)
      return {
        cartItem: item,
        inCart: item !== undefined,
        qtyInCart: item?.quantity ?? 0,
        adding: s.addingProductIds.has(productId),
        recentlyAdded: s.recentlyAddedIds.has(productId),
        updatingQty: s.updatingProductIds.has(productId),
      }
    }),
  )
}
