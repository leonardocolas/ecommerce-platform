import random

from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order

from .models import Payment
from .services import handle_payment_webhook


class SimulatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, transaction_id):
        with transaction.atomic():
            try:
                payment = (
                    Payment.objects
                    .select_for_update()
                    .select_related('order__user')
                    .get(transaction_id=transaction_id)
                )
            except Payment.DoesNotExist:
                return Response({"error": "Pago no encontrado"}, status=404)

            if payment.order.user != request.user and request.user.role not in ['ADMIN', 'STAFF']:
                return Response({"error": "No tienes permiso para simular este pago"}, status=403)

            if payment.status != 'INITIATED':
                return Response({"error": "El pago ya fue procesado"}, status=400)

            payment.status = 'SUCCESS' if random.choice([True, False]) else 'FAILED'
            payment.save(update_fields=['status'])

            handle_payment_webhook(payment)

        return Response({
            "status": payment.status
        })


class CreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(id=order_id, user=request.user)
            except Order.DoesNotExist:
                return Response({"error": "Orden no encontrada"}, status=404)

            if order.status != 'CREATED':
                return Response({"error": "La orden ya fue procesada"}, status=400)

            if Payment.objects.filter(order=order).exists():
                return Response({"error": "La orden ya tiene un pago asociado"}, status=400)

            payment = Payment.objects.create(
                order=order,
                status='INITIATED',
                amount=order.total,
            )

            order.status = 'AWAITING_PAYMENT'
            order.save(update_fields=['status'])

        return Response({
            "payment_id": payment.transaction_id,
            "message": "Pago iniciado",
            "next_step": f"/api/payments/simulate/{payment.transaction_id}/",
        })
