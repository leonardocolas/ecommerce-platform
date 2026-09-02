from django.db import transaction

from products.models import InventoryMovement, Product, ProductVariant


def _locked_item(item):
    product = Product.objects.select_for_update().get(pk=item.product_id)
    variant = None
    if item.variant_id:
        variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
        if variant.product_id != product.id:
            raise ValueError('La variante no pertenece al producto.')
    return product, variant


def reserve_item(product, variant, quantity, *, order_reference, actor=None):
    stock = variant.inventory_qty if variant else product.variant_inventory_qty
    if stock < quantity:
        raise ValueError(f"Stock insuficiente para '{product.title}'. Disponible: {stock}.")

    if variant:
        variant.inventory_qty -= quantity
        variant.save(update_fields=['inventory_qty'])
    else:
        product.variant_inventory_qty -= quantity
        product.save(update_fields=['variant_inventory_qty'])

    InventoryMovement.objects.create(
        product=product,
        variant=variant,
        quantity=-quantity,
        reason='ORDER_RESERVATION',
        reference=order_reference,
        actor=actor,
    )


def release_order_stock(order, *, reason, actor=None):
    """Restore each order line once while holding row locks."""
    for item in order.items.select_related('product', 'variant').all():
        product, variant = _locked_item(item)
        if variant:
            variant.inventory_qty += item.quantity
            variant.save(update_fields=['inventory_qty'])
        else:
            product.variant_inventory_qty += item.quantity
            product.save(update_fields=['variant_inventory_qty'])
        InventoryMovement.objects.create(
            product=product,
            variant=variant,
            quantity=item.quantity,
            reason=reason,
            reference=order.invoice_number or str(order.pk),
            actor=actor,
        )


@transaction.atomic
def release_order_stock_once(order, *, reason, actor=None):
    if InventoryMovement.objects.filter(
        reference=order.invoice_number or str(order.pk),
        reason=reason,
    ).exists():
        return False
    release_order_stock(order, reason=reason, actor=actor)
    return True
