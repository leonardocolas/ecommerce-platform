import { useEffect, useState } from 'react'
import { adminOrderApi, type AdminOrder } from '../services/adminService'

const STATUS_OPTIONS = ['CREATED', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'CANCELED']
const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Creada', AWAITING_PAYMENT: 'Esperando pago', PAID: 'Pagada',
  PROCESSING: 'Procesando', SHIPPED: 'Enviada', CANCELED: 'Cancelada',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminOrderApi.list({ status: statusFilter || undefined }).then(setOrders).finally(() => setLoading(false))
  }, [statusFilter])

  const updateStatus = async (orderId: number, newStatus: string) => {
    await adminOrderApi.updateStatus(orderId, newStatus)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Ordenes</h1>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setStatusFilter('')} className={`rounded-lg px-3 py-1.5 text-sm ${!statusFilter ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          Todas
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-sm ${statusFilter === s ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-950">Orden #{order.id}</p>
                  <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString('es-CO')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <span className="font-bold text-slate-950">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {order.items.map((item, idx) => (
                  <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {item.product_title} x{item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
