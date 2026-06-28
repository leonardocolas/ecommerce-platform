import { useEffect, useState } from 'react'
import { adminBannerApi, type AdminBanner } from '../services/adminService'

export default function AdminBanners() {
  const [banners, setBanners] = useState<AdminBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', description: '', image_url: '', link_url: '', position: 0 })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => { adminBannerApi.list().then(setBanners).finally(() => setLoading(false)) }, [])

  const resetForm = () => {
    setForm({ title: '', subtitle: '', description: '', image_url: '', link_url: '', position: 0 })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    if (editingId) {
      const updated = await adminBannerApi.update(editingId, form)
      setBanners(prev => prev.map(b => b.id === editingId ? updated : b))
    } else {
      const created = await adminBannerApi.create(form)
      setBanners(prev => [...prev, created])
    }
    resetForm()
  }

  const handleEdit = (banner: AdminBanner) => {
    setForm({ title: banner.title, subtitle: banner.subtitle, description: banner.description, image_url: banner.image_url || '', link_url: banner.link_url, position: banner.position })
    setEditingId(banner.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await adminBannerApi.delete(id)
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950">Banners del Hero</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
          + Nuevo banner
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-950">{editingId ? 'Editar banner' : 'Nuevo banner'}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input placeholder="Titulo" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input placeholder="Subtitulo" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input placeholder="Descripcion" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input placeholder="URL de imagen" value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input placeholder="URL de enlace" value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input type="number" placeholder="Posicion" value={form.position} onChange={e => setForm(p => ({ ...p, position: Number(e.target.value) }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSubmit} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {editingId ? 'Guardar cambios' : 'Crear banner'}
            </button>
            <button onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : banners.length === 0 ? (
        <p className="py-12 text-center text-slate-400">No hay banners creados</p>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-20 overflow-hidden rounded-lg bg-slate-100">
                  {banner.image_url ? <img src={banner.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Sin imagen</div>}
                </div>
                <div>
                  <p className="font-medium text-slate-950">{banner.title}</p>
                  <p className="text-xs text-slate-500">Pos: {banner.position} | {banner.is_active ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="text-xs text-amber-600 hover:text-amber-800">Editar</button>
                <button onClick={() => handleDelete(banner.id)} className="text-xs text-red-500 hover:text-red-700">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
