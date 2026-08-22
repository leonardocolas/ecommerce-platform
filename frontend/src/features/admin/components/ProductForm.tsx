import { useEffect, useState } from 'react'
import type { AdminProduct } from '../services/adminService'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 255)
}

interface ProductFormProps {
  product?: AdminProduct | null
  onSubmit: (data: Partial<AdminProduct>) => Promise<void>
  onClose: () => void
}

export default function ProductForm({ product, onSubmit, onClose }: ProductFormProps) {
  const [title, setTitle] = useState(product?.title ?? '')
  const [handle, setHandle] = useState(product?.handle ?? '')
  const [autoHandle, setAutoHandle] = useState(!product)
  const [bodyHtml, setBodyHtml] = useState(product?.body_html ?? '')
  const [vendor, setVendor] = useState(product?.vendor ?? '')
  const [productType, setProductType] = useState(product?.product_type ?? '')
  const [tags, setTags] = useState(product?.tags ?? '')
  const [price, setPrice] = useState(product?.variant_price?.toString() ?? '')
  const [compareAtPrice, setCompareAtPrice] = useState(product?.variant_compare_at_price?.toString() ?? '')
  const [stock, setStock] = useState(product?.variant_inventory_qty?.toString() ?? '0')
  const [imageSrc, setImageSrc] = useState(product?.image_src ?? '')
  const [published, setPublished] = useState(product?.published ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (autoHandle) {
      setHandle(generateHandle(title))
    }
  }, [title, autoHandle])

  function handleTitleChange(value: string) {
    setTitle(value)
    if (autoHandle) {
      setHandle(generateHandle(value))
    }
  }

  function handleHandleChange(value: string) {
    setAutoHandle(false)
    setHandle(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (!handle.trim()) { setError('El handle es obligatorio.'); return }
    if (!price || parseFloat(price) <= 0) { setError('El precio debe ser mayor a 0.'); return }
    if (parseInt(stock) < 0) { setError('El stock no puede ser negativo.'); return }

    const payload: Partial<AdminProduct> = {
      title: title.trim(),
      handle: handle.trim(),
      body_html: bodyHtml.trim() || null,
      vendor: vendor.trim() || '',
      product_type: productType.trim() || '',
      tags: tags.trim() || null,
      variant_price: parseFloat(price),
      variant_compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      variant_inventory_qty: parseInt(stock) || 0,
      image_src: imageSrc.trim() || null,
      published,
    }

    try {
      setSaving(true)
      await onSubmit(payload)
    } catch (err) {
      setError((err as Error).message || 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const discountPercent = compareAtPrice && price
    ? Math.round((1 - parseFloat(price) / parseFloat(compareAtPrice)) * 100)
    : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              placeholder="Nombre del producto"
              required
            />
          </div>

          {/* Handle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Handle (slug)</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => handleHandleChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none"
              placeholder="producto-ejemplo"
            />
            <p className="mt-1 text-xs text-slate-400">URL amigable. Se genera automáticamente del título.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
              placeholder="Descripción del producto (HTML opcional)"
            />
          </div>

          {/* Price + Compare at price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio anterior (rebaja)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="0.00"
              />
              {discountPercent > 0 && (
                <p className="mt-1 text-xs font-medium text-green-600">-{discountPercent}% de descuento</p>
              )}
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock *</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              placeholder="0"
              required
            />
          </div>

          {/* Vendor + Product Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="Nombre del proveedor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <input
                type="text"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                placeholder="Electrónica, Ropa..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Etiquetas</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              placeholder="Separadas por comas: oferta, nuevo, popular"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen</label>
            <input
              type="url"
              value={imageSrc}
              onChange={(e) => setImageSrc(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {imageSrc && (
              <div className="mt-2 h-20 w-20 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                <img src={imageSrc} alt="Vista previa" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                published ? 'bg-amber-400' : 'bg-slate-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                published ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {product?.published ? 'Publicado' : 'Borrador'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-amber-400 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
