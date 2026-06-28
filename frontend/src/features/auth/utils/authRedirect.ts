interface AuthRedirectState {
  redirectTo: string
  actionLabel: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Evitamos redirecciones inseguras y damos un destino consistente por defecto.
export function readAuthRedirectState(state: unknown): AuthRedirectState {
  if (!isRecord(state)) {
    return {
      redirectTo: '/',
      actionLabel: 'continuar comprando',
    }
  }

  const redirectTo = state.redirectTo
  const actionLabel = state.actionLabel

  return {
    redirectTo:
      typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/',
    actionLabel: typeof actionLabel === 'string' ? actionLabel : 'continuar comprando',
  }
}
