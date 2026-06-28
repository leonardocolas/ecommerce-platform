import { useEffect, useId } from 'react'

interface WarningDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onClose: () => void
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 8v5" strokeLinecap="round" />
      <path d="M12 16h.01" strokeLinecap="round" />
      <path
        d="M10.3 3.9 2.6 17.2A1.7 1.7 0 0 0 4.1 19.8h15.8a1.7 1.7 0 0 0 1.5-2.6L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WarningDialog({
  open,
  title,
  description,
  confirmLabel = 'Entendido',
  onClose,
}: WarningDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-[32px] border border-amber-100 bg-white p-6 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.7)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <WarningIcon />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">Aviso</p>
            <h2 id={titleId} className="mt-2 text-2xl font-semibold text-slate-950">
              {title}
            </h2>
            <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 hover:text-slate-950"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
