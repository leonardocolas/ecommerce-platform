import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import type { CatalogProduct } from '../services/productCatalog'
import { useCartStore, useCartItemForProduct } from '../../cart/services/cartService'

type ProductCardProps = {
  product: CatalogProduct
  isAuthenticated: boolean
  onPurchaseIntent: (product: CatalogProduct) => void
}

const DEFAULT_PROVIDER_NAME = 'Luz Marina'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(amount)
}

// ── ProductCard ───────────────────────────────────────────────────────────────
export default function ProductCard({
  product,
  isAuthenticated,
  onPurchaseIntent,
}: ProductCardProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const providerName = product.provider.trim() || DEFAULT_PROVIDER_NAME
  const redirectTo = `${location.pathname}${location.search}`

  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)

  // Selector granular: solo re-renderiza esta card cuando cambia SU producto
  const { cartItem, inCart, qtyInCart, adding, recentlyAdded, updatingQty } =
    useCartItemForProduct(product.id)

  const outOfStock = product.stock <= 0
  // Solo bloqueamos si ya tiene el máximo exacto en el carrito
  const atStockLimit = qtyInCart >= product.stock && product.stock > 0

  // Error de red — local y efímero (4 s)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleAddToCart() {
    if (!isAuthenticated || adding || outOfStock || atStockLimit) return
    setErrorMsg(null)
    try {
      await addItem(product.id, 1)
    } catch (err) {
      const msg = (err as Error).message || 'No se pudo agregar al carrito'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  async function handleRemoveFromCart() {
    if (!cartItem) return
    try {
      await removeItem(cartItem.id, product.id)
    } catch (err) {
      const msg = (err as Error).message || 'No se pudo remover del carrito'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  async function handleBuyNow() {
    if (outOfStock) {
      onPurchaseIntent(product)
      return
    }

    if (!isAuthenticated) {
      onPurchaseIntent(product)
      return
    }

    if (adding || atStockLimit || inCart) {
      navigate('/cart')
      return
    }

    setErrorMsg(null)
    try {
      await addItem(product.id, 1)
      navigate('/cart')
    } catch (err) {
      const msg = (err as Error).message || 'No se pudo agregar al carrito'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  // ── Qué muestra el botón de "Agregar" (cuando NO está en carrito y no es recentlyAdded) ──
  function addButtonLabel() {
    if (outOfStock) return 'Sin stock'
    if (adding) return 'Agregando...'
    return 'Agregar al carrito'
  }

  function addButtonClass() {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition'
    if (outOfStock || adding) {
      return `${base} border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed`
    }
    return `${base} rounded-2xl border border-[#111827] bg-[#111827] text-white hover:bg-[#d6b06d] hover:text-[#111827]`
  }

  return (
    <article className="premium-card group flex h-full flex-col overflow-hidden rounded-[30px] p-0 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-50px_rgba(17,24,39,0.7)]">
      <div className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,#f4e7d7_0%,#e9efe5_45%,#dfe7f7_100%)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.08)_0%,rgba(17,24,39,0.68)_100%)]" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#f8f4ee]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1f2937] backdrop-blur-sm">
            {product.categoryLabel}
          </span>
          <span className="rounded-full bg-[#111827]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f8e7c2] backdrop-blur-sm">
            Stock {product.stock}
          </span>
        </div>

        {inCart && (
          <div className="absolute right-4 top-4">
            <span className="flex items-center gap-1 rounded-full bg-[#d6b06d] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#111827] shadow-md">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1 3h10M16 17a1 1 0 100 2 1 1 0 000-2zM9 17a1 1 0 100 2 1 1 0 000-2z"
                />
              </svg>
              {qtyInCart}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#b78a44]">{providerName}</p>
          <Link to={`/products/${product.slug}`} className="mt-3 block text-2xl font-semibold text-[#111827] hover:text-[#b78a44]">
            {product.name}
          </Link>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-[#111827]">{formatCurrency(product.price)}</p>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Premium</span>
          </div>

          {/* Error feedback */}
          {errorMsg && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                {/*
                 * Prioridad de estados del botón:
                 * 1. recentlyAdded  → verde "¡Agregado!" (2 s de feedback, aunque inCart ya sea true)
                 * 2. inCart         → rojo "Remover del carrito"
                 * 3. default        → "Agregar al carrito"
                 */}
                {recentlyAdded ? (
                  /* ── Feedback inmediato tras agregar ────────────────────────── */
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-green-400 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 cursor-default"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Agregado!
                  </button>
                ) : inCart ? (
                  /* ── Producto en carrito → Remover ──────────────────────────── */
                  <button
                    type="button"
                    onClick={handleRemoveFromCart}
                    disabled={updatingQty}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remover del carrito
                  </button>
                ) : (
                  /* ── Producto no está en carrito → Agregar ──────────────────── */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={adding || outOfStock}
                    className={addButtonClass()}
                  >
                    {addButtonLabel()}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={adding}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d6b06d] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding ? 'Agregando...' : 'Comprar ahora'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className="inline-flex items-center justify-center rounded-2xl border border-[#111827] bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#d6b06d] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Comprar ahora
                </button>
                <Link
                  to="/register"
                  state={{ redirectTo, actionLabel: `comprar ${product.name}` }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#d6b06d] hover:text-[#111827]"
                >
                  Registrarme para comprar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
