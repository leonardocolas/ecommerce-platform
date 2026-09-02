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
    return `${base} border border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white`
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)]">
      {/* ── Imagen ──────────────────────────────────────────────────────────── */}
      <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#f59e0b_0%,#facc15_48%,#86efac_100%)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.68)_100%)]" />

        {/* Badge de categoría y stock */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
            {product.categoryLabel}
          </span>
          <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
            Stock {product.stock}
          </span>
        </div>

        {/* Badge "En carrito" — persiste mientras el producto esté en el carrito */}
        {inCart && (
          <div className="absolute right-4 top-4">
            <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-md">
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

      {/* ── Información ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{providerName}</p>
          <Link to={`/products/${product.slug}`} className="mt-3 block text-2xl font-semibold text-slate-950 hover:text-amber-600">
            {product.name}
          </Link>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>

        <div className="mt-auto pt-6">
          <p className="text-2xl font-semibold text-slate-950">{formatCurrency(product.price)}</p>

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
                 * Prioridad de estados del botón principal:
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
                  onClick={() => navigate('/cart')}
                  disabled={outOfStock}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Comprar ahora
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onPurchaseIntent(product)}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950"
                >
                  Inicia sesion para comprar
                </button>
                <Link
                  to="/register"
                  state={{ redirectTo, actionLabel: `comprar ${product.name}` }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
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
