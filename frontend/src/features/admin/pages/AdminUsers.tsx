import { useCallback, useEffect, useState } from 'react'
import { adminUserApi, type AdminUser, type AdminOrder } from '../services/adminService'

const ROLE_OPTIONS = ['USER', 'PROVIDER', 'STAFF', 'ADMIN']
const ROLE_LABELS: Record<string, string> = { USER: 'Usuario', PROVIDER: 'Proveedor', STAFF: 'Staff', ADMIN: 'Admin' }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [historyUser, setHistoryUser] = useState<AdminUser | null>(null)
  const [purchaseHistory, setPurchaseHistory] = useState<AdminOrder[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminUserApi.list({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter || undefined,
      })
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, activeFilter])

  useEffect(() => { void loadUsers() }, [loadUsers])

  const handleSearch = () => { void loadUsers() }

  const toggleActive = async (user: AdminUser) => {
    await adminUserApi.toggleActive(user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
  }

  const changeRole = async (userId: number, role: string) => {
    await adminUserApi.changeRole(userId, role)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  const openHistory = async (user: AdminUser) => {
    setHistoryUser(user)
    setHistoryLoading(true)
    try {
      const data = await adminUserApi.purchaseHistory(user.id)
      setPurchaseHistory(data)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Usuarios</h1>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por nombre o email..."
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
            <option value="">Todos los roles</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Usuario</th>
                <th className="px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 font-medium text-slate-600">Rol</th>
                <th className="px-4 py-3 font-medium text-slate-600">Ordenes</th>
                <th className="px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-950">{user.username}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none">
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.order_count}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setEditingUser(user)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">Editar</button>
                      <button onClick={() => openHistory(user)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100">Historial</button>
                      <button onClick={() => toggleActive(user)} className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50">
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(data) => {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u))
            setEditingUser(null)
          }}
        />
      )}

      {/* Purchase History Modal */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setHistoryUser(null); setPurchaseHistory([]) } }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Historial de compras</h2>
                <p className="text-sm text-slate-500">{historyUser.username}</p>
              </div>
              <button onClick={() => { setHistoryUser(null); setPurchaseHistory([]) }} className="text-slate-400 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {historyLoading ? (
              <p className="py-8 text-center text-slate-400 text-sm">Cargando historial...</p>
            ) : purchaseHistory.length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-sm">Este usuario no tiene ordenes</p>
            ) : (
              <div className="space-y-3">
                {purchaseHistory.map((order) => (
                  <div key={order.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-950">Orden #{order.id}</p>
                        <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('es-CO')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-950 text-sm">{formatCurrency(order.total)}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : order.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {item.product_title} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EditUserModal({ user, onClose, onSave }: { user: AdminUser; onClose: () => void; onSave: (data: { username: string; email: string }) => void }) {
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError('')
    try {
      const result = await adminUserApi.updateProfile(user.id, { username: username.trim(), email: email.trim() })
      onSave(result)
    } catch (err) {
      setError((err as Error).message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-950 mb-4">Editar usuario</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
