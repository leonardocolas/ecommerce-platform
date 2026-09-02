import { useEffect, useState, useCallback } from 'react'
import { adminOrderApi, type AdminOrder } from '../services/adminService'

const STATUS_OPTIONS = ['CREATED', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'CANCELED']
const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Creada', AWAITING_PAYMENT: 'Esperando pago', PAID: 'Pagada',
  PROCESSING: 'Procesando', SHIPPED: 'Enviada', CANCELED: 'Cancelada',
}
const STATUS_COLORS: Record<string, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  CANCELED: 'bg-red-100 text-red-700',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)

  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null)
  const [refundConfirm, setRefundConfirm] = useState<AdminOrder | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [shippingCarrier, setShippingCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [exportError, setExportError] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminOrderApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, dateFrom, dateTo])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const exportOrders = async () => {
    try {
      await adminOrderApi.exportOrders()
      setExportError('')
    } catch (err) {
      setExportError((err as Error).message)
    }
  }

  const updateStatus = async (orderId: number, newStatus: string) => {
    const updated = await adminOrderApi.updateStatus(orderId, {
      status: newStatus,
      shipping_carrier: shippingCarrier,
      tracking_number: trackingNumber,
    })
    setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
    if (detailOrder?.id === orderId) {
      setDetailOrder(updated)
    }
  }

  const confirmPayment = async () => {
    if (!detailOrder) return
    setPaymentLoading(true)
    try {
      const updated = await adminOrderApi.confirmPayment(detailOrder.id, paymentNote)
      setOrders(prev => prev.map(o => o.id === detailOrder.id ? updated : o))
      setDetailOrder(updated)
      setPaymentNote('')
    } catch (err) {
      alert((err as Error).message || 'No se pudo confirmar el pago')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!refundConfirm) return
    setRefundLoading(true)
    try {
      await adminOrderApi.refund(refundConfirm.id)
      setOrders(prev => prev.map(o => o.id === refundConfirm.id ? { ...o, status: 'CANCELED' } : o))
      setRefundConfirm(null)
      setDetailOrder(null)
    } catch (err) {
      alert((err as Error).message || 'Error al procesar reembolso')
    } finally {
      setRefundLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-950">Ordenes</h1>
        <button onClick={exportOrders} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 hover:text-slate-950">Exportar CSV</button>
      </div>
      {exportError && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{exportError}</p>}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, producto o usuario..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setStatusFilter('')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${!statusFilter ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            Todas
          </button>
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${statusFilter === s ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center shadow-sm">
          <p className="text-slate-400">No se encontraron ordenes</p>
        </div>
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="font-bold text-slate-950">{formatCurrency(order.total)}</span>
                  <button
                    onClick={() => setDetailOrder(order)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Ver detalle
                  </button>
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

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setDetailOrder(null) }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-950">Orden #{detailOrder.id}</h2>
              <button onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Proforma</span><span className="font-medium text-slate-950">{detailOrder.invoice_number}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Vence el</span><span className="font-medium text-slate-950">{detailOrder.payment_due_at ? new Date(detailOrder.payment_due_at).toLocaleDateString('es-CO') : '-'}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Fecha</span><span className="font-medium text-slate-950">{new Date(detailOrder.created_at).toLocaleString('es-CO')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Estado</span>
                <select value={detailOrder.status} onChange={(e) => updateStatus(detailOrder.id, e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Items</span><span className="font-medium text-slate-950">{detailOrder.items.length}</span></div>
            </div>

            <h3 className="font-semibold text-slate-950 text-sm mb-2">Productos</h3>
            <div className="space-y-2 mb-4">
              {detailOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                    {item.product_image ? <img src={item.product_image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300">-</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.product_title}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.price)} x {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(detailOrder.total)}</span>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-950">Envío</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={shippingCarrier} onChange={(e) => setShippingCarrier(e.target.value)} placeholder={detailOrder.shipping_carrier || 'Transportista'} className="rounded border border-slate-200 px-3 py-2 text-sm" />
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder={detailOrder.tracking_number || 'Número de seguimiento'} className="rounded border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>

            {detailOrder.status === 'AWAITING_PAYMENT' && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h3 className="text-sm font-semibold text-slate-950">Confirmar transferencia</h3>
                <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Nota interna opcional" className="mt-2 min-h-16 w-full rounded border border-amber-200 px-3 py-2 text-sm" />
                <button onClick={confirmPayment} disabled={paymentLoading} className="mt-2 w-full rounded-full bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{paymentLoading ? 'Confirmando...' : 'Marcar como pagada'}</button>
              </div>
            )}

            {(detailOrder.status === 'PAID' || detailOrder.status === 'PROCESSING') && (
              <button
                onClick={() => { setRefundConfirm(detailOrder) }}
                className="mt-4 w-full rounded-full border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Reembolsar orden
              </button>
            )}
          </div>
        </div>
      )}

      {/* Refund Confirmation */}
      {refundConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && !refundLoading) setRefundConfirm(null) }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
            </div>
            <h3 className="text-center text-lg font-bold text-slate-950">Reembolsar orden #{refundConfirm.id}</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Se reembolsaran <span className="font-semibold">{formatCurrency(refundConfirm.total)}</span> y se restaurara el stock.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setRefundConfirm(null)} disabled={refundLoading} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
              <button onClick={handleRefund} disabled={refundLoading} className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
                {refundLoading ? 'Procesando...' : 'Confirmar reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
