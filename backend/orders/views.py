from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Q

from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer
from .permissions import IsOwnerOrAdmin, IsStaffOrAdmin


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Order.objects.none()

        qs = Order.objects.all() if user.role in ['ADMIN', 'STAFF'] else Order.objects.filter(user=user)

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
                Q(id__icontains=search)
            ).distinct()

        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsStaffOrAdmin()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save()
