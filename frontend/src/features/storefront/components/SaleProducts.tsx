import type { CatalogProduct } from '../services/productCatalog'
import ProductCard from './ProductCard'

interface SaleProductsProps {
  products: CatalogProduct[]
  isAuthenticated: boolean
  onPurchaseIntent: (product: CatalogProduct) => void
}

export default function SaleProducts({
  products,
  isAuthenticated,
  onPurchaseIntent,
}: SaleProductsProps) {
  const onSale = products.filter((product) => product.price < 15).slice(0, 8)

  return (
    <section className="mt-16">
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-orange-600">Rebajas</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Productos en Rebaja</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Ofertas especiales con los mejores precios. Ahorra en tus compras favoritas.
        </p>
      </div>

      {onSale.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {onSale.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isAuthenticated={isAuthenticated}
              onPurchaseIntent={onPurchaseIntent}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-8 text-center text-sm text-slate-600">
          No hay productos en oferta por ahora. Vuelve pronto.
        </div>
      )}
    </section>
  )
}
