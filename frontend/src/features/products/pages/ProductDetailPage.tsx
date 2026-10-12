import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

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
  const location = useLocation()
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
      setError(null)
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

  const currentProduct = product
  const price = selectedVariant?.price ?? currentProduct.price
  const stock = selectedVariant?.inventory_qty ?? currentProduct.stock
  const gallery = currentProduct.images.length > 0 ? currentProduct.images.map((image) => image.image_url) : [currentProduct.imageUrl].filter((image): image is string => Boolean(image))

  async function handleAdd() {
    if (!user || stock <= 0) return
    setError(null)
    try {
      await addItem(currentProduct.id, 1, selectedVariant?.id)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo agregar al carrito.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f4ee]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
        <Link to="/products" className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-[#111827]">
          ← Volver al catálogo
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="grid gap-4 sm:grid-cols-[88px_1fr]">
            <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setSelectedImage(image)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition ${
                    selectedImage === image ? 'border-[#d6b06d]' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt={`${product.name} imagen ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="order-1 min-h-[420px] overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-white shadow-[0_28px_80px_-56px_rgba(17,24,39,0.7)] sm:order-2">
              <img src={selectedImage ?? ''} alt={product.name} className="h-full min-h-[420px] w-full object-cover" />
            </div>
          </section>

          <section className="self-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#b78a44]">{product.categoryLabel}</p>
            <h1 className="mt-4 text-4xl font-semibold text-[#111827] sm:text-5xl">{product.name}</h1>
            <p className="mt-3 text-sm uppercase tracking-[0.16em] text-slate-500">Por {product.provider}</p>

            <div className="mt-8 flex items-end gap-4">
              <p className="text-4xl font-semibold text-[#111827]">{formatCurrency(price)}</p>
              <span className="rounded-full border border-[#d6b06d]/50 bg-[#fffaf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#111827]">
                Premium
              </span>
            </div>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">{product.description}</p>

            {product.variants.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Selecciona una opción</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.variants.filter((variant) => variant.is_active).map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant)
                        setSelectedImage(variant.image || selectedImage)
                      }}
                      className={`rounded-2xl border px-4 py-2.5 text-sm transition ${
                        selectedVariant?.id === variant.id
                          ? 'border-[#111827] bg-[#111827] text-white'
                          : 'border-[#e7dcc8] bg-white text-slate-700 hover:border-[#d6b06d]'
                      }`}
                    >
                      {optionLabel(variant) || variant.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className={`mt-6 text-sm font-medium ${stock > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {stock > 0 ? `${stock} unidades disponibles` : 'Agotado'}
            </p>

            {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            {user ? (
              <button
                onClick={handleAdd}
                disabled={stock <= 0 || added}
                className="premium-button mt-8 flex w-full items-center justify-center px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? 'Agregado al carrito' : 'Agregar al carrito'}
              </button>
            ) : (
              <Link
                to="/login"
                state={{ redirectTo: `${location.pathname}${location.search}`, actionLabel: `comprar ${currentProduct.name}` }}
                className="premium-button mt-8 flex w-full items-center justify-center px-6 py-4 text-sm font-bold uppercase tracking-[0.18em]"
              >
                Inicia sesión para comprar
              </Link>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
