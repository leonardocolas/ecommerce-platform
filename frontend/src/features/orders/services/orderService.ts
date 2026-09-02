import { apiFetch } from '../../../lib/apiFetch'

export interface OrderItem {
  product: number
  variant: number | null
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
  customer_name: string
  tax_id: string
  shipping_address: string
  customer_email: string
  invoice_number: string | null
  payment_due_at: string | null
  bank_transfer_details: { holder: string; bank: string; iban: string }
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  shipping_carrier: string
  tracking_number: string
}

export async function downloadOrderProforma(id: number): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'
  const token = localStorage.getItem('tienda.accessToken')
  const response = await fetch(`${baseUrl}/orders/${id}/proforma/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('No se pudo generar la factura proforma.')

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `proforma-${id}.pdf`
  link.click()
  URL.revokeObjectURL(url)
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

export async function createOrder(
  items: { product: number; quantity: number; variant?: number | null }[],
  customer: {
    customer_name: string
    tax_id: string
    shipping_address: string
    customer_email: string
  },
): Promise<Order> {
  const data = await apiFetch('/orders/', {
    method: 'POST',
    body: JSON.stringify({ items, ...customer }),
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
