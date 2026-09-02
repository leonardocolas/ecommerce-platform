export interface CatalogProduct {
  id: number
  slug: string
  name: string
  description: string
  price: number
  stock: number
  provider: string
  categoryId: string
  categoryLabel: string
  imageUrl: string | null
  tags: string[]
  variants: CatalogVariant[]
  images: CatalogImage[]
}

export interface CatalogVariant {
  id: number
  sku: string
  option1_name: string
  option1_value: string
  option2_name: string
  option2_value: string
  option3_name: string
  option3_value: string
  price: number
  inventory_qty: number
  image: string
  is_active: boolean
}

export interface CatalogImage {
  id: number
  image_url: string
  alt_text: string
  position: number
}

export interface CatalogPage {
  products: CatalogProduct[]
  count: number
  next: string | null
  previous: string | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

const CATEGORY_RULES = [
  {
    id: 'hogar',
    label: 'Hogar',
    keywords: [
      'indoor',
      'home',
      'sofa',
      'couch',
      'pillows',
      'pillow',
      'bed',
      'bedroom',
      'table',
      'chair',
      'armchair',
      'candle',
      'drawers',
      'light',
      'beanbag',
      'furniture',
      'decor',
    ],
  },
  {
    id: 'jardin',
    label: 'Jardin',
    keywords: [
      'outdoor',
      'garden',
      'gardening',
      'plants',
      'plant',
      'watering',
      'trowel',
      'fence',
      'pots',
      'potting',
      'patio',
    ],
  },
  {
    id: 'joyeria',
    label: 'Joyeria',
    keywords: [
      'necklace',
      'bracelet',
      'earrings',
      'earring',
      'bangle',
      'choker',
      'jewel',
      'jewelry',
      'gem',
      'diamond',
      'turquoise',
      'charm',
    ],
  },
  {
    id: 'moda',
    label: 'Moda',
    keywords: [
      'apparel',
      'fashion',
      'shirt',
      'jacket',
      'skirt',
      'top',
      'tuxedo',
      'blouse',
      'jumper',
      'bag',
      'cotton',
      'silk',
      'denim',
      'high tops',
      'women',
      'men',
      'sports tee',
    ],
  },
  {
    id: 'alimentos',
    label: 'Alimentos',
    keywords: ['food', 'gourmet', 'cafe', 'coffee', 'miel', 'honey', 'chocolate', 'cacao'],
  },
  {
    id: 'tecnologia',
    label: 'Tecnologia',
    keywords: ['tech', 'technology', 'laptop', 'phone', 'tablet', 'headphone', 'smart'],
  },
  {
    id: 'regalos',
    label: 'Regalos',
    keywords: ['gift', 'regalo', 'pack', 'set'],
  },
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function readNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleFromSlug(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function splitTags(value: unknown) {
  const rawTags = readString(value)
  if (!rawTags) {
    return []
  }

  return rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function isPlaceholderTitle(value: string | null) {
  if (!value) {
    return true
  }

  const normalized = value.trim().toLowerCase()
  return normalized === 'producto sin titulo' || normalized === 'product without title'
}

function buildFallbackDescription(name: string, categoryLabel: string) {
  return `Descubre ${name.toLowerCase()} dentro de ${categoryLabel.toLowerCase()} en nuestro catalogo.`
}

function resolveCategory(options: {
  explicitId: string | null
  explicitLabel: string | null
  rawCategory: string | null
  name: string
  description: string
  provider: string
  slug: string
  tags: string[]
}) {
  if (options.explicitId || options.explicitLabel) {
    const categoryLabel = options.explicitLabel ?? titleFromSlug(options.explicitId ?? 'otros')
    const categoryId = options.explicitId ?? (slugify(categoryLabel) || 'otros')

    return {
      categoryId,
      categoryLabel,
    }
  }

  const searchIndex = [
    options.rawCategory,
    options.name,
    options.description,
    options.provider,
    options.slug,
    ...options.tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => searchIndex.includes(keyword))) {
      return {
        categoryId: rule.id,
        categoryLabel: rule.label,
      }
    }
  }

  if (options.rawCategory) {
    return {
      categoryId: slugify(options.rawCategory) || 'otros',
      categoryLabel: titleFromSlug(options.rawCategory),
    }
  }

  return {
    categoryId: 'otros',
    categoryLabel: 'Otros',
  }
}

function parseCatalogProduct(payload: unknown): CatalogProduct | null {
  if (!isRecord(payload)) {
    return null
  }

  const id = readNumber(payload.id)
  const slug = readString(payload.handle) ?? readString(payload.slug) ?? `producto-${id ?? 'sin-id'}`
  const rawName = readString(payload.title) ?? readString(payload.name)
  const resolvedName = isPlaceholderTitle(rawName) ? titleFromSlug(slug) : rawName
  const rawDescription = readString(payload.body_html) ?? readString(payload.description)
  const rawPrice = payload.variant_price ?? payload.price
  const rawStock = payload.variant_inventory_qty ?? payload.stock
  const provider = readString(payload.vendor) ?? readString(payload.provider) ?? 'Luz Marina'
  const price = readNumber(rawPrice)
  const stock = readNumber(rawStock)
  const tags = splitTags(payload.tags)
  const rawCategory = readString(payload.product_type) ?? readString(payload.category)
  const imageUrl = readString(payload.image_src) ?? readString(payload.imageUrl)
  const variants = isRecord(payload) && Array.isArray(payload.variants)
    ? payload.variants.filter(isRecord).map((variant) => ({
      id: Number(variant.id), sku: String(variant.sku ?? ''),
      option1_name: String(variant.option1_name ?? ''), option1_value: String(variant.option1_value ?? ''),
      option2_name: String(variant.option2_name ?? ''), option2_value: String(variant.option2_value ?? ''),
      option3_name: String(variant.option3_name ?? ''), option3_value: String(variant.option3_value ?? ''),
      price: Number(variant.price ?? 0), inventory_qty: Number(variant.inventory_qty ?? 0),
      image: String(variant.image ?? ''), is_active: variant.is_active !== false,
    })) : []
  const images = isRecord(payload) && Array.isArray(payload.images)
    ? payload.images.filter(isRecord).map((image) => ({
      id: Number(image.id), image_url: String(image.image_url ?? ''),
      alt_text: String(image.alt_text ?? ''), position: Number(image.position ?? 0),
    })) : []

  if (id === null || !resolvedName || price === null || stock === null) {
    return null
  }

  const category = resolveCategory({
    explicitId: readString(payload.categoryId),
    explicitLabel: readString(payload.categoryLabel),
    rawCategory,
    name: resolvedName,
    description: rawDescription ?? '',
    provider,
    slug,
    tags,
  })
  const description =
    (rawDescription ? stripHtml(rawDescription) : '') ||
    buildFallbackDescription(resolvedName, category.categoryLabel)

  return {
    id,
    slug,
    name: resolvedName,
    description,
    price,
    stock,
    provider,
    categoryId: category.categoryId,
    categoryLabel: category.categoryLabel,
    imageUrl,
    tags,
    variants,
    images,
  }
}

// El listado publico de productos se consume sin autenticacion para la portada.
export async function fetchPublicCatalogProducts(params: {
  search?: string
  category?: string
  ordering?: string
  page?: number
  min_price?: string
  max_price?: string
} = {}): Promise<CatalogPage> {
  const query = new URLSearchParams()
  query.set('page_size', '48')
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, String(value))
  })
  const rawProducts: unknown[] = []
  let nextUrl: string | null = `${API_BASE_URL}/products/?${query.toString()}`
  let totalCount = 0

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: { Accept: 'application/json' } })

    if (!response.ok) {
      throw new Error('No se pudo cargar el catalogo publico desde el backend.')
    }

    const payload = (await response.json().catch(() => [])) as unknown
    const paginated = isRecord(payload) && Array.isArray(payload.results)
    const pageProducts = Array.isArray(payload) ? payload : paginated ? payload.results : []
    rawProducts.push(...pageProducts)
    totalCount = paginated && typeof payload.count === 'number' ? payload.count : rawProducts.length
    nextUrl = paginated && typeof payload.next === 'string' ? payload.next : null
  }

  return {
    products: rawProducts
    .map((product) => parseCatalogProduct(product))
    .filter((product): product is CatalogProduct => product !== null),
    count: totalCount,
    next: null,
    previous: null,
  }
}

export async function fetchPublicProduct(handle: string): Promise<CatalogProduct> {
  const response = await fetch(`${API_BASE_URL}/products/by-handle/${encodeURIComponent(handle)}/`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('No se pudo cargar el producto solicitado.')
  const product = parseCatalogProduct(await response.json())
  if (!product) throw new Error('El producto recibido no tiene datos válidos.')
  return product
}
