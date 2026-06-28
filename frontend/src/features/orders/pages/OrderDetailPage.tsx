import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { fetchOrder, type Order } from '../services/orderService'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Creada', color: 'bg-slate-100 text-slate-700' },
  AWAITING_PAYMENT: { label: 'Esperando pago', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Pagada', color: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'Procesando', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Enviada', color: 'bg-purple-100 text-purple-700' },
  CANCELED: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchOrder(Number(id))
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/orders" className="mb-6 inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
          &larr; Volver al historial
        </Link>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Cargando orden...</p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">{error}</div>
        ) : !order ? null : (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-950">Orden #{order.id}</h1>
                <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
              </div>
              {(() => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' }
                return <span className={`rounded-full px-4 py-1.5 text-sm font-medium ${status.color}`}>{status.label}</span>
              })()}
            </div>

            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 rounded-lg border border-slate-100 p-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-950">{item.product_title}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(item.price)} x {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-lg font-bold text-slate-950">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
