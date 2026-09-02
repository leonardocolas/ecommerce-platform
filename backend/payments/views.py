import csv
import logging

from django.db import transaction
from django.utils import timezone
import random
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse

from orders.models import Order, OrderAudit

from .models import Payment
from .services import handle_payment_webhook
from users.permissions import is_admin_user

logger = logging.getLogger(__name__)


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

            if payment.order.user != request.user and not is_admin_user(request.user):
                return Response({"error": "No tienes permiso para simular este pago"}, status=403)

            if payment.status != 'INITIATED':
                return Response({"error": "El pago ya fue procesado"}, status=400)

            payment.status = 'SUCCESS' if random.choice([True, False]) else 'FAILED'
            payment.save(update_fields=['status'])
            logger.info('payment.transition', extra={
                'payment_id': str(payment.transaction_id), 'order_id': payment.order_id,
                'status': payment.status,
            })

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

            if order.status not in ['CREATED', 'AWAITING_PAYMENT']:
                return Response({"error": "La orden ya fue procesada"}, status=400)

            if Payment.objects.filter(order=order).exists():
                return Response({"error": "La orden ya tiene un pago asociado"}, status=400)

            payment = Payment.objects.create(
                order=order,
                status='INITIATED',
                amount=order.total,
            )

            if order.status == 'CREATED':
                order.status = 'AWAITING_PAYMENT'
                order.save(update_fields=['status'])

        return Response({
            "payment_id": payment.transaction_id,
            "message": "Pago iniciado",
            "next_step": f"/api/payments/simulate/{payment.transaction_id}/",
        })


class SubmitPaymentProofView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        proof_reference = str(request.data.get('proof_reference', '')).strip()
        proof_note = str(request.data.get('proof_note', '')).strip()
        if not proof_reference:
            return Response({'error': 'Indica la referencia de la transferencia.'}, status=400)
        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(id=order_id, user=request.user, status='AWAITING_PAYMENT')
            except Order.DoesNotExist:
                return Response({'error': 'Orden no encontrada o no pendiente de pago.'}, status=404)
            payment, created = Payment.objects.select_for_update().get_or_create(
                order=order,
                defaults={'status': 'PENDING_TRANSFER', 'amount': order.total},
            )
            if payment.status == 'PROOF_RECEIVED':
                return Response({'error': 'Ya existe un comprobante pendiente de revisión.'}, status=400)
            payment.status = 'PROOF_RECEIVED'
            payment.amount = order.total
            payment.proof_reference = proof_reference
            payment.proof_note = proof_note
            payment.save(update_fields=['status', 'amount', 'proof_reference', 'proof_note'])
        return Response({'status': payment.status, 'message': 'Comprobante registrado para revisión.'})


class ReviewPaymentProofView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if not is_admin_user(request.user):
            return Response({'error': 'No tienes permisos.'}, status=403)
        decision = str(request.data.get('decision', '')).upper()
        if decision not in {'APPROVE', 'REJECT'}:
            return Response({'error': 'decision debe ser APPROVE o REJECT.'}, status=400)
        with transaction.atomic():
            try:
                payment = Payment.objects.select_for_update().select_related('order').get(order_id=order_id)
            except Payment.DoesNotExist:
                return Response({'error': 'Comprobante no encontrado.'}, status=404)
            if payment.status != 'PROOF_RECEIVED':
                return Response({'error': 'El comprobante no está pendiente de revisión.'}, status=400)
            if decision == 'APPROVE':
                payment.status = 'MANUAL_CONFIRMED'
                payment.reviewed_by = request.user
                payment.reviewed_at = timezone.now()
                payment.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
                payment.order.mark_payment_confirmed(request.user, request.data.get('note', ''))
                OrderAudit.objects.create(
                    order=payment.order, actor=request.user, action='PAYMENT_PROOF_APPROVED',
                    from_status='AWAITING_PAYMENT', to_status='PAID',
                    note=request.data.get('note', ''),
                )
            else:
                payment.status = 'REJECTED'
                payment.reviewed_by = request.user
                payment.reviewed_at = timezone.now()
                payment.proof_note = request.data.get('note', payment.proof_note)
                payment.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'proof_note'])
                OrderAudit.objects.create(
                    order=payment.order, actor=request.user, action='PAYMENT_PROOF_REJECTED',
                    from_status=payment.order.status, to_status=payment.order.status,
                    note=payment.proof_note,
                )
        return Response({'status': payment.status})


class ExportPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin_user(request.user):
            return Response({'error': 'No tienes permisos.'}, status=403)
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="pagos.csv"'
        writer = csv.writer(response)
        writer.writerow(['transaccion', 'pedido', 'cliente', 'importe', 'estado', 'comprobante', 'revisado_por', 'creado'])
        for payment in Payment.objects.select_related('order__user', 'reviewed_by').order_by('-created_at'):
            writer.writerow([
                payment.transaction_id, payment.order.invoice_number, payment.order.user.username,
                payment.amount, payment.status, payment.proof_reference,
                payment.reviewed_by.username if payment.reviewed_by else '', payment.created_at.isoformat(),
            ])
        return response
