import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const platformHighlights = [
  {
    title: 'Home siempre abierto',
    description: 'Los invitados pueden recorrer el catalogo antes de crear una cuenta.',
  },
  {
    title: 'Auth con retorno',
    description: 'Cuando el usuario inicia sesion vuelve al home para continuar la compra.',
  },
  {
    title: 'Roles visibles',
    description: 'La portada muestra el rol activo apenas termina la autenticacion.',
  },
]

interface AuthPageLayoutProps {
  eyebrow: string
  title: string
  description: string
  alternateQuestion: string
  alternateLabel: string
  alternateTo: string
  alternateState?: unknown
  children: ReactNode
}

export default function AuthPageLayout({
  eyebrow,
  title,
  description,
  alternateQuestion,
  alternateLabel,
  alternateTo,
  alternateState,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/95 shadow-[0_30px_120px_-45px_rgba(15,23,42,0.95)] lg:grid-cols-[1.15fr_0.85fr]">
          <aside className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white sm:px-10 lg:px-12">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300 text-base font-bold text-slate-950 shadow-lg shadow-amber-300/25">
                EP
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Tienda virtual</p>
                <h2 className="mt-1 text-lg font-semibold">Ecommerce Platform</h2>
              </div>
            </div>

            <div className="mt-12 max-w-lg">
              <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">{eyebrow}</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Accede solo cuando la compra realmente lo necesita.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                El home sigue siendo publico, pero el flujo de acceso ya esta listo para que el
                usuario vuelva a la portada sin perder el contexto de compra.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {platformHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
                >
                  <p className="text-sm font-semibold text-white">{highlight.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{highlight.description}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="px-6 py-8 sm:px-10 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-amber-600">
                {eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>

              <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:p-8">
                {children}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600">
                <span>{alternateQuestion}</span>
                <Link
                  to={alternateTo}
                  state={alternateState}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-medium text-slate-900 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  {alternateLabel}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
