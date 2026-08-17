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
  updating,
}: {
  item: ReturnType<typeof useCartStore.getState>['items'][number]
  onUpdateQuantity: (itemId: number, qty: number) => Promise<void>
  onRemove: (itemId: number) => Promise<void>
  updating: boolean
}) {
  const [localQty, setLocalQty] = useState(item.quantity)
  const [busy, setBusy] = useState(false)

  // Sync local qty if the store updates from outside (e.g. fetchCart)
  useEffect(() => {
    setLocalQty(item.quantity)
  }, [item.quantity])

  const atMin = localQty <= 1
  const atMax = localQty >= item.product_stock
  const stockWarning = item.product_stock === 0
    ? 'Sin stock'
    : localQty >= item.product_stock
      ? `Máximo disponible: ${item.product_stock}`
      : null

  async function handleChange(newQty: number) {
    if (newQty < 1 || newQty > item.product_stock || busy) return
    setBusy(true)
    setLocalQty(newQty)
    try {
      await onUpdateQuantity(item.id, newQty)
    } catch {
      // Revert on error
      setLocalQty(item.quantity)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    setBusy(true)
    await onRemove(item.id)
    // no need to reset busy — component unmounts after removal
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-opacity ${
        busy || updating ? 'opacity-60' : 'opacity-100 border-slate-100'
      }`}
    >
      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {item.product_image ? (
          <img
            src={item.product_image}
            alt={item.product_title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate font-semibold text-slate-950">{item.product_title}</h3>
        <p className="text-sm text-slate-500">{formatCurrency(item.product_price)} c/u</p>
        {stockWarning && (
          <p className="mt-0.5 text-xs font-medium text-amber-600">{stockWarning}</p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleChange(localQty - 1)}
          disabled={atMin || busy}
          aria-label="Disminuir cantidad"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums text-slate-950">
          {localQty}
        </span>
        <button
          onClick={() => handleChange(localQty + 1)}
          disabled={atMax || busy}
          aria-label="Aumentar cantidad"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="w-24 text-right">
        <p className="font-semibold text-slate-950">{formatCurrency(item.product_price * localQty)}</p>
      </div>

      {/* Remove */}
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
  const {
    items,
    total,
    itemCount,
    loading,
    discountAmount,
    couponCode,
    fetchCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore()

  const { user } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const finalTotal = total - discountAmount

  // Stock warning: any item has quantity > available stock
  const hasStockIssue = items.some((item) => item.quantity > item.product_stock)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-950">Mi Carrito</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </span>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <svg className="mb-3 h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm">Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <div className="py-12 text-center text-slate-400">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1 3h10l-1-3M16 17a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-700">Tu carrito esta vacio</h3>
              <p className="mb-6 text-sm">Agrega productos para verlos aqui.</p>
              <Link
                to="/"
                className="inline-flex items-center rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Continuar comprando
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Items */}
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  updating={loading}
                />
              ))}

              {/* Clear cart */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => clearCart()}
                  className="text-sm text-slate-400 transition hover:text-red-500"
                >
                  Vaciar carrito
                </button>
              </div>

              {/* Summary panel */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-6">
                <CouponInput />

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Descuento ({couponCode})</span>
                      <span>−{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-950">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {/* Stock warning */}
                {hasStockIssue && (
                  <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 border border-red-100">
                    Algunos productos superan el stock disponible. Ajusta las cantidades para continuar.
                  </p>
                )}

                {/* Checkout button */}
                {user ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    disabled={hasStockIssue || items.length === 0}
                    className="mt-5 w-full rounded-full bg-amber-400 py-3 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Proceder al pago
                  </button>
                ) : (
                  <Link
                    to="/login"
                    state={{ from: '/cart' }}
                    className="mt-5 block w-full rounded-full bg-amber-400 py-3 text-center font-semibold text-slate-950 transition hover:bg-amber-300"
                  >
                    Inicia sesion para comprar
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Checkout modal */}
      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  )
}
