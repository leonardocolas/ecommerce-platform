import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import personaComprandoImage from '../../../img/HeroImg/personacomprando.webp'
import { WarningDialog } from '../../../components/feedback'
import Footer from '../../../layout/Footer'
import Navbar from '../../../layout/Navbar'
import { useAuth } from '../../../hooks/useAuth'
import Categorias, { type Category } from '../components/Categorias'
import FeaturedProducts from '../components/FeaturedProducts'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import SaleProducts from '../components/SaleProducts'
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
      description: 'Ver el catálogo completo sin perder ninguna categoría.',
    },
    ...sortedCategories.map((category) => ({
      ...category,
      description: `Explora los ${(category.count ?? 0).toString()} productos disponibles en ${category.name.toLowerCase()}.`,
    })),
  ]
}

export default function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const currentPath = `${location.pathname}${location.search}` || '/'
  const catalogSectionRef = useRef<HTMLElement | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null)
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [interactionMessage, setInteractionMessage] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState('all')
  const [outOfStockProduct, setOutOfStockProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      try {
        const backendProducts = await fetchPublicCatalogProducts({ page: 1 })

        if (!isMounted) {
          return
        }

        if (backendProducts.products.length > 0) {
          setProducts(backendProducts.products)
          setCatalogMessage(`Catálogo listo para descubrir: ${backendProducts.products.length} productos.`)
        } else {
          setProducts([])
          setCatalogMessage('Estamos preparando nuevas piezas para el catálogo.')
        }
      } catch (errorValue: unknown) {
        if (!isMounted) {
          return
        }

        setProducts([])
        setCatalogMessage(
          errorValue instanceof Error
            ? errorValue.message
            : 'No pudimos cargar el catálogo. Inténtalo de nuevo en unos momentos.',
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
      `Sesión iniciada. Ya puedes continuar con ${product.name}.`,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(214,176,109,0.15),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(122,143,114,0.12),_transparent_28%),linear-gradient(180deg,#f9f3eb_0%,#f8f4ee_42%,#f3f5f3_100%)]">
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

      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
        <Hero />
        <div id="colecciones" className="scroll-mt-8">
          <Categorias
            categories={categories}
            title="Encuentra tu próxima pieza favorita"
            subtitle="Explora por categoría y descubre opciones para cada espacio, momento y estilo."
            activeCategoryId={activeCategoryId}
            onCategoryClick={handleCategorySelection}
          />
        </div>

        <section className="relative mt-8 grid min-h-[360px] overflow-hidden rounded-[30px] bg-[#151b26] shadow-[0_35px_90px_-55px_rgba(17,24,39,0.75)] sm:min-h-[400px] sm:rounded-[38px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e2c58f]">
              Luz Marina · tienda para descubrir
            </span>
            <h2 className="mt-5 max-w-xl text-4xl leading-[0.98] text-white sm:text-5xl lg:text-6xl">
              Lo cotidiano, con un toque extraordinario.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Recorre una selección de moda, hogar, tecnología y mucho más. Encuentra algo que te
              guste, a tu ritmo.
            </p>
            <Link
              to="/products"
              className="premium-button mt-7 inline-flex w-fit items-center justify-center px-6 py-3.5 text-xs font-bold uppercase tracking-[0.18em] sm:text-sm"
            >
              Explorar la tienda
            </Link>
          </div>
          <div className="absolute inset-0 lg:relative lg:min-h-full">
            <img
              src={personaComprandoImage}
              alt=""
              className="h-full w-full object-cover object-center opacity-35 lg:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#151b26] via-[#151b26]/75 to-transparent lg:bg-gradient-to-r lg:from-[#151b26] lg:via-[#151b26]/20 lg:to-transparent" />
          </div>
        </section>

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
          <section role="status" className="mt-8 rounded-[22px] border border-[#d6b06d]/35 bg-[#fffaf5] px-5 py-4 text-sm text-[#55442c] shadow-sm">
            {interactionMessage}
          </section>
        ) : null}

        <section
          role={catalogMessage && products.length === 0 && !isCatalogLoading ? 'status' : undefined}
          className={`mt-8 rounded-[22px] border px-5 py-4 text-sm ${
            catalogMessage && products.length === 0 && !isCatalogLoading
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-[#e7dcc8] bg-white/70 text-slate-600'
          }`}
        >
          {isCatalogLoading ? 'Cargando selección...' : (catalogMessage ?? 'Catálogo listo para explorar.')}
        </section>

        <section ref={catalogSectionRef} className="mt-12 scroll-mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#b78a44]">La selección</p>
              <h2 className="mt-2 text-4xl text-[#111827] sm:text-5xl">
                {activeCategoryId === 'all'
                  ? 'Piezas para descubrir'
                  : `Productos en ${activeCategory?.name ?? 'la categoría seleccionada'}`}
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
                Ver todo el catálogo
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
            <div className="mt-6 rounded-[28px] border border-dashed border-[#d9cdb8] bg-white/70 px-6 py-8 text-sm text-slate-600">
            No encontramos productos para esta categoría todavía. Prueba con otra o vuelve a ver
            todo el catálogo.
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
