from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Coupon
from .serializers import (
    CouponSerializer, CouponValidateSerializer, CouponApplySerializer
)
from .services import validate_coupon, apply_coupon
from orders.models import Order


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'])
    def validate(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result, error = validate_coupon(
            code=serializer.validated_data['code'],
            subtotal=serializer.validated_data.get('subtotal', 0),
        )

        if error:
            return Response({'error': error}, status=400)
        return Response(result)

    @action(detail=False, methods=['post'])
    def apply(self, request):
        serializer = CouponApplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = Order.objects.get(
                id=serializer.validated_data['order_id'],
                user=request.user,
                status='CREATED',
            )
        except Order.DoesNotExist:
            return Response({'error': 'Orden no encontrada o no aplicable'}, status=404)

        result, error = apply_coupon(
            code=serializer.validated_data['code'],
            order=order,
        )

        if error:
            return Response({'error': error}, status=400)
        return Response(result)
