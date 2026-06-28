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

    discount = coupon.calculate_discount(order.total)

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
        'new_total': str(order.total - discount),
    }, None
