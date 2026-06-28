import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Porcentaje'),
        ('FIXED', 'Monto fijo'),
        ('BOGO', '2x1'),
        ('FREE_SHIPPING', 'Envío gratis'),
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, default='')
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_purchase = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(default=0, help_text='0 = sin límite')
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    applicable_categories = models.JSONField(default=list, blank=True, help_text='Lista de categorías. Vacío = todas.')
    applicable_products = models.ManyToManyField('products.Product', blank=True, related_name='coupons')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()})"

    @property
    def is_valid(self):
        now = timezone.now()
        if not self.is_active:
            return False
        if now < self.valid_from:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        if self.max_uses > 0 and self.used_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, subtotal, cart_items=None):
        if not self.is_valid:
            return 0

        if self.min_purchase > 0 and subtotal < self.min_purchase:
            return 0

        if self.discount_type == 'PERCENTAGE':
            return subtotal * (self.discount_value / 100)

        if self.discount_type == 'FIXED':
            return min(self.discount_value, subtotal)

        if self.discount_type == 'BOGO' and cart_items:
            cheapest_price = None
            for item in cart_items:
                if cheapest_price is None or item.product.variant_price < cheapest_price:
                    cheapest_price = item.product.variant_price
            return cheapest_price or 0

        if self.discount_type == 'FREE_SHIPPING':
            return 0

        return 0


class CouponUsage(models.Model):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='coupon_usages')
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, related_name='coupon_usages')
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-used_at']

    def __str__(self):
        return f"{self.user} used {self.coupon.code}"
