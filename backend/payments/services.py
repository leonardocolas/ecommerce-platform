from django.db import transaction

from orders.inventory import release_order_stock_once
from orders.models import OrderAudit


@transaction.atomic
def handle_payment_webhook(payment):
    order = payment.order

    if payment.status == 'SUCCESS':
        if order.status == 'AWAITING_PAYMENT':
            order.status = 'PAID'
            order.save(update_fields=['status'])
            OrderAudit.objects.create(
                order=order, actor=None, action='PAYMENT_SUCCEEDED',
                from_status='AWAITING_PAYMENT', to_status='PAID',
            )
        return

    if payment.status == 'FAILED':
        if order.status == 'AWAITING_PAYMENT':
            release_order_stock_once(order, reason='PAYMENT_FAILURE')

            order.status = 'CANCELED'
            order.save(update_fields=['status'])
            OrderAudit.objects.create(
                order=order, actor=None, action='PAYMENT_FAILED',
                from_status='AWAITING_PAYMENT', to_status='CANCELED',
            )
        return

    order.save(update_fields=['status'])
