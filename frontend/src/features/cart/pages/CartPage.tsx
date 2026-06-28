import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useCartStore } from '../services/cartService'
import CouponInput from '../components/CouponInput'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: ReturnType<typeof useCartStore.getState>['items'][number]
  onUpdateQuantity: (itemId: number, qty: number) => void
  onRemove: (itemId: number) => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
        <h3 className="truncate font-semibold text-slate-950">{item.product_title}</h3>
        <p className="text-sm text-slate-500">{formatCurrency(item.product_price)} c/u</p>
        {item.quantity > item.product_stock && (
          <p className="text-xs text-red-500">Stock disponible: {item.product_stock}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          -
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, Math.min(item.product_stock, item.quantity + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          +
        </button>
      </div>

      <div className="w-24 text-right font-semibold text-slate-950">{formatCurrency(item.subtotal)}</div>

      <button
        onClick={() => onRemove(item.id)}
        className="ml-2 text-slate-400 transition hover:text-red-500"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function CartPage() {
  const { items, total, itemCount, loading, discountAmount, couponCode, fetchCart, removeItem, updateQuantity, clearCart, removeCoupon } = useCartStore()

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const finalTotal = total - discountAmount

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-950">Mi Carrito</h1>
            <span className="text-sm text-slate-500">{itemCount} productos</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <p>Cargando carrito...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1 3h10l-1-3M16 17a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Tu carrito esta vacio</h3>
              <p className="mb-6">Agrega productos para verlos aqui.</p>
              <Link
                to="/"
                className="inline-flex items-center rounded-full bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Continuar comprando
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => clearCart()}
                  className="text-sm text-red-500 transition hover:text-red-700"
                >
                  Vaciar carrito
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
                <CouponInput />

                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento ({couponCode})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-950">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                <button className="mt-6 w-full rounded-full bg-amber-400 py-3 font-semibold text-slate-950 transition hover:bg-amber-300">
                  Proceder al pago
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
