import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { WarningDialog } from '../../../components/feedback'
import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useAuth } from '../../../hooks/useAuth'
import Categorias, { type Category } from '../components/Categorias'
import FeaturedProducts from '../components/FeaturedProducts'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import SaleProducts from '../components/SaleProducts'
import { fallbackProducts } from '../data/fallbackProducts'
import { fetchPublicCatalogProducts, type CatalogProduct } from '../services/productCatalog'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readFlashMessage(state: unknown) {
  if (!isRecord(state) || typeof state.flashMessage !== 'string') {
    return null
  }

  return state.flashMessage
}

function buildCategorySummaries(products: CatalogProduct[]): Category[] {
  const categories = new Map<string, Category>()

  for (const product of products) {
    const existingCategory = categories.get(product.categoryId)

    if (existingCategory) {
      existingCategory.count = (existingCategory.count ?? 0) + 1
      continue
    }

    categories.set(product.categoryId, {
      id: product.categoryId,
      name: product.categoryLabel,
      count: 1,
    })
  }

  const sortedCategories = Array.from(categories.values()).sort((leftCategory, rightCategory) => {
    const countDifference = (rightCategory.count ?? 0) - (leftCategory.count ?? 0)
    if (countDifference !== 0) {
      return countDifference
    }

    return leftCategory.name.localeCompare(rightCategory.name, 'es', { sensitivity: 'base' })
  })

  return [
    {
      id: 'all',
      name: 'Todas',
      count: products.length,
      description: 'Ver el catalogo completo sin perder ninguna categoria.',
    },
    ...sortedCategories.map((category) => ({
      ...category,
      description: `Filtra rapidamente los ${(category.count ?? 0).toString()} productos disponibles en ${category.name.toLowerCase()}.`,
    })),
  ]
}

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const currentPath = `${location.pathname}${location.search}` || '/'
  const catalogSectionRef = useRef<HTMLElement | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>(fallbackProducts)
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null)
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState('all')
  const [outOfStockProduct, setOutOfStockProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const backendProducts = await fetchPublicCatalogProducts()

        if (!isMounted) {
          return
        }

        if (backendProducts.length > 0) {
          setProducts(backendProducts)
          setCatalogMessage('Catalogo cargado desde el backend.')
        } else {
          setProducts(fallbackProducts)
          setCatalogMessage('Aun no hay productos publicados. Mostramos una portada demo.')
        }
      } catch (errorValue: unknown) {
        if (!isMounted) {
          return
        }

        setProducts(fallbackProducts)
        setCatalogMessage(
          errorValue instanceof Error
            ? `${errorValue.message} Mostramos un catalogo demo mientras tanto.`
            : 'No pudimos cargar el catalogo real. Mostramos un catalogo demo mientras tanto.',
        )
      } finally {
        if (isMounted) {
          setIsCatalogLoading(false)
        }
      }
    }

    loadCatalog()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const flashMessage = readFlashMessage(location.state)

    if (!flashMessage) {
      return
    }

    setInteractionMessage(flashMessage)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const categories = buildCategorySummaries(products)

    if (categories.some((category) => category.id === activeCategoryId)) {
      return
    }

    setActiveCategoryId('all')
  }, [activeCategoryId, products])

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
      return
    }

    setInteractionMessage(
      `Sesion activa para ${user.username} con rol ${user.role}. Ya puedes continuar la compra de ${product.name}.`,
    )
  }

  const categories = buildCategorySummaries(products)
  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0] ?? null
  const visibleProducts =
    activeCategoryId === 'all'
      ? products
      : products.filter((product) => product.categoryId === activeCategoryId)

  const handleCategorySelection = (category: Category) => {
    setActiveCategoryId(category.id)
    catalogSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_26%),linear-gradient(180deg,#fff8ec_0%,#f8fafc_42%,#eef7f1_100%)]">
      <Navbar />
      <WarningDialog
        open={Boolean(outOfStockProduct)}
        title="Producto sin stock disponible"
        description={
          outOfStockProduct
            ? `${outOfStockProduct.name} no tiene unidades disponibles ahora mismo. Prueba con otro producto o vuelve mas tarde.`
            : ''
        }
        confirmLabel="Entendido"
        onClose={() => setOutOfStockProduct(null)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Hero />
        <Categorias
          categories={categories}
          title="Encuentra lo que buscas mas rapido"
          subtitle="Cada categoria te lleva directo a los productos relacionados y te ayuda a explorar el catalogo con un enfoque mucho mas claro."
          activeCategoryId={activeCategoryId}
          onCategoryClick={handleCategorySelection}
        />

        {!isCatalogLoading ? (
          <>
            <FeaturedProducts
              products={products}
              isAuthenticated={Boolean(user)}
              onPurchaseIntent={handlePurchaseIntent}
            />
            <SaleProducts
              products={products}
              isAuthenticated={Boolean(user)}
              onPurchaseIntent={handlePurchaseIntent}
            />
          </>
        ) : null}

        {interactionMessage ? (
          <section className="mt-8 rounded-[28px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            {interactionMessage}
          </section>
        ) : null}

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-sm">
          {isCatalogLoading
            ? 'Cargando catalogo publico...'
            : (catalogMessage ?? 'Catalogo listo para explorar.')}
        </section>

        <section ref={catalogSectionRef} className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-amber-700">Catalogo</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                {activeCategoryId === 'all'
                  ? 'Productos destacados'
                  : `Productos en ${activeCategory?.name ?? 'la categoria seleccionada'}`}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              {activeCategoryId === 'all'
                ? 'Esta vista permanece abierta para invitados. Solo las acciones de compra exigen autenticacion.'
                : `Mostrando ${visibleProducts.length} productos dentro de ${activeCategory?.name?.toLowerCase()}. Puedes volver a "Todas" cuando quieras.`}
            </p>
          </div>

          {activeCategoryId !== 'all' ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
              >
                Ver todo el catalogo
              </button>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAuthenticated={Boolean(user)}
                onPurchaseIntent={handlePurchaseIntent}
              />
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-sm text-slate-600">
              No encontramos productos para esta categoria todavia. Prueba con otra o vuelve a ver
              todo el catalogo.
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
