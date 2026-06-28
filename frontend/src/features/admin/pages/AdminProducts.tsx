import { useEffect, useState } from 'react'
import { adminProductApi, type AdminProduct } from '../services/adminService'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminProductApi.list().then(setProducts).finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.handle.toLowerCase().includes(search.toLowerCase()) ||
    (p.vendor || '').toLowerCase().includes(search.toLowerCase())
  )

  const togglePublished = async (product: AdminProduct) => {
    await adminProductApi.update(product.id, { published: !product.published })
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, published: !p.published } : p))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950">Productos</h1>
        <span className="text-sm text-slate-500">{products.length} total</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por titulo, handle o proveedor..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="py-12 text-center text-slate-400">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="px-4 py-3 font-medium text-slate-600">Precio</th>
                <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
                <th className="px-4 py-3 font-medium text-slate-600">Tipo</th>
                <th className="px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                        {product.image_src ? (
                          <img src={product.image_src} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">-</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-950">{product.title}</p>
                        <p className="text-xs text-slate-500">{product.vendor || 'Sin proveedor'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-950">{formatCurrency(product.variant_price)}</td>
                  <td className="px-4 py-3">
                    <span className={product.variant_inventory_qty <= 5 ? 'font-semibold text-red-600' : 'text-slate-700'}>
                      {product.variant_inventory_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.product_type || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${product.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {product.published ? 'Activo' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublished(product)} className="text-xs text-amber-600 hover:text-amber-800">
                      {product.published ? 'Desactivar' : 'Activar'}
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
