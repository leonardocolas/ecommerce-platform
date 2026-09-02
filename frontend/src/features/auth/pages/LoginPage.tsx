import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AuthForm, { type AuthField } from '../components/AuthForm'
import AuthPageLayout from '../components/AuthPageLayout'
import { readAuthRedirectState } from '../utils/authRedirect'
import { useAuth } from '../../../hooks/useAuth'
import { useCartStore } from '../../cart/services/cartService'

const loginFields: AuthField[] = [
  {
    name: 'username',
    label: 'Usuario',
    placeholder: 'tu_usuario',
    type: 'text',
    autoComplete: 'username',
  },
  {
    name: 'password',
    label: 'Contrasena',
    placeholder: 'Tu contrasena',
    type: 'password',
    autoComplete: 'current-password',
  },
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'No se pudo iniciar sesion.'
}

export default function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { mergeCart } = useCartStore()
  const [error, setError] = useState<string | null>(null)
  const { redirectTo, actionLabel } = readAuthRedirectState(location.state)

  const handleSubmit = async (formData: FormData) => {
    const username = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    setError(null)

    try {
      const authenticatedUser = await login(username, password)

      mergeCart()

      navigate(redirectTo, {
        replace: true,
        state: {
          flashMessage: `Bienvenido ${authenticatedUser.username}. Entraste como ${authenticatedUser.role} y ya puedes ${actionLabel}.`,
        },
      })
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue))
    }
  }

  return (
    <AuthPageLayout
      eyebrow="Acceso seguro"
      title="Inicia tu sesion"
      description="Inicia sesion solo cuando quieras comprar o continuar una accion protegida. Despues volveras al home automaticamente."
      alternateQuestion="Todavia no tienes cuenta?"
      alternateLabel="Crear cuenta"
      alternateTo="/register"
      alternateState={location.state}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-slate-700">
          El login envia <span className="font-semibold">username</span> y{' '}
          <span className="font-semibold">password</span> como espera el backend.
        </div>

        <AuthForm
          onSubmit={handleSubmit}
          submitLabel="Entrar a la tienda"
          error={error}
          fields={loginFields}
        />
        <p className="text-center text-sm"><a href="/forgot-password" className="font-semibold text-amber-700 hover:underline">¿Olvidaste tu contraseña?</a></p>
      </div>
    </AuthPageLayout>
  )
}
