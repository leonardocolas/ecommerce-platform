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
  const [outOfStockProduct, setOutOfStockProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        const data = await fetchPublicCatalogProducts()

        if (!isMounted) {
          return
        }

        if (data.length > 0) {
          setProducts(data)
        } else {
          setProducts(fallbackProducts)
        }
      } catch {
        if (!isMounted) {
          return
        }

        setProducts(fallbackProducts)
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
  }, [])

  useEffect(() => {
    if (search) {
      const lowerSearch = search.toLowerCase()
      const filtered = products.filter((product) => {
        return (
          product.name.toLowerCase().includes(lowerSearch) ||
          product.description.toLowerCase().includes(lowerSearch) ||
          product.categoryLabel.toLowerCase().includes(lowerSearch)
        )
      })

      setFilteredProducts(filtered)
      return
    }

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
      </main>
      <Footer />
    </div>
  )
}
