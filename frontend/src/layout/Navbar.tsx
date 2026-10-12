import type { FormEvent } from 'react'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { useCartStore, useCartItemCount } from '../features/cart/services/cartService'
import logo from '../img/Logo.jpeg'

function SearchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

function ShoppingCartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" className="h-5 w-5">
      <path
        d="M3 4h2l1.2 6.2A2 2 0 0 0 8.2 12h8.6a2 2 0 0 0 2-1.6L20 6H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const itemCount = useCartItemCount()
  const fetchCart = useCartStore((s) => s.fetchCart)
  const currentPath =
    typeof window === 'undefined' ? '/' : `${window.location.pathname}${window.location.search}`

  useEffect(() => {
    fetchCart()
  }, [fetchCart, user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      return
    }

    navigate('/products')
  }

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF'

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#111827]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-4">
            <img src={logo} alt="Luz Marina" className="h-10 w-auto rounded-full ring-2 ring-[#d6b06d]/60 ring-offset-2 ring-offset-[#111827]" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#d6b06d]">Luz Marina</p>
              <h1 className="text-2xl font-semibold text-white">Tienda Virtual</h1>
            </div>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden lg:flex lg:max-w-md lg:flex-1 lg:px-8">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d6b06d]">
              <SearchIcon color="#d6b06d" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-300 focus:border-[#d6b06d]/80 focus:outline-none focus:ring-1 focus:ring-[#d6b06d]/80"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
          <Link
            to="/cart"
            className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-[#f8e7c2] transition hover:border-[#d6b06d]/70 hover:bg-[#d6b06d]/10 hover:text-[#f8e7c2]"
          >
            <ShoppingCartIcon color="#f8e7c2" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#d6b06d] text-[10px] font-bold text-[#111827]">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {user && (
            <Link
              to="/orders"
              className="hidden rounded-full px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white sm:inline-block"
            >
              Mis compras
            </Link>
          )}

          {user && <Link to="/profile" className="hidden rounded-full px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white sm:inline-block">Mi perfil</Link>}

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#f8e7c2] transition hover:bg-[#d6b06d]/10 hover:text-[#f8e7c2] sm:inline-block"
            >
              Admin
            </Link>
          )}

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 shadow-sm">
            {user ? (
              <>
                <span className="font-semibold text-white">{user.username}</span>
                <span className="mx-2 text-slate-400">|</span>
                <span>{user.role}</span>
              </>
            ) : (
              <span>Invitado</span>
            )}
          </div>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full bg-[#d6b06d] px-5 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#e7c98d]"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link
                to="/login"
                state={{ redirectTo: currentPath, actionLabel: 'entrar a comprar' }}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#d6b06d]/80 hover:bg-[#d6b06d]/10"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                state={{ redirectTo: currentPath, actionLabel: 'crear tu cuenta y comprar' }}
                className="inline-flex items-center justify-center rounded-full bg-[#d6b06d] px-5 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#e7c98d]"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
