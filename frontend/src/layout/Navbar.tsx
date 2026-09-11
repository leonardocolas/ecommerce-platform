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
    <header className="sticky top-0 z-20 border-b border-marina-200/80 bg-marina-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-4">
            <img src={logo} alt="Luz Marina" className="h-10 w-auto rounded-full" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-marina-700">Luz Marina</p>
              <h1 className="text-2xl font-semibold text-marina-950">Tienda Virtual</h1>
            </div>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="hidden lg:flex lg:max-w-md lg:flex-1 lg:px-8">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-marina-400">
              <SearchIcon color="#0f766e" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-marina-200 py-2.5 pl-10 pr-4 text-sm focus:border-marina-400 focus:outline-none focus:ring-1 focus:ring-marina-400"
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-marina-700 transition hover:bg-amber-50 hover:text-amber-700"
          >
            <ShoppingCartIcon color="#0f766e" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-marina-100 text-marina-700 font-bold text-xs">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          {user && (
            <Link
              to="/orders"
              className="hidden rounded-full px-3 py-2 text-sm text-marina-700 transition hover:bg-emerald-50 hover:text-emerald-700 sm:inline-block"
            >
              Mis compras
            </Link>
          )}

          {user && <Link to="/profile" className="hidden rounded-full px-3 py-2 text-sm text-marina-700 transition hover:bg-violet-50 hover:text-violet-700 sm:inline-block">Mi perfil</Link>}

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-marina-600 transition hover:bg-amber-50 hover:text-amber-700 sm:inline-block"
            >
              Admin
            </Link>
          )}

          <div className="rounded-full border border-marina-200 bg-white px-4 py-2 text-sm text-marina-700 shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
            {user ? (
              <>
                <span className="font-semibold text-marina-950">{user.username}</span>
                <span className="mx-2 text-marina-300">|</span>
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
              className="inline-flex items-center justify-center rounded-full bg-marina-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 hover:shadow-lg hover:shadow-red-600/30"
            >
              Cerrar sesion
            </button>
          ) : (
            <>
              <Link
                to="/login"
                state={{ redirectTo: currentPath, actionLabel: 'entrar a comprar' }}
                className="inline-flex items-center justify-center rounded-full border border-marina-300 px-5 py-2.5 text-sm font-semibold text-marina-900 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Iniciar sesion
              </Link>
              <Link
                to="/register"
                state={{ redirectTo: currentPath, actionLabel: 'crear tu cuenta y comprar' }}
                className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-marina-950 transition hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/30"
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
