import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { fetchOrders, type Order } from '../services/orderService'

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
  return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await fetchOrders({
        status: statusFilter || undefined,
        search: searchFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setOrders(data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-slate-950">Mi Historial de Compras</h1>

        <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Buscar</label>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Nombre de producto..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value="">Todos</option>
                <option value="CREATED">Creada</option>
                <option value="AWAITING_PAYMENT">Esperando pago</option>
                <option value="PAID">Pagada</option>
                <option value="PROCESSING">Procesando</option>
                <option value="SHIPPED">Enviada</option>
                <option value="CANCELED">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={loadOrders} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              Filtrar
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Cargando ordenes...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <p className="mb-4 text-slate-500">No se encontraron ordenes</p>
            <Link to="/products" className="rounded-full bg-amber-400 px-6 py-2 font-semibold text-slate-950 transition hover:bg-amber-300">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700' }
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">Orden #{order.id}</p>
                      <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-bold text-slate-950">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        {item.product_title} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
