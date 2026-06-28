import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface Category {
  id: string
  name: string
  count?: number
  description?: string
}

type CategoryVisual = {
  icon: CategoryIcon
  color: string
  description: string
}

type IconProps = {
  className?: string
  strokeWidth?: number
}

type CategoryIcon = (props: IconProps) => ReactNode

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function BaseIcon({
  className,
  children,
  strokeWidth = 1.8,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function ChevronLeftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </BaseIcon>
  )
}

function ChevronRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </BaseIcon>
  )
}

function ShoppingBagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 8h12l-1 11H7L6 8Z" />
      <path d="M9 8a3 3 0 1 1 6 0" />
    </BaseIcon>
  )
}

function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-5h4v5" />
    </BaseIcon>
  )
}

function TreesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 13 4.5 9.5 7 6l2.5 3.5L7 13Z" />
      <path d="M7 13v7" />
      <path d="M17 11 13.5 6.5 17 2l3.5 4.5L17 11Z" />
      <path d="M17 11v9" />
      <path d="M4 20h16" />
    </BaseIcon>
  )
}

function ShirtIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m9 5 3 2 3-2 4 3-2 4-2-1v8H9v-8l-2 1-2-4 4-3Z" />
    </BaseIcon>
  )
}

function GemIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 3h12l3 5-9 13L3 8l3-5Z" />
      <path d="M3 8h18" />
      <path d="m9 3 3 5 3-5" />
    </BaseIcon>
  )
}

function UtensilsCrossedIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 3v7" />
      <path d="M7 3v7" />
      <path d="M4 7h3" />
      <path d="M5.5 10v11" />
      <path d="m14 3 6 6" />
      <path d="m20 3-6 6" />
      <path d="M17 9v12" />
    </BaseIcon>
  )
}

function LaptopIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2 19h20" />
    </BaseIcon>
  )
}

function GiftIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11h16v9H4z" />
      <path d="M12 11v9" />
      <path d="M3 7h18v4H3z" />
      <path d="M8.5 7C7 7 6 6 6 4.8 6 3.6 7 3 8 3c2 0 4 4 4 4" />
      <path d="M15.5 7C17 7 18 6 18 4.8 18 3.6 17 3 16 3c-2 0-4 4-4 4" />
    </BaseIcon>
  )
}

function SparklesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m5 15 .8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
      <path d="m19 14 .6 1.6L21 16l-1.4.4L19 18l-.6-1.6L17 16l1.4-.4L19 14Z" />
    </BaseIcon>
  )
}

function PackageIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 8 4.5v9L12 21 4 16.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5" />
      <path d="M12 12v9" />
    </BaseIcon>
  )
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'Todas' },
  { id: 'hogar', name: 'Hogar' },
  { id: 'jardin', name: 'Jardin' },
  { id: 'moda', name: 'Moda' },
  { id: 'joyeria', name: 'Joyeria' },
  { id: 'alimentos', name: 'Alimentos' },
]

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  all: {
    icon: ShoppingBagIcon,
    color: '#0f172a',
    description: 'Recorre el catalogo completo sin perder contexto.',
  },
  hogar: {
    icon: HomeIcon,
    color: '#0f766e',
    description: 'Muebles, decoracion y piezas para elevar cualquier espacio.',
  },
  jardin: {
    icon: TreesIcon,
    color: '#16a34a',
    description: 'Exterior, herramientas y productos para zonas verdes.',
  },
  moda: {
    icon: ShirtIcon,
    color: '#dc2626',
    description: 'Prendas y accesorios con foco en estilo y combinacion.',
  },
  joyeria: {
    icon: GemIcon,
    color: '#a855f7',
    description: 'Collares, pendientes y detalles que brillan por si solos.',
  },
  alimentos: {
    icon: UtensilsCrossedIcon,
    color: '#ca8a04',
    description: 'Sabores, packs gourmet y productos para consentirte.',
  },
  tecnologia: {
    icon: LaptopIcon,
    color: '#2563eb',
    description: 'Equipos y accesorios para una compra mas conectada.',
  },
  regalos: {
    icon: GiftIcon,
    color: '#db2777',
    description: 'Ideas listas para sorprender o resolver un detalle especial.',
  },
  belleza: {
    icon: SparklesIcon,
    color: '#f97316',
    description: 'Rutinas, cuidado personal y productos con presencia.',
  },
  otros: {
    icon: PackageIcon,
    color: '#64748b',
    description: 'Productos fuera de las familias principales del catalogo.',
  },
}

const CATEGORY_KEYWORDS = [
  { key: 'joyeria', keywords: ['joyeria', 'jewelry', 'necklace', 'bracelet', 'earring', 'gem', 'bangle'] },
  { key: 'hogar', keywords: ['hogar', 'home', 'indoor', 'sofa', 'bed', 'chair', 'decor'] },
  { key: 'jardin', keywords: ['jardin', 'garden', 'outdoor', 'plants', 'flower', 'trees'] },
  { key: 'moda', keywords: ['moda', 'fashion', 'apparel', 'shirt', 'jacket', 'blouse', 'skirt'] },
  { key: 'alimentos', keywords: ['alimentos', 'food', 'cafe', 'coffee', 'chocolate', 'gourmet'] },
  { key: 'tecnologia', keywords: ['tecnologia', 'tech', 'technology', 'laptop', 'smart'] },
  { key: 'regalos', keywords: ['regalos', 'gift', 'set', 'pack'] },
  { key: 'belleza', keywords: ['belleza', 'beauty', 'care', 'sparkle'] },
] as const

function resolveVisualKey(category: Category) {
  if (category.id in CATEGORY_VISUALS) {
    return category.id
  }

  const normalizedValue = `${category.id} ${category.name}`.toLowerCase()

  for (const item of CATEGORY_KEYWORDS) {
    if (item.keywords.some((keyword) => normalizedValue.includes(keyword))) {
      return item.key
    }
  }

  return 'otros'
}

function getCategoryVisual(category: Category) {
  return CATEGORY_VISUALS[resolveVisualKey(category)] ?? CATEGORY_VISUALS.otros
}

function CategoryCard({
  category,
  isActive,
  onClick,
}: {
  category: Category
  isActive: boolean
  onClick?: (category: Category) => void
}) {
  const visual = getCategoryVisual(category)
  const Icon = visual.icon

  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      aria-label={category.name}
      aria-pressed={isActive}
      className={cn(
        'group flex min-w-[240px] flex-col rounded-[28px] border px-5 py-5 text-left transition duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400',
        isActive
          ? 'border-transparent bg-slate-950 text-white shadow-[0_26px_60px_-40px_rgba(15,23,42,0.85)]'
          : 'border-slate-200/80 bg-white/80 text-slate-900 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_60px_-44px_rgba(15,23,42,0.45)]',
      )}
      style={
        isActive
          ? {
              backgroundImage: `linear-gradient(140deg, ${visual.color} 0%, #0f172a 82%)`,
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition duration-300',
            isActive ? 'border-white/20 bg-white/10 text-white' : 'border-transparent bg-slate-100 text-slate-900',
          )}
          style={!isActive ? { color: visual.color, backgroundColor: `${visual.color}15` } : undefined}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>

        {typeof category.count === 'number' ? (
          <span
            className={cn(
              'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
              isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {category.count} {category.count === 1 ? 'producto' : 'productos'}
          </span>
        ) : null}
      </div>

      <div className="mt-5 space-y-2">
        <h3 className="text-lg font-semibold leading-tight">{category.name}</h3>
        <p className={cn('text-sm leading-6', isActive ? 'text-white/78' : 'text-slate-600')}>
          {category.description ?? visual.description}
        </p>
      </div>
    </button>
  )
}

interface CategoriasProps {
  categories?: Category[]
  title?: string
  subtitle?: string
  activeCategoryId?: string
  onCategoryClick?: (category: Category) => void
  carouselThreshold?: number
}

export default function Categorias({
  categories = DEFAULT_CATEGORIES,
  title = 'Explora por categorias',
  subtitle = 'Usa accesos directos pensados para filtrar el catalogo con una sola accion.',
  activeCategoryId,
  onCategoryClick,
  carouselThreshold = 4,
}: CategoriasProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const isCarousel = categories.length > carouselThreshold

  useEffect(() => {
    if (!isCarousel) {
      return
    }

    const node = trackRef.current
    if (!node) {
      return
    }

    const updateScrollState = () => {
      setCanScrollLeft(node.scrollLeft > 4)
      setCanScrollRight(node.scrollLeft + node.clientWidth < node.scrollWidth - 4)
    }

    updateScrollState()
    node.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      node.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [categories.length, isCarousel])

  const scroll = (direction: 'left' | 'right') => {
    const node = trackRef.current
    if (!node) {
      return
    }

    const distance = node.clientWidth * 0.72
    node.scrollBy({
      left: direction === 'right' ? distance : -distance,
      behavior: 'smooth',
    })
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="mt-8 rounded-[34px] border border-white/60 bg-white/70 px-5 py-6 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.4)] backdrop-blur sm:px-6 sm:py-7 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-amber-700">Categorias</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>

      <div className="relative mt-6">
        {isCarousel ? (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Desplazar categorias hacia la izquierda"
              className={cn(
                'absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition sm:flex sm:items-center sm:justify-center',
                canScrollLeft
                  ? 'hover:border-amber-400 hover:bg-amber-400 hover:text-white'
                  : 'cursor-not-allowed opacity-35',
              )}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            <div
              ref={trackRef}
              className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth px-1 py-1"
              style={{
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isActive={activeCategoryId === category.id}
                  onClick={onCategoryClick}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Desplazar categorias hacia la derecha"
              className={cn(
                'absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition sm:flex sm:items-center sm:justify-center',
                canScrollRight
                  ? 'hover:border-amber-400 hover:bg-amber-400 hover:text-white'
                  : 'cursor-not-allowed opacity-35',
              )}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isActive={activeCategoryId === category.id}
                onClick={onCategoryClick}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
