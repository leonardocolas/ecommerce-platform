from decimal import Decimal
from django.db import transaction
from .models import Coupon, CouponUsage


def validate_coupon(code, subtotal=Decimal('0.00'), cart_items=None):
    try:
        coupon = Coupon.objects.get(code__iexact=code)
    except Coupon.DoesNotExist:
        return None, "Cupón no encontrado."

    if not coupon.is_valid:
        return None, "Este cupón ya no es válido."

    if coupon.min_purchase > 0 and subtotal < coupon.min_purchase:
        return None, f"Monto mínimo requerido: ${coupon.min_purchase}."

    # [FIX-9] Enforce applicable_categories — matched against product_type
    if coupon.applicable_categories and cart_items:
        categories = [c.lower() for c in coupon.applicable_categories if c]
        item_types = [
            (item.product.product_type or '').lower()
            for item in cart_items
        ]
        if not any(t in categories for t in item_types if t):
            return None, "Este cupón no aplica a las categorías de los productos en tu carrito."

    # Enforce applicable_products (M2M)
    if coupon.applicable_products.exists() and cart_items:
        product_ids = [item.product_id for item in cart_items]
        applicable_ids = set(coupon.applicable_products.values_list('id', flat=True))
        if not set(product_ids) & applicable_ids:
            return None, "Este cupón no aplica a los productos en tu carrito."

    discount = coupon.calculate_discount(subtotal, cart_items)
    return {
        'coupon_id': coupon.id,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': str(coupon.discount_value),
        'discount_amount': str(discount),
        'description': coupon.description,
    }, None


@transaction.atomic
def apply_coupon(code, order):
    try:
        coupon = Coupon.objects.select_for_update().get(code__iexact=code)
    except Coupon.DoesNotExist:
        return None, "Cupón no encontrado."

    if not coupon.is_valid:
        return None, "Este cupón ya no es válido."

    # Verificar que no se haya aplicado ya un cupón a esta orden
    if CouponUsage.objects.filter(order=order).exists():
        return None, "Esta orden ya tiene un cupón aplicado."

    # [FIX-8] Per-user usage limit: one redemption per user per coupon
    if order.user and CouponUsage.objects.filter(coupon=coupon, user=order.user).exists():
        return None, "Ya utilizaste este cupón anteriormente."

    # [FIX-7] Fetch order items so BOGO can find the cheapest product
    order_items = list(order.items.select_related('product'))

    # [FIX-9] Enforce applicable_categories against order items
    if coupon.applicable_categories and order_items:
        categories = [c.lower() for c in coupon.applicable_categories if c]
        item_types = [
            (item.product.product_type or '').lower()
            for item in order_items
        ]
        if not any(t in categories for t in item_types if t):
            return None, "Este cupón no aplica a las categorías de los productos en esta orden."

    # [FIX-9] Enforce applicable_products (M2M) against order items
    if coupon.applicable_products.exists() and order_items:
        product_ids = {item.product_id for item in order_items}
        applicable_ids = set(coupon.applicable_products.values_list('id', flat=True))
        if not product_ids & applicable_ids:
            return None, "Este cupón no aplica a los productos en esta orden."

    # [FIX-7] Pass order_items so BOGO returns the correct cheapest-item discount
    discount = coupon.calculate_discount(order.total, order_items)
    new_total = max(Decimal('0.00'), order.total - discount)

    # Persistir el descuento en el total de la orden
    order.total = new_total
    order.save(update_fields=['total'])

    coupon.used_count += 1
    coupon.save(update_fields=['used_count'])

    CouponUsage.objects.create(
        coupon=coupon,
        user=order.user,
        order=order,
    )

    return {
        'coupon_id': coupon.id,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_amount': str(discount),
        'new_total': str(new_total),
    }, None
