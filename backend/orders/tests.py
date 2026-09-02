from decimal import Decimal
from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order, OrderAudit
from products.models import Product, ProductVariant


User = get_user_model()


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class OrderFlowTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='cliente',
            password='ClaveSegura123!',
            role='USER',
        )
        self.provider = User.objects.create_user(
            username='proveedor',
            password='ClaveSegura123!',
            role='PROVIDER',
        )
        self.product = Product.objects.create(
            handle='laptop-de-prueba',
            title='Laptop',
            variant_price=Decimal('100.00'),
            variant_inventory_qty=5,
            provider=self.provider,
        )

    def test_create_order_reserves_stock(self):
        self.client.force_authenticate(user=self.customer)

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                '/api/orders/',
                {
                    'items': [
                        {
                            'product': self.product.id,
                            'quantity': 2,
                        }
                    ],
                    'customer_name': 'Cliente de prueba',
                    'tax_id': 'B12345678',
                    'shipping_address': 'Calle de prueba 1',
                    'customer_email': 'cliente@example.com',
                },
                format='json',
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get()
        self.product.refresh_from_db()

        self.assertEqual(order.total, Decimal('200.00'))
        self.assertEqual(order.status, 'AWAITING_PAYMENT')
        self.assertEqual(order.invoice_number, f'PROV-{order.created_at.year}{order.id:04d}')
        self.assertEqual(self.product.variant_inventory_qty, 3)
        self.assertIsNotNone(order.payment_due_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(order.invoice_number, mail.outbox[0].body)

    def test_customer_can_download_server_proforma(self):
        self.client.force_authenticate(user=self.customer)
        order = Order.objects.create(
            user=self.customer,
            status='AWAITING_PAYMENT',
            total=Decimal('100.00'),
            subtotal=Decimal('100.00'),
            customer_name='Cliente de prueba',
            tax_id='B12345678',
            shipping_address='Calle de prueba 1',
            customer_email='cliente@example.com',
            invoice_number='PROV-20260001',
            payment_due_at=timezone.now() + timedelta(days=3),
        )
        response = self.client.get(f'/api/orders/{order.id}/proforma/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.content.startswith(b'%PDF'))

    def test_admin_can_confirm_manual_payment(self):
        admin = User.objects.create_user(
            username='admin', password='ClaveSegura123!', role='ADMIN', is_staff=True,
        )
        order = Order.objects.create(
            user=self.customer,
            status='AWAITING_PAYMENT',
            total=Decimal('100.00'),
            customer_name='Cliente de prueba',
            tax_id='B12345678',
            shipping_address='Calle de prueba 1',
            customer_email='cliente@example.com',
            invoice_number='PROV-20260002',
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(
            f'/api/orders/{order.id}/confirm_payment/',
            {'note': 'Transferencia verificada'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'PAID')
        self.assertEqual(order.payment_confirmed_by, admin)
        self.assertEqual(order.payment_confirmation_note, 'Transferencia verificada')
        self.assertIsNotNone(order.payment_confirmed_at)

    def test_create_order_rejects_insufficient_stock(self):
        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            '/api/orders/',
            {
                'items': [
                    {
                        'product': self.product.id,
                        'quantity': 10,
                    }
                ],
                'customer_name': 'Cliente de prueba',
                'tax_id': 'B12345678',
                'shipping_address': 'Calle de prueba 1',
                'customer_email': 'cliente@example.com',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

        self.product.refresh_from_db()
        self.assertEqual(self.product.variant_inventory_qty, 5)

    def test_anonymous_update_is_rejected_without_server_error(self):
        order = Order.objects.create(user=self.customer, total=Decimal('0.00'))

        response = self.client.patch(
            f'/api/orders/{order.id}/',
            {'status': 'SHIPPED'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_cannot_mark_awaiting_order_as_paid(self):
        admin = User.objects.create_user(
            username='admin_estado', password='ClaveSegura123!', role='ADMIN', is_staff=True,
        )
        order = Order.objects.create(
            user=self.customer, status='AWAITING_PAYMENT', total=Decimal('10.00'),
            customer_name='Cliente', tax_id='B123', shipping_address='Calle 1',
            customer_email='cliente@example.com', invoice_number='PROV-20260003',
        )
        self.client.force_authenticate(user=admin)

        response = self.client.patch(f'/api/orders/{order.id}/', {'status': 'PAID'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        order.refresh_from_db()
        self.assertEqual(order.status, 'AWAITING_PAYMENT')

    def test_variant_reservation_only_decrements_variant_stock(self):
        variant = ProductVariant.objects.create(
            product=self.product, sku='LAPTOP-BLACK', price=Decimal('110.00'), inventory_qty=4,
        )
        self.client.force_authenticate(user=self.customer)

        response = self.client.post('/api/orders/', {
            'items': [{'product': self.product.id, 'variant': variant.id, 'quantity': 2}],
            'customer_name': 'Cliente', 'tax_id': 'B123', 'shipping_address': 'Calle 1',
            'customer_email': 'cliente@example.com',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        variant.refresh_from_db()
        self.product.refresh_from_db()
        self.assertEqual(variant.inventory_qty, 2)
        self.assertEqual(self.product.variant_inventory_qty, 5)
        item = Order.objects.get().items.get()
        self.assertEqual(item.product_title_snapshot, 'Laptop')
        self.assertEqual(item.sku_snapshot, 'LAPTOP-BLACK')
        self.assertTrue(OrderAudit.objects.filter(order=item.order).exists() is False)
