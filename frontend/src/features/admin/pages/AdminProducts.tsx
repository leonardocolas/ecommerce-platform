import { useEffect, useState, useMemo } from 'react'
import { adminProductApi, type AdminProduct } from '../services/adminService'
import ProductForm from '../components/ProductForm'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

const PAGE_SIZE = 10

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)

  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    adminProductApi.list().then(setProducts).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.handle.toLowerCase().includes(q) ||
      (p.vendor || '').toLowerCase().includes(q) ||
      (p.product_type || '').toLowerCase().includes(q)
    )
  }, [products, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search])

  function handleCreate() {
    setEditingProduct(null)
    setShowForm(true)
  }

  function handleEdit(product: AdminProduct) {
    setEditingProduct(product)
    setShowForm(true)
  }

  async function handleFormSubmit(data: Partial<AdminProduct>) {
    if (editingProduct) {
      const updated = await adminProductApi.update(editingProduct.id, data)
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updated } : p))
    } else {
      const created = await adminProductApi.create(data)
      setProducts(prev => [created, ...prev])
    }
    setShowForm(false)
    setEditingProduct(null)
  }

  async function handleConfirmDelete() {
    if (!deletingProduct) return
    setDeleting(true)
    try {
      await adminProductApi.delete(deletingProduct.id)
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
      setDeletingProduct(null)
    } catch (err) {
      alert((err as Error).message || 'Error al eliminar el producto')
    } finally {
      setDeleting(false)
    }
  }

  const togglePublished = async (product: AdminProduct) => {
    await adminProductApi.update(product.id, { published: !product.published })
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, published: !p.published } : p))
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Productos</h1>
          <p className="text-sm text-slate-500">{filtered.length} productos encontrados</p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por titulo, handle, proveedor o categoria..."
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <svg className="mx-auto mb-3 h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm">Cargando productos...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white py-12 text-center shadow-sm">
          <p className="text-slate-400">
            {search ? 'No se encontraron productos para esa busqueda.' : 'No hay productos todavia.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="px-4 py-3 font-medium text-slate-600">Precio</th>
                <th className="px-4 py-3 font-medium text-slate-600">Stock</th>
                <th className="px-4 py-3 font-medium text-slate-600">Categoria</th>
                <th className="px-4 py-3 font-medium text-slate-600">Estado</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {product.image_src ? (
                          <img src={product.image_src} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">{product.title}</p>
                        <p className="text-xs text-slate-500">{product.vendor || 'Sin proveedor'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-950">{formatCurrency(product.variant_price)}</span>
                      {product.variant_compare_at_price && product.variant_compare_at_price > product.variant_price && (
                        <span className="text-xs text-green-600">
                          -{Math.round((1 - product.variant_price / product.variant_compare_at_price) * 100)}%
                          <span className="ml-1 text-slate-400 line-through">{formatCurrency(product.variant_compare_at_price)}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.variant_inventory_qty <= 5 ? 'font-semibold text-red-600' : 'text-slate-700'}>
                      {product.variant_inventory_qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.product_type || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublished(product)}
                      className={`rounded-full px-2 py-0.5 text-xs transition ${
                        product.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {product.published ? 'Activo' : 'Borrador'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleFormSubmit}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}

      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeletingProduct(null) }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-center text-lg font-bold text-slate-950">Eliminar producto</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Estas seguro de eliminar <span className="font-semibold text-slate-700">{deletingProduct.title}</span>? Esta accion no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
                className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages = useMemo(() => {
    const nums: (number | 'ellipsis')[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
        if (nums.length > 0 && nums[nums.length - 1] !== 'ellipsis' && i - (nums[nums.length - 1] as number) > 1) {
          nums.push('ellipsis')
        }
        nums.push(i)
      }
    }
    return nums
  }, [page, totalPages])

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-sm text-slate-500">Pagina {page} de {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-2 py-1.5 text-sm text-slate-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                p === page ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
