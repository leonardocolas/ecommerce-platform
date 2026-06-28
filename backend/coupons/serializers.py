from rest_framework import serializers
from .models import Coupon, CouponUsage


class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_purchase', 'max_uses', 'used_count', 'valid_from', 'valid_to',
            'is_active', 'is_valid', 'applicable_categories', 'created_at',
        ]
        read_only_fields = ['used_count', 'created_at']


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code__iexact=value)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Cupón no encontrado.")
        if not coupon.is_valid:
            raise serializers.ValidationError("Este cupón ya no es válido.")
        return value


class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    order_id = serializers.IntegerField()
