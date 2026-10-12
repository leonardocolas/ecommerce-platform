import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useCartStore } from '../services/cartService'
import CouponInput from '../components/CouponInput'
import CheckoutModal from '../../payments/CheckoutModal'
import { useAuth } from '../../../hooks/useAuth'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: ReturnType<typeof useCartStore.getState>['items'][number]
  onUpdateQuantity: (itemId: number, qty: number) => Promise<void>
  onRemove: (itemId: number) => Promise<void>
}) {
  // Estado local solo para UI — permite cambiar el número sin esperar al servidor
  const [localQty, setLocalQty] = useState(item.quantity)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincronizar si el store actualiza desde afuera (merge, fetchCart inicial)
  useEffect(() => {
    setLocalQty(item.quantity)
  }, [item.quantity])

  const atMin = localQty <= 1
  const atMax = localQty >= item.product_stock

  const stockWarning =
    item.product_stock === 0
      ? 'Sin stock'
      : localQty >= item.product_stock
        ? `Máximo disponible: ${item.product_stock}`
        : null

  async function handleChange(newQty: number) {
    if (newQty < 1 || newQty > item.product_stock || busy) return
    setBusy(true)
    setError(null)
    setLocalQty(newQty) // cambio inmediato en la UI
    try {
      await onUpdateQuantity(item.id, newQty)
    } catch (err) {
      // El store ya revirtió — sincronizamos el local también
      setLocalQty(item.quantity)
      setError((err as Error).message || 'No se pudo actualizar')
      setTimeout(() => setError(null), 3000)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    setBusy(true)
    await onRemove(item.id)
    // El componente se desmonta al eliminar, no hace falta resetear busy
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-[24px] border bg-white/90 p-4 shadow-[0_18px_42px_-36px_rgba(17,24,39,0.8)] transition-opacity ${
        busy ? 'opacity-60' : 'opacity-100 border-[#e7dcc8]'
      }`}
    >
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f4e7d7]">
        {item.product_image ? (
          <img src={item.product_image} alt={item.product_title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="truncate text-lg font-semibold text-[#111827]">{item.product_title}</h3>
        <p className="text-sm text-slate-500">{formatCurrency(item.product_price)} c/u</p>
        {stockWarning && <p className="mt-0.5 text-xs font-medium text-amber-600">{stockWarning}</p>}
        {error && <p className="mt-0.5 text-xs font-medium text-red-500">{error}</p>}
      </div>

      <div className="flex items-center gap-1 rounded-full border border-[#e7dcc8] bg-[#fffaf5] px-2 py-1">
        <button
          onClick={() => handleChange(localQty - 1)}
          disabled={atMin || busy}
          aria-label="Disminuir cantidad"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-[#f5e8c6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums text-[#111827]">{localQty}</span>
        <button
          onClick={() => handleChange(localQty + 1)}
          disabled={atMax || busy}
          aria-label="Aumentar cantidad"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-[#f5e8c6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="w-24 text-right">
        <p className="text-lg font-semibold text-[#111827]">{formatCurrency(item.product_price * localQty)}</p>
      </div>

      <button
        onClick={handleRemove}
        disabled={busy}
        aria-label="Eliminar producto"
        className="ml-1 text-slate-300 transition hover:text-red-500 disabled:opacity-40"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const total = useCartStore((s) => s.total)
  const itemCount = useCartStore((s) => s.itemCount)
  const loading = useCartStore((s) => s.loading)
  const discountAmount = useCartStore((s) => s.discountAmount)
  const couponCode = useCartStore((s) => s.couponCode)
  const fetchCart = useCartStore((s) => s.fetchCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  const { user } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const finalTotal = total - discountAmount

  // Stock warning: any item has quantity > available stock
  const hasStockIssue = items.some((item) => item.quantity > item.product_stock)

  return (
    <div className="min-h-screen bg-[#f8f4ee]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="luxury-shell rounded-[30px] p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <span className="premium-badge">Carrito</span>
              <h1 className="mt-4 text-5xl text-[#111827]">Mi carrito</h1>
            </div>
            <span className="rounded-full border border-[#d6b06d]/50 bg-[#fffaf5] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111827]">
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <svg className="mb-3 h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#f4e7d7] text-[#111827]">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1 3h10l-1-3M16 17a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-[#111827]">Tu carrito está vacío</h3>
              <p className="mb-6 text-sm text-slate-600">Agrega productos para verlos aquí.</p>
              <Link
                to="/products"
                className="premium-button inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                Seguir comprando
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => clearCart()}
                  className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400 transition hover:text-red-500"
                >
                  Vaciar carrito
                </button>
              </div>

              <div className="flex flex-wrap justify-between gap-4 pt-3">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-full border border-[#111827]/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d6b06d] hover:text-[#111827]"
                >
                  Seguir comprando
                </Link>
              </div>

              <div className="mt-4 rounded-[26px] border border-[#e7dcc8] bg-[#fffaf5] p-6">
                <CouponInput />

                <div className="mt-4 space-y-2 border-t border-[#e7dcc8] pt-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm font-medium text-emerald-700">
                      <span>Descuento ({couponCode})</span>
                      <span>−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#e7dcc8] pt-3 text-lg font-bold text-[#111827]">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {hasStockIssue && (
                  <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
                    Algunos productos superan el stock disponible. Ajusta las cantidades para continuar.
                  </p>
                )}

                {user ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    disabled={hasStockIssue || items.length === 0}
                    className="premium-button mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Proceder al checkout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: '/cart' }}
                    className="premium-button mt-5 flex w-full items-center justify-center px-5 py-3.5 text-sm font-bold uppercase tracking-[0.18em]"
                  >
                    Inicia sesión para comprar
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  )
}
