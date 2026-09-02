import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthPageLayout from '../components/AuthPageLayout'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo procesar la solicitud.')
      setMessage(data.message)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'No se pudo procesar la solicitud.')
    }
  }

  return <AuthPageLayout eyebrow="Recuperación segura" title="Recupera tu cuenta" description="Te enviaremos instrucciones al correo asociado a tu cuenta."><form onSubmit={submit} className="space-y-5"><label className="block text-sm font-medium text-slate-700">Correo<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-2xl border border-slate-200 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500" placeholder="tu_correo@dominio.com" /></label>{message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}{error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">Enviar instrucciones</button><Link to="/login" className="block text-center text-sm font-semibold text-amber-700">Volver al login</Link></form></AuthPageLayout>
}
