import { useCallback, useEffect, useState } from 'react'
import { adminUserApi, type AdminUser } from '../services/adminService'

const ROLE_OPTIONS = ['USER', 'PROVIDER', 'STAFF', 'ADMIN']
const ROLE_LABELS: Record<string, string> = { USER: 'Usuario', PROVIDER: 'Proveedor', STAFF: 'Staff', ADMIN: 'Admin' }

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminUserApi.list({ search: search || undefined })
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleSearch = () => { void loadUsers() }

  const toggleActive = async (user: AdminUser) => {
    await adminUserApi.toggleActive(user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
  }

  const changeRole = async (userId: number, role: string) => {
    await adminUserApi.changeRole(userId, role)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-950">Usuarios</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar por nombre o email..."
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
        <button onClick={handleSearch} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Buscar
        </button>
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
                <th className="px-4 py-3 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-950">{user.username}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none"
                    >
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
                    <button onClick={() => toggleActive(user)} className="text-xs text-amber-600 hover:text-amber-800">
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
