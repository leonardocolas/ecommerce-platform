from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order
from products.models import Product


User = get_user_model()


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

        response = self.client.post(
            '/api/orders/',
            {
                'items': [
                    {
                        'product': self.product.id,
                        'quantity': 2,
                    }
                ]
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        order = Order.objects.get()
        self.product.refresh_from_db()

        self.assertEqual(order.total, Decimal('200.00'))
        self.assertEqual(self.product.variant_inventory_qty, 3)

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
                ]
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
