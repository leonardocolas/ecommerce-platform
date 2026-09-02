from decimal import Decimal
import csv

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from .models import Order, OrderAudit
from .serializers import (
    OrderSerializer, CreateOrderSerializer, OrderStatusUpdateSerializer,
    PaymentConfirmationSerializer,
)
from .permissions import IsOwnerOrAdmin, IsStaffOrAdmin
from .inventory import release_order_stock_once
from users.permissions import is_admin_user


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        qs = Order.objects.all() if is_admin_user(user) else Order.objects.filter(user=user)

        order_status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')

        if order_status:
            qs = qs.filter(status=order_status)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(items__product__title__icontains=search) |
                Q(id__icontains=search) |
                Q(user__username__icontains=search)
            ).distinct()

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        if self.action in ['update', 'partial_update']:
            return OrderStatusUpdateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy', 'refund', 'confirm_payment']:
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        order = serializer.save()
        if previous_status not in ['CANCELED', 'SHIPPED'] and order.status == 'CANCELED':
            release_order_stock_once(order, reason='ORDER_CANCELLATION', actor=self.request.user)
        if order.status == 'SHIPPED' and not order.shipped_at:
            order.shipped_at = timezone.now()
            order.save(update_fields=['shipped_at'])
        if previous_status != order.status or order.cancellation_reason:
            OrderAudit.objects.create(
                order=order, actor=self.request.user, action='ORDER_UPDATED',
                from_status=previous_status, to_status=order.status,
                note=order.cancellation_reason,
            )

    @action(detail=True, methods=['get'])
    def proforma(self, request, pk=None):
        order = self.get_object()
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{order.invoice_number}.pdf"'
        document = canvas.Canvas(response, pagesize=A4)
        document.setTitle(f'Factura proforma {order.invoice_number}')
        document.setFont('Helvetica-Bold', 18)
        left_margin = 50
        document.drawString(left_margin, 790, 'FACTURA PROFORMA')
        document.setFont('Helvetica', 10)
        lines = [
            f'Número: {order.invoice_number}',
            f'Fecha: {order.created_at:%d/%m/%Y}',
            f'Vence: {order.payment_due_at:%d/%m/%Y}' if order.payment_due_at else 'Vence: -',
            f'Cliente: {order.customer_name}',
            f'NIF/CIF: {order.tax_id}',
            f'Email: {order.customer_email}',
            f'Dirección: {order.shipping_address}',
        ]
        y = 755
        for line in lines:
            document.drawString(left_margin, y, line[:120])
            y -= 18
        y -= 10
        document.setFont('Helvetica-Bold', 11)
        document.drawString(left_margin, y, 'Concepto')
        document.drawString(420, y, 'Importe')
        document.setFont('Helvetica', 10)
        y -= 20
        for item in order.items.select_related('product'):
            document.drawString(left_margin, y, f'{item.product.title} x {item.quantity}'[:58])
            document.drawRightString(520, y, f'{item.price * item.quantity:.2f}')
            y -= 16
        y -= 10
        document.setFont('Helvetica-Bold', 12)
        document.drawRightString(520, y, f'TOTAL: {order.total:.2f}')
        y -= 35
        document.setFont('Helvetica', 10)
        document.drawString(left_margin, y, 'Transferencia bancaria')
        document.drawString(left_margin, y - 16, f'Titular: {settings.BANK_TRANSFER_DETAILS["holder"]}')
        document.drawString(left_margin, y - 32, f'Banco: {settings.BANK_TRANSFER_DETAILS["bank"]}')
        document.drawString(left_margin, y - 48, f'IBAN: {settings.BANK_TRANSFER_DETAILS["iban"]}')
        document.drawString(left_margin, y - 64, f'Concepto: {order.invoice_number}')
        document.save()
        return response

    @action(detail=True, methods=['post'])
    def confirm_payment(self, request, pk=None):
        serializer = PaymentConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=pk)
            if order.status != 'AWAITING_PAYMENT':
                return Response({'error': 'La orden no está pendiente de pago.'}, status=400)
            order.mark_payment_confirmed(request.user, serializer.validated_data.get('note', ''))
            from payments.models import Payment
            Payment.objects.update_or_create(
                order=order,
                defaults={
                    'status': 'MANUAL_CONFIRMED', 'amount': order.total,
                    'reviewed_by': request.user, 'reviewed_at': timezone.now(),
                },
            )
            OrderAudit.objects.create(
                order=order, actor=request.user, action='PAYMENT_CONFIRMED',
                from_status='AWAITING_PAYMENT', to_status='PAID',
                note=serializer.validated_data.get('note', ''),
            )
            transaction.on_commit(lambda: send_mail(
                f'Pago confirmado: {order.invoice_number}',
                f'Tu transferencia para el pedido {order.invoice_number} ha sido confirmada. Comenzaremos a preparar tu pedido.',
                settings.DEFAULT_FROM_EMAIL,
                [order.customer_email],
                fail_silently=True,
            ))
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="ordenes.csv"'
        writer = csv.writer(response)
        writer.writerow(['proforma', 'cliente', 'email', 'estado', 'subtotal', 'descuento', 'total', 'creada', 'transportista', 'tracking'])
        for order in self.filter_queryset(self.get_queryset()).select_related('user'):
            writer.writerow([
                order.invoice_number, order.customer_name, order.customer_email, order.status,
                order.subtotal, order.discount_amount, order.total, order.created_at.isoformat(),
                order.shipping_carrier, order.tracking_number,
            ])
        return response

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        order = Order.objects.select_for_update().get(pk=pk)

        if order.status not in ['PAID', 'PROCESSING']:
            return Response(
                {'error': 'Solo se pueden reembolsar ordenes pagadas o en proceso.'},
                status=400,
            )

        with transaction.atomic():
            previous_status = order.status
            release_order_stock_once(order, reason='ORDER_REFUND', actor=request.user)

            from payments.models import Payment
            Payment.objects.filter(order=order, status__in=['SUCCESS', 'MANUAL_CONFIRMED']).update(status='REFUNDED')

            order.status = 'CANCELED'
            order.save(update_fields=['status'])
            OrderAudit.objects.create(
                order=order, actor=request.user, action='ORDER_REFUNDED',
                from_status=previous_status, to_status='CANCELED',
                note='Reembolso procesado y stock restaurado.',
            )

        return Response({'status': 'CANCELED', 'message': 'Reembolso procesado. Stock restaurado.'})
