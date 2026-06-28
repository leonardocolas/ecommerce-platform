from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order, OrderItem
from payments.models import Payment
from products.models import Product


User = get_user_model()


class PaymentFlowTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='cliente_pago',
            password='ClaveSegura123!',
            role='USER',
        )
        self.other_user = User.objects.create_user(
            username='intruso_pago',
            password='ClaveSegura123!',
            role='USER',
        )
        self.provider = User.objects.create_user(
            username='proveedor_pago',
            password='ClaveSegura123!',
            role='PROVIDER',
        )
        self.product = Product.objects.create(
            handle='monitor-de-prueba',
            title='Monitor',
            variant_price=Decimal('50.00'),
            variant_inventory_qty=5,
            provider=self.provider,
        )

    def create_order_with_reserved_stock(self):
        order = Order.objects.create(
            user=self.customer,
            status='CREATED',
            total=Decimal('100.00'),
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=self.product.price,
        )
        self.product.variant_inventory_qty -= 2
        self.product.save(update_fields=['variant_inventory_qty'])
        return order

    def test_create_payment_marks_order_as_awaiting_payment(self):
        order = self.create_order_with_reserved_stock()
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(f'/api/payments/create/{order.id}/', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        order.refresh_from_db()
        self.assertEqual(order.status, 'AWAITING_PAYMENT')
        self.assertTrue(Payment.objects.filter(order=order, status='INITIATED').exists())

        second_response = self.client.post(f'/api/payments/create/{order.id}/', format='json')
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_simulate_payment_requires_authentication(self):
        order = self.create_order_with_reserved_stock()
        payment = Payment.objects.create(order=order, status='INITIATED', amount=order.total)

        response = self.client.post(f'/api/payments/simulate/{payment.transaction_id}/', format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('payments.views.random.choice', return_value=True)
    def test_owner_can_process_payment_only_once(self, _mock_choice):
        order = self.create_order_with_reserved_stock()
        order.status = 'AWAITING_PAYMENT'
        order.save(update_fields=['status'])
        payment = Payment.objects.create(order=order, status='INITIATED', amount=order.total)
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(f'/api/payments/simulate/{payment.transaction_id}/', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(payment.status, 'SUCCESS')
        self.assertEqual(order.status, 'PAID')

        replay_response = self.client.post(f'/api/payments/simulate/{payment.transaction_id}/', format='json')
        self.assertEqual(replay_response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('payments.views.random.choice', return_value=False)
    def test_failed_payment_restores_reserved_stock(self, _mock_choice):
        order = self.create_order_with_reserved_stock()
        order.status = 'AWAITING_PAYMENT'
        order.save(update_fields=['status'])
        payment = Payment.objects.create(order=order, status='INITIATED', amount=order.total)
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(f'/api/payments/simulate/{payment.transaction_id}/', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        order.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(payment.status, 'FAILED')
        self.assertEqual(order.status, 'CANCELED')
        self.assertEqual(self.product.variant_inventory_qty, 5)

    def test_other_user_cannot_simulate_foreign_payment(self):
        order = self.create_order_with_reserved_stock()
        order.status = 'AWAITING_PAYMENT'
        order.save(update_fields=['status'])
        payment = Payment.objects.create(order=order, status='INITIATED', amount=order.total)
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(f'/api/payments/simulate/{payment.transaction_id}/', format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_order_cannot_have_multiple_payments_at_model_level(self):
        order = self.create_order_with_reserved_stock()
        Payment.objects.create(order=order, status='INITIATED', amount=order.total)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Payment.objects.create(order=order, status='INITIATED', amount=order.total)
