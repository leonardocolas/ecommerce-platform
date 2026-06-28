export interface Banner {
  id: number
  title: string
  subtitle: string
  description: string
  image_url: string | null
  link_url: string
  position: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/banners/`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : data.results || []
  } catch {
    return []
  }
}
