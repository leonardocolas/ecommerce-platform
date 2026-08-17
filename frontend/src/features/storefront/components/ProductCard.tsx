import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import type { CatalogProduct } from '../services/productCatalog'
import { useCartStore } from '../../cart/services/cartService'

type ProductCardProps = {
  product: CatalogProduct
  isAuthenticated: boolean
  onPurchaseIntent: (product: CatalogProduct) => void
}

const DEFAULT_PROVIDER_NAME = 'Luz Marina'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'USD' }).format(amount)
}

// ── Botón +/- para controlar cantidad desde la card ───────────────────────────
function CartQuantityControl({
  productId,
  quantity,
  stock,
  disabled,
}: {
  productId: number
  quantity: number
  stock: number
  disabled: boolean
}) {
  const { changeProductQuantity } = useCartStore()

  const atMin = quantity <= 1
  const atMax = quantity >= stock

  return (
    <div className="flex items-center justify-between rounded-2xl border border-amber-400 bg-amber-50 px-3 py-2">
      <button
        type="button"
        onClick={() => changeProductQuantity(productId, -1)}
        disabled={disabled || atMin}
        aria-label="Disminuir cantidad"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 text-amber-700 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
        </svg>
      </button>

      <span className="flex items-center gap-1.5 text-sm font-bold text-amber-800 tabular-nums">
        <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1 3h10M16 17a1 1 0 100 2 1 1 0 000-2zM9 17a1 1 0 100 2 1 1 0 000-2z" />
        </svg>
        {quantity}
        {atMax && <span className="text-[10px] font-normal text-amber-600">(máx)</span>}
      </span>

      <button
        type="button"
        onClick={() => changeProductQuantity(productId, +1)}
        disabled={disabled || atMax}
        aria-label="Aumentar cantidad"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 text-amber-700 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// ── ProductCard ───────────────────────────────────────────────────────────────
export default function ProductCard({
  product,
  isAuthenticated,
  onPurchaseIntent,
}: ProductCardProps) {
  const location = useLocation()
  const providerName = product.provider.trim() || DEFAULT_PROVIDER_NAME
  const redirectTo = `${location.pathname}${location.search}`

  const { addItem, addingProductIds, recentlyAddedIds, updatingProductIds, getCartItem } =
    useCartStore()

  const cartItem = getCartItem(product.id)
  const inCart = cartItem !== undefined
  const qtyInCart = cartItem?.quantity ?? 0

  const adding = addingProductIds.has(product.id)
  const recentlyAdded = recentlyAddedIds.has(product.id)
  const updatingQty = updatingProductIds.has(product.id)

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
      // El feedback "recién agregado" lo gestiona el store con recentlyAddedIds
    } catch (err) {
      const msg = (err as Error).message || 'No se pudo agregar al carrito'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 4000)
    }
  }

  // ── Qué muestra el botón inicial de "Agregar" (cuando NO está en carrito) ──
  function addButtonLabel() {
    if (outOfStock) return 'Sin stock'
    if (adding) return 'Agregando...'
    if (recentlyAdded) return '¡Agregado!'
    return 'Agregar al carrito'
  }

  function addButtonClass() {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition'
    if (outOfStock || adding) {
      return `${base} border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed`
    }
    if (recentlyAdded) {
      return `${base} border border-green-400 bg-green-50 text-green-700`
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
          <h3 className="mt-3 text-2xl font-semibold text-slate-950">{product.name}</h3>
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
                {/* ── Si ya está en carrito → controles +/- ─────────────────── */}
                {inCart ? (
                  <CartQuantityControl
                    productId={product.id}
                    quantity={qtyInCart}
                    stock={product.stock}
                    disabled={updatingQty}
                  />
                ) : (
                  /* ── Si NO está en carrito → botón de agregar ──────────────── */
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={adding || outOfStock}
                    className={addButtonClass()}
                  >
                    {recentlyAdded ? (
                      /* Ícono de check cuando se acaba de agregar */
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                    {addButtonLabel()}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onPurchaseIntent(product)}
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
