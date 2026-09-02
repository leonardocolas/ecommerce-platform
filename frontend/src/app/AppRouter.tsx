import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import HomePage from '../features/storefront/pages/HomePage'
import ProductsPage from '../features/products/pages/ProductsPage'
import ProductDetailPage from '../features/products/pages/ProductDetailPage'
import CartPage from '../features/cart/pages/CartPage'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import ProfilePage from '../features/auth/pages/ProfilePage'
import OrderHistoryPage from '../features/orders/pages/OrderHistoryPage'
import OrderDetailPage from '../features/orders/pages/OrderDetailPage'
import {
  AdminLayout,
  AdminDashboard,
  AdminProducts,
  AdminOrders,
  AdminUsers,
  AdminBanners,
  AdminCoupons,
} from '../features/admin'
import { readAuthRedirectState } from '../features/auth/utils/authRedirect'
import { AuthProvider, useAuth } from '../hooks/useAuth'

function LoadingScreen({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/10 p-10 text-center shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Ecommerce Platform</p>
        <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-slate-200">{description}</p>
      </div>
    </div>
  )
}

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, loading } = useAuth()
  const { redirectTo } = readAuthRedirectState(location.state)

  if (loading) {
    return (
      <LoadingScreen
        title="Preparando acceso"
        description="Estamos verificando tu sesion antes de mostrar la pantalla de acceso."
      />
    )
  }

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <LoadingScreen
        title="Verificando acceso"
        description="Estamos validando tus permisos de administrador."
      />
    )
  }

  if (!user || !['ADMIN', 'STAFF'].includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <GuestOnlyRoute>
                <LoginPage />
              </GuestOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnlyRoute>
                <RegisterPage />
              </GuestOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<GuestOnlyRoute><ForgotPasswordPage /></GuestOnlyRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:handle" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/shop" element={<Navigate to="/products" replace />} />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="coupons" element={<AdminCoupons />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
