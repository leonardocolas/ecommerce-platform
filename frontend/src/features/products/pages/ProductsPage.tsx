import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { WarningDialog } from '../../../components/feedback'
import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useAuth } from '../../../hooks/useAuth'
import ProductCard from '../../storefront/components/ProductCard'
import { fallbackProducts } from '../../storefront/data/fallbackProducts'
import {
  fetchPublicCatalogProducts,
  type CatalogProduct,
} from '../../storefront/services/productCatalog'

export default function ProductsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const search = searchParams.get('search') || ''
  const currentPath =
    typeof window === 'undefined'
      ? '/products'
      : `${window.location.pathname}${window.location.search}`
  const [products, setProducts] = useState<CatalogProduct[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)
  const [filteredProducts, setFilteredProducts] = useState<CatalogProduct[]>(fallbackProducts)
  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const ordering = searchParams.get('ordering') || '-updated_at'
  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const [outOfStockProduct, setOutOfStockProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        const data = await fetchPublicCatalogProducts({ search, ordering, category, min_price: minPrice, max_price: maxPrice, page })

        if (!isMounted) {
          return
        }

        setCatalogError(null)
        if (data.products.length > 0) {
          setProducts(data.products)
          setTotalProducts(data.count)
        } else {
          setProducts([])
          setTotalProducts(0)
        }
      } catch {
        if (!isMounted) {
          return
        }

        setProducts([])
        setCatalogError('No pudimos cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [search, ordering, category, minPrice, maxPrice, page])

  useEffect(() => {
    setFilteredProducts(products)
  }, [search, products])

  const handlePurchaseIntent = (product: CatalogProduct) => {
    if (product.stock <= 0) {
      setOutOfStockProduct(product)
      return
    }

    if (!user) {
      navigate('/login', {
        state: {
          redirectTo: currentPath,
          actionLabel: `comprar ${product.name}`,
        },
      })
    }
  }

  function updateCatalogParam(name: string, value: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(name, value)
    else nextParams.delete(name)
    nextParams.delete('page')
    setPage(1)
    navigate(`/products?${nextParams.toString()}`)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Cargando productos...</div>
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <WarningDialog
        open={Boolean(outOfStockProduct)}
        title="Producto agotado"
        description={
          outOfStockProduct
            ? `${outOfStockProduct.name} esta agotado en este momento. Te recomendamos explorar otras opciones disponibles.`
            : ''
        }
        confirmLabel="Aceptar"
        onClose={() => setOutOfStockProduct(null)}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            {search ? `Resultados para "${search}"` : 'Todos los productos'}
          </h1>
          {search && filteredProducts.length === 0 ? (
            <p className="mt-2 text-slate-500">No se encontraron productos.</p>
          ) : null}
          {catalogError ? <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{catalogError}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <select value={category} onChange={(event) => updateCatalogParam('category', event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">Todas las categorías</option>
              <option value="Moda">Moda</option>
              <option value="Hogar">Hogar</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Joyeria">Joyería</option>
              <option value="Alimentos">Alimentos</option>
            </select>
            <input type="number" min="0" value={minPrice} onChange={(event) => updateCatalogParam('min_price', event.target.value)} placeholder="Precio mínimo" className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="number" min="0" value={maxPrice} onChange={(event) => updateCatalogParam('max_price', event.target.value)} placeholder="Precio máximo" className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select value={ordering} onChange={(event) => updateCatalogParam('ordering', event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="-updated_at">Más recientes</option>
              <option value="variant_price">Precio menor</option>
              <option value="-variant_price">Precio mayor</option>
              <option value="title">Nombre A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAuthenticated={Boolean(user)}
              onPurchaseIntent={handlePurchaseIntent}
            />
          ))}
        </div>
        {totalProducts > 12 ? (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40">Anterior</button>
            <span className="text-sm text-slate-500">Página {page}</span>
            <button disabled={page * 12 >= totalProducts} onClick={() => setPage((value) => value + 1)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-40">Siguiente</button>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
