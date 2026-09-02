import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../orders/services/orderService'
import { useCartStore } from '../cart/services/cartService'
import { downloadOrderProforma } from '../orders/services/orderService'

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

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const navigate = useNavigate()
  const { items, total, clearCart, discountAmount } = useCartStore()
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
  const [customer, setCustomer] = useState({
    customer_name: '',
    tax_id: '',
    shipping_address: '',
    customer_email: '',
  })

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
    setStep('processing')

    // ── Paso 1: Crear orden ──────────────────────────────────────────────────
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
        const order = await createOrder(orderPayload, customer)
      orderId = order.id
      setCreatedOrderId(orderId)
        setCreatedOrder(order)
      markStep(0, true, true)
    } catch (err) {
      setErrorMessage((err as Error).message || 'Error al crear la orden')
      setStep('failed')
      return
    }

    setProcessingLabel('Guardando la proforma...')
    markStep(1, true, false)
    setStep('success')
    await clearCart()
  }

  async function downloadInvoice() {
    if (!createdOrder) return
    await downloadOrderProforma(createdOrder.id)
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
    return (
      <ModalShell onClose={onClose}>
        <div className="p-6">
          <h2 className="mb-1 text-xl font-bold text-slate-950">Confirmar pedido</h2>
          <p className="mb-6 text-sm text-slate-500">
            Completa tus datos para generar la factura proforma y recibir las instrucciones de transferencia.
          </p>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <input required placeholder="Nombre completo" value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input required placeholder="NIF/CIF" value={customer.tax_id} onChange={(e) => setCustomer({ ...customer, tax_id: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
            <input required type="email" placeholder="Email" value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none sm:col-span-2" />
            <textarea required placeholder="Dirección de entrega" value={customer.shipping_address} onChange={(e) => setCustomer({ ...customer, shipping_address: e.target.value })} className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none sm:col-span-2" />
          </div>

          {/* Lista de items */}
          <div className="mb-4 max-h-52 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
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
                  <p className="text-xs text-slate-500">
                    {formatCurrency(item.product_price)} × {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>

          {/* Resumen de totales */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-950">
              <span>Total a pagar</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700 border border-amber-200">
            El pedido quedará pendiente de pago hasta que confirmemos tu transferencia.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-full bg-amber-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
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
            <button onClick={downloadInvoice} className="w-full rounded-full bg-amber-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">Descargar Factura PDF</button>
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
        <h2 className="mb-2 text-2xl font-bold text-slate-950">Pago rechazado</h2>
        <p className="mb-6 text-sm text-slate-500">
          {errorMessage || 'El pago no pudo procesarse. Intenta de nuevo.'}
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
