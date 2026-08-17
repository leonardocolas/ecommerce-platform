import { apiFetch } from '../../lib/apiFetch'

export interface CreatePaymentResponse {
  payment_id: string
  message: string
  next_step: string
}

export interface SimulatePaymentResponse {
  status: 'SUCCESS' | 'FAILED'
}

export interface ApplyCouponResponse {
  coupon_id: number
  code: string
  discount_type: string
  discount_amount: string
  new_total: string
}

export async function createPayment(orderId: number): Promise<CreatePaymentResponse> {
  return apiFetch(`/payments/create/${orderId}/`, { method: 'POST' }) as Promise<CreatePaymentResponse>
}

export async function simulatePayment(transactionId: string): Promise<SimulatePaymentResponse> {
  return apiFetch(`/payments/simulate/${transactionId}/`, { method: 'POST' }) as Promise<SimulatePaymentResponse>
}

export async function applyCouponToOrder(
  code: string,
  orderId: number,
): Promise<ApplyCouponResponse> {
  return apiFetch('/coupons/apply/', {
    method: 'POST',
    body: JSON.stringify({ code, order_id: orderId }),
  }) as Promise<ApplyCouponResponse>
}
