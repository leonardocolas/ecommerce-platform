import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import CheckoutModal from './CheckoutModal'
import { useCartStore } from '../cart/services/cartService'
import { apiFetch } from '../../lib/apiFetch'
import * as orderService from '../orders/services/orderService'

vi.mock('../../lib/apiFetch', () => ({ apiFetch: vi.fn() }))
vi.mock('../orders/services/orderService', () => ({
  createOrder: vi.fn(),
}))

describe('CheckoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useCartStore.setState({
      items: [
        {
          id: 1,
          product_id: 11,
          product_title: 'Teclado mecánico',
          product_price: 120,
          product_image: '',
          product_stock: 5,
          quantity: 1,
          subtotal: 120,
          variant_id: null,
        },
      ],
      total: 120,
      itemCount: 1,
      loading: false,
      couponCode: 'SAVE10',
      discountAmount: 10,
      addingProductIds: new Set(),
      recentlyAddedIds: new Set(),
      updatingProductIds: new Set(),
      fetchCart: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      changeProductQuantity: vi.fn(),
      clearCart: vi.fn().mockResolvedValue(undefined),
      mergeCart: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      getCartItem: vi.fn(),
    })
  })

  it('validates required shipping data before creating the order', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ first_name: 'Ana', last_name: 'Pérez', email: 'ana@test.com' })
      .mockResolvedValueOnce([
        {
          id: 7,
          label: 'Casa',
          address: 'Calle Mayor 22',
          city: 'Madrid',
          state: '',
          postal_code: '28001',
          country: 'España',
          is_default: true,
        },
      ])

    render(
      <MemoryRouter>
        <CheckoutModal onClose={vi.fn()} />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    const button = await screen.findByRole('button', { name: /generar pedido/i })
    await user.click(button)

    expect(await screen.findByText(/estado o provincia es obligatorio/i)).toBeInTheDocument()
    expect(orderService.createOrder).not.toHaveBeenCalled()
  })

  it('submits the order with the selected address and coupon', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ first_name: 'Ana', last_name: 'Pérez', email: 'ana@test.com' })
      .mockResolvedValueOnce([
        {
          id: 7,
          label: 'Casa',
          address: 'Calle Mayor 22',
          city: 'Madrid',
          state: 'Madrid',
          postal_code: '28001',
          country: 'España',
          is_default: true,
        },
      ])

    vi.mocked(orderService.createOrder).mockResolvedValue({
      id: 404,
      user: 1,
      status: 'AWAITING_PAYMENT',
      subtotal: 120,
      discount_amount: 10,
      total: 110,
      items: [],
      created_at: new Date().toISOString(),
      customer_name: 'Ana Pérez',
      shipping_address: 'Calle Mayor 22',
      customer_email: 'ana@test.com',
      invoice_number: 'PROV-20260004',
      payment_due_at: new Date().toISOString(),
      bank_transfer_details: { holder: 'Tienda Demo S.L.', bank: 'Banco Demo', iban: 'ESXX XXXX' },
      shipping_city: 'Madrid',
      shipping_state: 'Madrid',
      shipping_postal_code: '28001',
      shipping_country: 'España',
      shipping_carrier: '',
      tracking_number: '',
    })

    render(
      <MemoryRouter>
        <CheckoutModal onClose={vi.fn()} />
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    const button = await screen.findByRole('button', { name: /generar pedido/i })
    await user.click(button)

    await waitFor(() => {
      expect(orderService.createOrder).toHaveBeenCalledWith(
        [{ product: 11, quantity: 1, variant: null }],
        {
          shipping_address: 'Calle Mayor 22',
          shipping_city: 'Madrid',
          shipping_state: 'Madrid',
          shipping_postal_code: '28001',
          shipping_country: 'España',
        },
        'SAVE10',
      )
    })
  })
})
