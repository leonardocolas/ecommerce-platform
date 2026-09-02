from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers

from products.models import Product, ProductVariant
from .inventory import reserve_item
from coupons.models import Coupon

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    quantity = serializers.IntegerField(min_value=1)
    variant = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.filter(is_active=True), required=False, allow_null=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_image = serializers.URLField(source='product.image_src', read_only=True, default=None)

    class Meta:
        model = OrderItem
        fields = [
            'product', 'variant', 'quantity', 'price', 'product_title', 'product_image',
            'product_title_snapshot', 'sku_snapshot', 'options_snapshot', 'image_snapshot',
        ]
        read_only_fields = [
            'price', 'product_title_snapshot', 'sku_snapshot',
            'options_snapshot', 'image_snapshot',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    bank_transfer_details = serializers.SerializerMethodField()

    def get_bank_transfer_details(self, obj):
        return settings.BANK_TRANSFER_DETAILS

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'subtotal', 'discount_amount', 'total', 'items', 'created_at',
            'applied_coupon', 'cancellation_reason',
            'customer_name', 'tax_id', 'shipping_address', 'customer_email',
            'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country',
            'shipping_carrier', 'tracking_number', 'shipped_at', 'invoice_number',
            'payment_due_at', 'payment_confirmed_by', 'payment_confirmed_at',
            'payment_confirmation_note', 'bank_transfer_details',
        ]
        read_only_fields = [
            'user', 'status', 'subtotal', 'discount_amount', 'total', 'invoice_number',
            'payment_due_at', 'payment_confirmed_by', 'payment_confirmed_at',
        ]


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    """Used exclusively by STAFF/ADMIN to change an order's status."""

    VALID_STATUSES = [s[0] for s in Order.STATUS_CHOICES]

    class Meta:
        model = Order
        fields = ['status', 'shipping_carrier', 'tracking_number', 'cancellation_reason']

    def validate_status(self, value):
        if value not in self.VALID_STATUSES:
            raise serializers.ValidationError(
                f"Estado inválido. Opciones válidas: {', '.join(self.VALID_STATUSES)}."
            )
        return value

    def validate(self, attrs):
        current = self.instance.status
        target = attrs.get('status', current)
        allowed = {
            'CREATED': {'AWAITING_PAYMENT', 'CANCELED'},
            'AWAITING_PAYMENT': {'PAID', 'CANCELED'},
            'PAID': {'PROCESSING', 'CANCELED'},
            'PROCESSING': {'SHIPPED', 'CANCELED'},
            'SHIPPED': set(), 'CANCELED': set(),
        }
        if target != current and target not in allowed.get(current, set()):
            raise serializers.ValidationError({'status': f'No se puede pasar de {current} a {target}.'})
        if target == 'PAID' and target != current:
            raise serializers.ValidationError({'status': 'El pago solo puede confirmarse mediante el flujo de pago.'})
        if target == 'CANCELED' and not attrs.get('cancellation_reason', '').strip() and not self.instance.cancellation_reason:
            raise serializers.ValidationError({'cancellation_reason': 'Indica el motivo de cancelación.'})
        return attrs


class CreateOrderSerializer(serializers.Serializer):
    items = OrderItemSerializer(many=True)
    customer_name = serializers.CharField(max_length=150)
    tax_id = serializers.CharField(max_length=30)
    shipping_address = serializers.CharField()
    customer_email = serializers.EmailField()
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_country = serializers.CharField(max_length=100, required=False)
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True, write_only=True)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("La orden debe contener al menos un producto.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        subtotal = Decimal('0.00')
        coupon = None
        coupon_code = validated_data.pop('coupon_code', '').strip()
        if coupon_code:
            coupon = Coupon.objects.filter(code__iexact=coupon_code, is_active=True).first()
            if not coupon or not coupon.is_valid:
                raise serializers.ValidationError({'coupon_code': 'El cupón no es válido.'})
        payment_due_at = timezone.now() + timedelta(days=3)

        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                status='AWAITING_PAYMENT',
                invoice_number='TEMP',
                payment_due_at=payment_due_at,
                **validated_data,
            )
            order.invoice_number = f'PROV-{order.created_at.year}{order.id:04d}'
            order.save(update_fields=['invoice_number'])

            for item in items_data:
                product = Product.objects.get(id=item['product'].id)
                variant = item.get('variant')
                if variant and variant.product_id != product.id:
                    raise serializers.ValidationError({'items': ['La variante no pertenece al producto.']})
                quantity = item['quantity']

                price = variant.price if variant else product.variant_price

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant=variant,
                    quantity=quantity,
                    price=price,
                    product_title_snapshot=product.title,
                    sku_snapshot=(variant.sku if variant else product.variant_sku) or '',
                    options_snapshot={
                        'option1': (variant.option1_value if variant else product.option1_value) or '',
                        'option2': (variant.option2_value if variant else product.option2_value) or '',
                        'option3': (variant.option3_value if variant else product.option3_value) or '',
                    },
                    image_snapshot=(variant.image if variant else product.image_src) or '',
                )

                try:
                    reserve_item(
                        product, variant, quantity,
                        order_reference=order.invoice_number, actor=user,
                    )
                except ValueError as exc:
                    raise serializers.ValidationError({'items': [str(exc)]}) from exc
                subtotal += price * quantity

            order.subtotal = subtotal
            discount = min(coupon.calculate_discount(subtotal), subtotal) if coupon else Decimal('0.00')
            order.applied_coupon = coupon
            order.discount_amount = discount
            order.total = subtotal - discount
            order.save(update_fields=['subtotal', 'discount_amount', 'total', 'applied_coupon'])
            if coupon:
                from coupons.models import CouponUsage
                locked_coupon = Coupon.objects.select_for_update().get(pk=coupon.pk)
                if not locked_coupon.is_valid:
                    raise serializers.ValidationError({'coupon_code': 'El cupón ya no es válido.'})
                if CouponUsage.objects.filter(coupon=locked_coupon, user=user).exists():
                    raise serializers.ValidationError({'coupon_code': 'Ya utilizaste este cupón anteriormente.'})
                locked_coupon.used_count += 1
                locked_coupon.save(update_fields=['used_count'])
                CouponUsage.objects.create(coupon=locked_coupon, user=user, order=order)

            transaction.on_commit(lambda: send_mail(
                f'Pedido {order.invoice_number} recibido',
                (
                    f'Hola {order.customer_name},\n\n'
                    f'Hemos recibido tu pedido {order.invoice_number}.\n'
                    f'Total a transferir: {order.total}\n'
                    f'Fecha límite de pago: {order.payment_due_at:%d/%m/%Y}\n\n'
                    f'Titular: {settings.BANK_TRANSFER_DETAILS["holder"]}\n'
                    f'Banco: {settings.BANK_TRANSFER_DETAILS["bank"]}\n'
                    f'IBAN: {settings.BANK_TRANSFER_DETAILS["iban"]}\n\n'
                    'Envía el comprobante por email indicando el número de factura.'
                ),
                settings.DEFAULT_FROM_EMAIL,
                [order.customer_email],
                fail_silently=True,
            ))

        return order


class PaymentConfirmationSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, max_length=2000)
