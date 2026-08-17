import { apiFetch } from '../../../lib/apiFetch'

export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
  is_staff: boolean
  date_joined: string
  order_count: number
}

export interface AdminProduct {
  id: number
  handle: string
  title: string
  variant_price: number
  variant_inventory_qty: number
  product_type: string
  vendor: string
  published: boolean
  image_src: string | null
  created_at: string
  updated_at: string
}

export interface AdminOrder {
  id: number
  user: number
  status: string
  total: number
  items: Array<{ product: number; quantity: number; price: number; product_title: string; product_image: string | null }>
  created_at: string
}

export interface AdminBanner {
  id: number
  title: string
  subtitle: string
  description: string
  image_url: string | null
  link_url: string
  position: number
  is_active: boolean
  created_at: string
}

export interface AdminCoupon {
  id: number
  code: string
  description: string
  discount_type: string
  discount_value: number
  min_purchase: number
  max_uses: number
  used_count: number
  valid_from: string
  valid_to: string | null
  is_active: boolean
  is_valid: boolean
  applicable_categories: string[]
}

// Users
export const adminUserApi = {
  list: (params?: { role?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.role) q.set('role', params.role)
    if (params?.search) q.set('search', params.search)
    const query = q.toString()
    return apiFetch(`/auth/admin/users/${query ? `?${query}` : ''}`) as Promise<AdminUser[]>
  },
  toggleActive: (id: number) => apiFetch(`/auth/admin/users/${id}/toggle_active/`, { method: 'PATCH' }) as Promise<{ is_active: boolean }>,
  changeRole: (id: number, role: string) => apiFetch(`/auth/admin/users/${id}/change_role/`, { method: 'PATCH', body: JSON.stringify({ role }) }) as Promise<{ role: string }>,
}

// Products
export const adminProductApi = {
  list: () => apiFetch('/products/') as Promise<AdminProduct[]>,
  update: (id: number, data: Partial<AdminProduct>) => apiFetch(`/products/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<AdminProduct>,
}

// Orders
export const adminOrderApi = {
  list: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    const query = q.toString()
    return apiFetch(`/orders/${query ? `?${query}` : ''}`) as Promise<AdminOrder[]>
  },
  updateStatus: (id: number, status: string) => apiFetch(`/orders/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }) as Promise<AdminOrder>,
}

// Banners
export const adminBannerApi = {
  list: () => apiFetch('/banners/') as Promise<AdminBanner[]>,
  create: (data: Partial<AdminBanner>) => apiFetch('/banners/', { method: 'POST', body: JSON.stringify(data) }) as Promise<AdminBanner>,
  update: (id: number, data: Partial<AdminBanner>) => apiFetch(`/banners/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<AdminBanner>,
  delete: (id: number) => apiFetch(`/banners/${id}/`, { method: 'DELETE' }),
}

// Coupons
export const adminCouponApi = {
  list: () => apiFetch('/coupons/') as Promise<AdminCoupon[]>,
  create: (data: Partial<AdminCoupon>) => apiFetch('/coupons/', { method: 'POST', body: JSON.stringify(data) }) as Promise<AdminCoupon>,
  update: (id: number, data: Partial<AdminCoupon>) => apiFetch(`/coupons/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }) as Promise<AdminCoupon>,
  delete: (id: number) => apiFetch(`/coupons/${id}/`, { method: 'DELETE' }),
}
