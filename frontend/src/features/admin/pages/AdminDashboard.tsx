import { useEffect, useState } from 'react'
import { adminUserApi, adminOrderApi, adminProductApi, type AdminUser, type AdminOrder, type AdminProduct } from '../services/adminService'

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])

  useEffect(() => {
    adminUserApi.list().then(setUsers).catch(() => {})
    adminOrderApi.list().then(setOrders).catch(() => {})
    adminProductApi.list().then(setProducts).catch(() => {})
  }, [])

  const recentOrders = orders.slice(0, 5)
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.total, 0)

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-slate-950">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos" value={products.length} color="text-blue-600" />
        <StatCard label="Usuarios" value={users.length} color="text-purple-600" />
        <StatCard label="Ordenes totales" value={orders.length} color="text-green-600" />
        <StatCard label="Ingresos" value={formatCurrency(totalRevenue)} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-950">Ordenes recientes</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400">No hay ordenes aun</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">Orden #{order.id}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">{formatCurrency(order.total)}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                      order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      order.status === 'CANCELED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-950">Productos con bajo stock</h2>
          {products.filter(p => p.variant_inventory_qty <= 5).length === 0 ? (
            <p className="text-sm text-slate-400">Todos los productos tienen stock suficiente</p>
          ) : (
            <div className="space-y-3">
              {products.filter(p => p.variant_inventory_qty <= 5).slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{product.title}</p>
                    <p className="text-xs text-slate-500">{product.vendor || 'Sin proveedor'}</p>
                  </div>
                  <span className={`font-semibold ${product.variant_inventory_qty === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {product.variant_inventory_qty} uds
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
