def handle_payment_webhook(payment):
    order = payment.order

    if payment.status == 'SUCCESS':
        order.status = 'PAID'
        order.save(update_fields=['status'])
        return

    if payment.status == 'FAILED':
        if order.status == 'AWAITING_PAYMENT':
            for item in order.items.select_related('product'):
                product = item.product
                product.variant_inventory_qty += item.quantity
                product.save(update_fields=['variant_inventory_qty'])

        order.status = 'CANCELED'
        order.save(update_fields=['status'])
        return

    order.save(update_fields=['status'])
