import { useState } from 'react'
import { useCartStore } from '../services/cartService'

export default function CouponInput() {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { applyCoupon, removeCoupon, couponCode } = useCartStore()

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)
    setMessage('')
    const result = await applyCoupon(code.trim())
    setMessage(result.message)
    setLoading(false)
    if (result.discount > 0) setCode('')
  }

  const handleRemove = () => {
    removeCoupon()
    setCode('')
    setMessage('')
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <div>
          <span className="text-sm font-medium text-green-700">Cupon aplicado: {couponCode}</span>
          {message && <p className="text-xs text-green-600">{message}</p>}
        </div>
        <button onClick={handleRemove} className="text-sm text-red-500 hover:text-red-700">
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Codigo de cupon"
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? '...' : 'Aplicar'}
        </button>
      </div>
      {message && !couponCode && <p className="mt-2 text-xs text-red-500">{message}</p>}
    </div>
  )
}
