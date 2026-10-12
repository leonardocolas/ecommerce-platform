import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../orders/services/orderService'
import { useCartStore } from '../cart/services/cartService'
import { apiFetch } from '../../lib/apiFetch'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconSpinner() {
  return (
    <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckoutStep = 'confirm' | 'processing' | 'success' | 'failed'

interface StepInfo {
  label: string
  done: boolean
  active: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(value)
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps }: { steps: StepInfo[] }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, idx) => (
        <div key={step.label} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step.done
                ? 'bg-green-500 text-white'
                : step.active
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-200 text-slate-400'
            }`}
          >
            {step.done ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              idx + 1
            )}
          </div>
          <span
            className={`mx-1 text-xs ${step.active ? 'font-medium text-slate-700' : 'text-slate-400'}`}
          >
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className={`mx-1 h-px w-8 ${step.done ? 'bg-green-400' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CheckoutModalProps {
  onClose: () => void
}

type SavedAddress = {
  id: number
  label: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

function validateShippingAddress(address?: SavedAddress | null) {
  if (!address) {
    return ['Selecciona o crea una dirección de envío antes de confirmar el pedido.']
  }

  const normalizedAddress = String(address.address ?? '').trim()
  const city = String(address.city ?? '').trim()
  const state = String(address.state ?? '').trim()
  const postalCode = String(address.postal_code ?? '').trim()
  const country = String(address.country ?? '').trim()

  const checks: Record<string, string> = {
    shipping_address: 'La dirección es obligatoria y debe incluir calle y número.',
    shipping_city: 'La ciudad es obligatoria.',
    shipping_state: 'El estado o provincia es obligatorio.',
    shipping_postal_code: 'El código postal es obligatorio.',
    shipping_country: 'El país es obligatorio.',
  }

  if (!normalizedAddress || normalizedAddress.length < 6) {
    return [checks.shipping_address]
  }
  if (!city) return [checks.shipping_city]
  if (!state) return [checks.shipping_state]
  if (!postalCode || postalCode.length < 4 || postalCode.length > 12) {
    return [checks.shipping_postal_code]
  }
  if (!country) return [checks.shipping_country]

  return []
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const navigate = useNavigate()
  const { items, total, clearCart, discountAmount, couponCode } = useCartStore()
  const finalTotal = total - discountAmount

  const [step, setStep] = useState<CheckoutStep>('confirm')
  const [processingLabel, setProcessingLabel] = useState('')
  const [stepsState, setStepsState] = useState<StepInfo[]>([
    { label: 'Crear orden', done: false, active: false },
    { label: 'Generar proforma', done: false, active: false },
  ])
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Awaited<ReturnType<typeof createOrder>> | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [profileReady, setProfileReady] = useState(false)
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([apiFetch('/auth/profile/'), apiFetch('/auth/addresses/')])
      .then(([profile, savedAddresses]) => {
        const user = profile as { first_name?: string; last_name?: string; email?: string }
        setProfileReady(Boolean(user.first_name?.trim() && user.last_name?.trim() && user.email?.trim()))
        const nextAddresses = savedAddresses as SavedAddress[]
        setAddresses(nextAddresses)
        setSelectedAddressId(nextAddresses.find((address) => address.is_default)?.id ?? nextAddresses[0]?.id ?? null)
      })
      .catch(() => setErrorMessage('No se pudo cargar tu perfil. Revisa tus datos antes de comprar.'))
  }, [])

  function markStep(index: number, done: boolean, nextActive: boolean) {
    setStepsState((prev) =>
      prev.map((s, i) => {
        if (i === index) return { ...s, done, active: !done }
        if (i === index + 1) return { ...s, active: nextActive }
        return s
      }),
    )
  }

  async function handleConfirm() {
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId)
    const shippingErrors = validateShippingAddress(selectedAddress)

    if (!profileReady) {
      setErrorMessage('Completa tus datos personales antes de confirmar la compra.')
      return
    }

    if (shippingErrors.length > 0) {
      setErrorMessage(shippingErrors[0])
      return
    }

    setStep('processing')

    setProcessingLabel('Creando tu orden...')
    setStepsState((prev) =>
      prev.map((s, i) => ({ ...s, active: i === 0, done: false })),
    )

    let orderId: number
    try {
      const orderPayload = items.map((item) => ({
        product: item.product_id,
        quantity: item.quantity,
        variant: item.variant_id,
      }))
      const order = await createOrder(
        orderPayload,
        {
          shipping_address: selectedAddress!.address,
          shipping_city: selectedAddress!.city,
          shipping_state: selectedAddress!.state,
          shipping_postal_code: selectedAddress!.postal_code,
          shipping_country: selectedAddress!.country,
        },
        couponCode,
      )
      orderId = order.id
      setCreatedOrderId(orderId)
      setCreatedOrder(order)
      markStep(0, true, true)
    } catch (err) {
      setErrorMessage((err as Error).message || 'No se pudo crear la orden. Revisa los datos de envío e inténtalo de nuevo.')
      setStep('failed')
      return
    }

    setProcessingLabel('Guardando la proforma...')
    markStep(1, true, false)
    setStep('success')
    await clearCart()
  }

  function handleGoToOrder() {
    if (createdOrderId) {
      navigate(`/orders/${createdOrderId}`)
    } else {
      navigate('/orders')
    }
    onClose()
  }

  function handleRetry() {
    // Reset to the confirm step so the user can re-review their cart and
    // trigger a completely new order. We clear createdOrderId so that
    // handleConfirm always calls createOrder() fresh — the previous order
    // was already moved to CANCELED (and its stock restored) by the backend,
    // so a new order is always needed here.
    setStep('confirm')
    setErrorMessage('')
    setCreatedOrderId(null)
    setCreatedOrder(null)
    setStepsState([
      { label: 'Crear orden', done: false, active: false },
      { label: 'Procesar pago', done: false, active: false },
    ])
  }

  // ─── Render confirm ────────────────────────────────────────────────────────
  if (step === 'confirm') {
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId)
    const shippingErrors = validateShippingAddress(selectedAddress)

    return (
      <ModalShell onClose={onClose}>
        <div className="p-6">
          <span className="premium-badge">Checkout</span>
          <h2 className="mt-4 mb-2 text-3xl text-[#111827]">Confirmar pedido</h2>
          <p className="mb-6 text-sm text-slate-500">
            Revisa el envío, la dirección y el total antes de generar la factura proforma.
          </p>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e7dcc8] bg-[#fffaf5] px-3 py-3 text-sm text-slate-600 sm:col-span-2">
              {profileReady ? 'Perfil completo y listo para comprar.' : 'Completa nombre, apellidos y correo para comprar.'}
            </div>
            {addresses.length > 0 ? (
              <select
                value={selectedAddressId ?? ''}
                onChange={(event) => setSelectedAddressId(Number(event.target.value))}
                className="rounded-2xl border border-[#e7dcc8] bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[#d6b06d] focus:outline-none sm:col-span-2"
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}: {address.address}, {address.city}, {address.postal_code}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 sm:col-span-2">
                No tienes una dirección guardada. Añádela desde Mi perfil antes de generar el pedido.
              </p>
            )}
          </div>

          {selectedAddress && (
            <div className="mb-4 rounded-[22px] border border-[#e7dcc8] bg-[#fffaf5] p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Envío</p>
              <p className="text-sm font-semibold text-slate-900">{selectedAddress.label}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedAddress.address}</p>
              <p className="text-sm text-slate-600">
                {selectedAddress.city}, {selectedAddress.state} · {selectedAddress.postal_code}
              </p>
              <p className="text-sm text-slate-600">{selectedAddress.country}</p>
            </div>
          )}

          {shippingErrors.length > 0 && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {shippingErrors[0]}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mb-4 max-h-52 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#e7dcc8] bg-[#fffaf5] p-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#f4e7d7]">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.product_title}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.product_price)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-[#111827]">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] bg-[#fffaf5] p-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {discountAmount > 0 && couponCode && (
              <div className="flex justify-between text-sm font-medium text-emerald-700">
                <span>Descuento ({couponCode})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#e7dcc8] pt-2 text-base font-bold text-[#111827]">
              <span>Total a pagar</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            El pedido quedará pendiente de pago hasta que confirmemos tu transferencia.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!profileReady || shippingErrors.length > 0 || addresses.length === 0}
              className="premium-button flex-1 py-3 text-sm font-bold uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generar pedido
            </button>
          </div>
        </div>
      </ModalShell>
    )
  }

  // ─── Render processing ────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <ModalShell onClose={() => {}}>
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-6 text-amber-400">
            <IconSpinner />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-950">Procesando tu pedido</h2>
          <p className="mb-8 text-sm text-slate-500">{processingLabel}</p>
          <StepIndicator steps={stepsState} />
        </div>
      </ModalShell>
    )
  }

  // ─── Render success ───────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <ModalShell onClose={onClose}>
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 text-green-500">
            <IconCheck />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-slate-950">¡Pedido recibido!</h2>
          <p className="mb-2 text-slate-500">Tu factura proforma está lista. El pedido queda pendiente de pago.</p>
          {createdOrderId && (
            <p className="mb-6 text-sm font-medium text-slate-700">
              Factura <span className="font-bold text-slate-950">{createdOrder?.invoice_number}</span>
            </p>
          )}
          <div className="mb-2 rounded-xl bg-slate-50 px-6 py-3">
            <p className="text-sm text-slate-500">Total a transferir</p>
            <p className="text-2xl font-bold text-slate-950">{formatCurrency(finalTotal)}</p>
          </div>
          <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Instrucciones de pago</p>
            <p className="mt-2">Realiza la transferencia a esta cuenta:</p>
            <p className="mt-1 text-xs text-slate-600">Titular: {createdOrder?.bank_transfer_details.holder}</p>
            <p className="text-xs text-slate-600">Banco: {createdOrder?.bank_transfer_details.bank}</p>
            <p className="text-xs text-slate-600">IBAN: {createdOrder?.bank_transfer_details.iban}</p>
            <p className="mt-2 text-xs text-slate-500">Concepto: {createdOrder?.invoice_number}. Fecha límite: {createdOrder?.payment_due_at ? new Date(createdOrder.payment_due_at).toLocaleDateString('es-ES') : 'Pendiente'}.</p>
          </div>

          <div className="mt-6 flex w-full flex-wrap gap-3">
            <button
              onClick={onClose}
              className="flex-1  border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Seguir comprando
            </button>
            <button
              onClick={handleGoToOrder}
              className="flex-1 rounded-full bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ver mi orden
            </button>
          </div>
        </div>
      </ModalShell>
    )
  }

  // ─── Render failed ────────────────────────────────────────────────────────
  return (
    <ModalShell onClose={onClose}>
      <div className="flex flex-col items-center p-8 text-center">
        <div className="mb-4 text-red-500">
          <IconX />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-950">No se pudo completar el pedido</h2>
        <p className="mb-6 text-sm text-slate-500">
          {errorMessage || 'El pedido no pudo finalizarse. Revisa los datos de envío e inténtalo de nuevo.'}
        </p>
        {createdOrderId && (
          <p className="mb-4 text-xs text-slate-400">
            La orden <span className="font-semibold text-slate-600">#{createdOrderId}</span> fue
            cancelada y el stock restituido. Al reintentar se creará una nueva orden.
          </p>
        )}

        <div className="mt-2 flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al carrito
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 rounded-full bg-amber-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Nueva orden
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── Modal shell (backdrop + card) ───────────────────────────────────────────

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  )
}
