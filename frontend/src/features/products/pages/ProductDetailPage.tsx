import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useAuth } from '../../../hooks/useAuth'
import { useCartStore } from '../../cart/services/cartService'
import { fetchPublicProduct, type CatalogProduct, type CatalogVariant } from '../../storefront/services/productCatalog'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value)
}

function optionLabel(variant: CatalogVariant) {
  return [variant.option1_value, variant.option2_value, variant.option3_value].filter(Boolean).join(' / ')
}

export default function ProductDetailPage() {
  const { handle } = useParams()
  const { user } = useAuth()
  const addItem = useCartStore((state) => state.addItem)
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadedHandle, setLoadedHandle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!handle) return
    let active = true
    fetchPublicProduct(handle).then((data) => {
      if (!active) return
      setProduct(data)
      setSelectedVariant(data.variants.find((variant) => variant.is_active) ?? null)
      setSelectedImage(data.images[0]?.image_url ?? data.imageUrl)
      setLoadedHandle(handle)
    }).catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar el producto.')
        setLoadedHandle(handle)
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [handle])

  if (loading || loadedHandle !== handle) return <div className="flex min-h-screen items-center justify-center text-slate-500">Cargando producto...</div>
  if (error || !product) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-3xl px-6 py-24 text-center"><p className="rounded-xl bg-red-50 px-5 py-4 text-red-700">{error ?? 'Producto no encontrado.'}</p><Link to="/products" className="mt-6 inline-block font-semibold text-slate-950 underline">Volver al catálogo</Link></main><Footer /></div>

  const price = selectedVariant?.price ?? product.price
  const stock = selectedVariant?.inventory_qty ?? product.stock
  const gallery = product.images.length > 0 ? product.images.map((image) => image.image_url) : [product.imageUrl].filter((image): image is string => Boolean(image))

  async function handleAdd() {
    if (!user || stock <= 0) return
    setError(null)
    try {
      await addItem(product.id, 1, selectedVariant?.id)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo agregar al carrito.')
    }
  }

  return <div className="min-h-screen bg-[#f8f7f2]"><Navbar /><main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16"><Link to="/products" className="text-sm font-semibold text-slate-500 hover:text-slate-950">← Volver al catálogo</Link><div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]"><section className="grid gap-4 sm:grid-cols-[88px_1fr]"> <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">{gallery.map((image, index) => <button key={image} onClick={() => setSelectedImage(image)} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${selectedImage === image ? 'border-amber-400' : 'border-transparent'}`}><img src={image} alt={`${product.name} imagen ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div><div className="order-1 min-h-[420px] overflow-hidden rounded-[28px] bg-white sm:order-2"><img src={selectedImage ?? ''} alt={product.name} className="h-full min-h-[420px] w-full object-cover" /></div></section><section className="self-center"><p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-600">{product.categoryLabel}</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{product.name}</h1><p className="mt-3 text-sm text-slate-500">Por {product.provider}</p><p className="mt-8 text-3xl font-semibold text-slate-950">{formatCurrency(price)}</p><p className="mt-6 max-w-xl text-base leading-7 text-slate-600">{product.description}</p>{product.variants.length > 0 && <div className="mt-8"><h2 className="text-sm font-semibold text-slate-950">Selecciona una opción</h2><div className="mt-3 flex flex-wrap gap-2">{product.variants.filter((variant) => variant.is_active).map((variant) => <button key={variant.id} onClick={() => { setSelectedVariant(variant); setSelectedImage(variant.image || selectedImage) }} className={`rounded-xl border px-4 py-2 text-sm ${selectedVariant?.id === variant.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{optionLabel(variant) || variant.sku}</button>)}</div></div>}<p className={`mt-6 text-sm font-medium ${stock > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{stock > 0 ? `${stock} unidades disponibles` : 'Agotado'}</p>{error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{user ? <button onClick={handleAdd} disabled={stock <= 0 || added} className="mt-8 w-full rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{added ? 'Agregado al carrito' : 'Agregar al carrito'}</button> : <Link to="/login" className="mt-8 block w-full rounded-2xl bg-slate-950 px-6 py-4 text-center text-sm font-semibold text-white">Inicia sesión para comprar</Link>}</section></div></main><Footer /></div>
}
