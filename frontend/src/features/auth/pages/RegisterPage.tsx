import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AuthForm, { type AuthField } from '../components/AuthForm'
import AuthPageLayout from '../components/AuthPageLayout'
import { readAuthRedirectState } from '../utils/authRedirect'
import { useAuth } from '../../../hooks/useAuth'

const registerFields: AuthField[] = [
  {
    name: 'username',
    label: 'Usuario',
    placeholder: 'elige_un_usuario',
    type: 'text',
    autoComplete: 'username',
    helperText: 'Django autentica con username, por eso este campo es obligatorio.',
  },
  {
    name: 'email',
    label: 'Correo',
    placeholder: 'tu_correo@dominio.com',
    type: 'email',
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Contrasena',
    placeholder: 'Minimo 8 caracteres',
    type: 'password',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirmar contrasena',
    placeholder: 'Repite la contrasena',
    type: 'password',
    autoComplete: 'new-password',
  },
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'No se pudo crear la cuenta.'
}

export default function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const { redirectTo, actionLabel } = readAuthRedirectState(location.state)

  const handleSubmit = async (formData: FormData) => {
    const username = String(formData.get('username') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')

    setError(null)

    try {
      const authenticatedUser = await register({ username, email, password, confirmPassword })

      navigate(redirectTo, {
        replace: true,
        state: {
          flashMessage: `Cuenta creada para ${authenticatedUser.username}. Ya entraste como ${authenticatedUser.role} y puedes ${actionLabel}.`,
        },
      })
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue))
    }
  }

  return (
    <AuthPageLayout
      eyebrow="Registro conectado"
      title="Crea tu cuenta"
      description="Registra tu cuenta cuando quieras comprar. Al terminar, volveras al home con la sesion activa."
      alternateQuestion="Ya tienes una cuenta?"
      alternateLabel="Ir al login"
      alternateTo="/login"
      alternateState={location.state}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-slate-700">
          Al registrarte se crea el usuario y despues se inicia sesion automaticamente.
        </div>

        <AuthForm
          onSubmit={handleSubmit}
          submitLabel="Crear cuenta y entrar"
          error={error}
          fields={registerFields}
        />
      </div>
    </AuthPageLayout>
  )
}
