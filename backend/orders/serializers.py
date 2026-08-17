from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from products.models import Product

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.URLField(source='product.image_src', read_only=True, default=None)

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price', 'product_title', 'product_image']
        read_only_fields = ['price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'total', 'items', 'created_at']
        read_only_fields = ['user', 'status', 'total']


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Used exclusively by STAFF/ADMIN to change an order's status."""

    VALID_STATUSES = [s[0] for s in Order.STATUS_CHOICES]

    class Meta:
        model = Order
        fields = ['status']

    def validate_status(self, value):
        if value not in self.VALID_STATUSES:
            raise serializers.ValidationError(
                f"Estado inválido. Opciones válidas: {', '.join(self.VALID_STATUSES)}."
            )
        return value


class CreateOrderSerializer(serializers.Serializer):
    items = OrderItemSerializer(many=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La orden debe contener al menos un producto.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        total = Decimal('0.00')

        with transaction.atomic():
            order = Order.objects.create(user=user, status='CREATED')

            for item in items_data:
                product = Product.objects.select_for_update().get(id=item['product'].id)
                quantity = item['quantity']

                if product.variant_inventory_qty < quantity:
                    raise serializers.ValidationError(
                        {
                            'items': [
                                f"Stock insuficiente para '{product.title}'. Disponible: {product.variant_inventory_qty}."
                            ]
                        }
                    )

                price = product.variant_price

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=price,
                )

                product.variant_inventory_qty -= quantity
                product.save(update_fields=['variant_inventory_qty'])
                total += price * quantity

            order.total = total
            order.save(update_fields=['total'])

        return order
