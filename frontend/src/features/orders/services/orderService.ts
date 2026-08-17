import { apiFetch } from '../../../lib/apiFetch'

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
  const data = await apiFetch(`/orders/${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data : (data as { results: Order[] }).results || []
}

export async function fetchOrder(id: number): Promise<Order> {
  return apiFetch(`/orders/${id}/`) as Promise<Order>
}

export async function createOrder(items: { product: number; quantity: number }[]): Promise<Order> {
  const data = await apiFetch('/orders/', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  return data as Order
}

export async function fetchAdminOrders(params?: {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<Order[]> {
  return fetchOrders(params)
}
