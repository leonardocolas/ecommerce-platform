import { useEffect, useState } from 'react'
import { adminCouponApi, type AdminCoupon } from '../services/adminService'

const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED', 'BOGO', 'FREE_SHIPPING']
const DISCOUNT_LABELS: Record<string, string> = { PERCENTAGE: 'Porcentaje', FIXED: 'Monto fijo', BOGO: '2x1', FREE_SHIPPING: 'Envio gratis' }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'PERCENTAGE', discount_value: 0, min_purchase: 0, max_uses: 0, valid_from: '', valid_to: '', applicable_categories: [] as string[] })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => { adminCouponApi.list().then(setCoupons).finally(() => setLoading(false)) }, [])

  const resetForm = () => {
    setForm({ code: '', description: '', discount_type: 'PERCENTAGE', discount_value: 0, min_purchase: 0, max_uses: 0, valid_from: '', valid_to: '', applicable_categories: [] })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.code.trim()) return
    const payload = { ...form, valid_from: form.valid_from || undefined, valid_to: form.valid_to || undefined }
    if (editingId) {
      const updated = await adminCouponApi.update(editingId, payload)
      setCoupons(prev => prev.map(c => c.id === editingId ? updated : c))
    } else {
      const created = await adminCouponApi.create(payload)
      setCoupons(prev => [...prev, created])
    }
    resetForm()
  }

  const handleEdit = (coupon: AdminCoupon) => {
    setForm({ code: coupon.code, description: coupon.description, discount_type: coupon.discount_type, discount_value: coupon.discount_value, min_purchase: coupon.min_purchase, max_uses: coupon.max_uses, valid_from: coupon.valid_from?.split('T')[0] || '', valid_to: coupon.valid_to?.split('T')[0] || '', applicable_categories: coupon.applicable_categories || [] })
    setEditingId(coupon.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await adminCouponApi.delete(id)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950">Cupones</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
          + Nuevo cupon
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-950">{editingId ? 'Editar cupon' : 'Nuevo cupon'}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder="Codigo" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-amber-400 focus:outline-none" />
            <select value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
              {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{DISCOUNT_LABELS[t]}</option>)}
            </select>
            <input type="number" placeholder="Valor descuento" value={form.discount_value} onChange={e => setForm(p => ({ ...p, discount_value: Number(e.target.value) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input type="number" placeholder="Compra minima" value={form.min_purchase} onChange={e => setForm(p => ({ ...p, min_purchase: Number(e.target.value) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input type="number" placeholder="Usos maximos (0 = sin limite)" value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: Number(e.target.value) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input placeholder="Descripcion" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input type="date" placeholder="Valido desde" value={form.valid_from} onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input type="date" placeholder="Valido hasta" value={form.valid_to} onChange={e => setForm(p => ({ ...p, valid_to: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {editingId ? 'Guardar cambios' : 'Crear cupon'}
            </button>
            <button onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : coupons.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No hay cupones creados</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Codigo</th>
                <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-slate-600">Valor</th>
                <th className="px-4 py-3 font-medium text-slate-600">Usos</th>
                <th className="px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-950">{coupon.code}</td>
                  <td className="px-4 py-3 text-slate-600">{DISCOUNT_LABELS[coupon.discount_type]}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.discount_type === 'PERCENTAGE' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}</td>
                  <td className="px-4 py-3 text-slate-600">{coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${coupon.is_valid ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {coupon.is_valid ? 'Valido' : 'Expirado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleEdit(coupon)} className="text-xs text-amber-600 hover:text-amber-800">Editar</button>
                    <button onClick={() => handleDelete(coupon.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
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
