import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  adminDashboardApi,
  type DashboardStats,
} from '../services/adminService'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

const PERIODS = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: 'all', label: 'Todo' },
]

const STATUS_COLORS: Record<string, string> = {
  CREATED: '#94a3b8',
  AWAITING_PAYMENT: '#f59e0b',
  PAID: '#22c55e',
  PROCESSING: '#3b82f6',
  SHIPPED: '#8b5cf6',
  CANCELED: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Creada',
  AWAITING_PAYMENT: 'Esperando pago',
  PAID: 'Pagada',
  PROCESSING: 'Procesando',
  SHIPPED: 'Enviada',
  CANCELED: 'Cancelada',
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, subtitle, icon }: {
  label: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [period, setPeriod] = useState('all')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminDashboardApi.stats(period)
      setStats(data)
      setError(null)
    } catch {
      setError('No se pudieron cargar las estadisticas. Comprueba la sesion y vuelve a intentarlo.')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchStats() }, [fetchStats])

  const s = stats?.summary

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                period === p.key
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="py-20 text-center text-slate-400">
          <svg className="mx-auto mb-3 h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Cargando estadisticas...</p>
        </div>
      ) : error && !stats ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => void fetchStats()} className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800">
            Reintentar
          </button>
        </div>
      ) : stats ? (
        <>
          {error ? <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error} Mostrando los ultimos datos disponibles.</p> : null}
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Ingresos"
              value={formatCurrency(s?.total_revenue ?? 0)}
              subtitle={`${s?.paid_orders ?? 0} ordenes pagadas`}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Ordenes totales"
              value={s?.total_orders ?? 0}
              subtitle={`${((s?.paid_orders ?? 0) / Math.max(s?.total_orders ?? 1, 1) * 100).toFixed(0)}% tasa de conversion`}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              label="Clientes nuevos"
              value={s?.total_users ?? 0}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
            />
            <StatCard
              label="Productos"
              value={s?.total_products ?? 0}
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
          </div>

          {/* Revenue Chart + Orders by Status */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">Ingresos</h2>
              {stats.revenue_chart.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No hay datos de ingresos para este periodo</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.revenue_chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                      labelFormatter={(label) => formatDateShort(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">Ordenes por estado</h2>
              {stats.status_chart.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.status_chart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.status_chart.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, STATUS_LABELS[name] || name]}
                    />
                    <Legend
                      formatter={(value) => STATUS_LABELS[value] || value}
                      iconSize={10}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products + Customer Trends */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">Top productos mas vendidos</h2>
              {stats.top_products.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No hay ventas registradas</p>
              ) : (
                <div className="space-y-3">
                  {stats.top_products.map((product, idx) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {idx + 1}
                      </div>
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {product.image ? (
                          <img src={product.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">{product.title}</p>
                        <p className="text-xs text-slate-500">{product.total_sold} vendidos</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">{formatCurrency(product.total_revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-950">Clientes nuevos</h2>
              {stats.customers_chart.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No hay datos de clientes para este periodo</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.customers_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateShort}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, 'Clientes']}
                      labelFormatter={(label) => formatDateShort(label)}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
