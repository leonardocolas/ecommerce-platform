import type { CatalogProduct } from '../services/productCatalog'
import ProductCard from './ProductCard'

interface FeaturedProductsProps {
  products: CatalogProduct[]
  isAuthenticated: boolean
  onPurchaseIntent: (product: CatalogProduct) => void
}

export default function FeaturedProducts({
  products,
  isAuthenticated,
  onPurchaseIntent,
}: FeaturedProductsProps) {
  const featured = [...products].sort((left, right) => right.stock - left.stock).slice(0, 8)

  return (
    <section className="mt-16">
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-amber-700">Destacados</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Productos Destacados</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Productos con mayores ventas y aceptacion. Los favoritos de nuestros clientes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {featured.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isAuthenticated={isAuthenticated}
            onPurchaseIntent={onPurchaseIntent}
          />
        ))}
      </div>
    </section>
  )
}
