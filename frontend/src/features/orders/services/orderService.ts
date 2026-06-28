export interface OrderItem {
  product: number
  quantity: number
  price: number
  product_title: string
  product_image: string | null
}

export interface Order {
  id: number
  user: number
  status: string
  total: number
  items: OrderItem[]
  created_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('tienda.accessToken')
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchOrders(params?: {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<Order[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.date_from) searchParams.set('date_from', params.date_from)
  if (params?.date_to) searchParams.set('date_to', params.date_to)
  if (params?.search) searchParams.set('search', params.search)

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/orders/${query ? `?${query}` : ''}`

  const response = await fetch(url, { headers: authHeaders() })
  if (!response.ok) throw new Error('No se pudieron cargar las ordenes')

  const data = await response.json()
  return Array.isArray(data) ? data : data.results || []
}

export async function fetchOrder(id: number): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${id}/`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Orden no encontrada')
  return response.json()
}

export async function createOrder(items: { product: number; quantity: number }[]): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ items }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error al crear la orden' }))
    throw new Error(error.error || error.detail || 'Error al crear la orden')
  }
  return response.json()
}

export async function fetchAdminOrders(params?: {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<Order[]> {
  return fetchOrders(params)
}
