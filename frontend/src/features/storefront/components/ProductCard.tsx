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
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function ProductCard({
  product,
  isAuthenticated,
  onPurchaseIntent,
}: ProductCardProps) {
  const location = useLocation()
  const providerName = product.provider.trim() || DEFAULT_PROVIDER_NAME
  const redirectTo = `${location.pathname}${location.search}`
  const { addItem } = useCartStore()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAddToCart = async () => {
    if (!isAuthenticated) return
    setAdding(true)
    try {
      await addItem(product.id, 1)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch {
      // silent
    } finally {
      setAdding(false)
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.5)]">
      <div className="relative h-52 overflow-hidden bg-[linear-gradient(135deg,#f59e0b_0%,#facc15_48%,#86efac_100%)]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.68)_100%)]" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900">
            {product.categoryLabel}
          </span>
          <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
            Stock {product.stock}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{providerName}</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">{product.name}</h3>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>

        <div className="mt-auto pt-6">
          <p className="text-2xl font-semibold text-slate-950">{formatCurrency(product.price)}</p>

          <div className="mt-6 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding || product.stock <= 0}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-950 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white disabled:opacity-50"
                >
                  {adding ? 'Agregando...' : added ? 'Agregado' : 'Agregar al carrito'}
                </button>
                <button
                  type="button"
                  onClick={() => onPurchaseIntent(product)}
                  disabled={product.stock <= 0}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950 disabled:opacity-50"
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
