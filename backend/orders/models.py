from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product, ProductVariant
from coupons.models import Coupon

User = settings.AUTH_USER_MODEL


class Order(models.Model):
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('AWAITING_PAYMENT', 'Awaiting Payment'),
        ('PAID', 'Paid'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('CANCELED', 'Canceled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='CREATED')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    applied_coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    cancellation_reason = models.TextField(blank=True, default='')
    customer_name = models.CharField(max_length=150)
    tax_id = models.CharField(max_length=30)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100, blank=True, default='')
    shipping_state = models.CharField(max_length=100, blank=True, default='')
    shipping_postal_code = models.CharField(max_length=20, blank=True, default='')
    shipping_country = models.CharField(max_length=100, default='España')
    shipping_carrier = models.CharField(max_length=100, blank=True, default='')
    tracking_number = models.CharField(max_length=100, blank=True, default='')
    shipped_at = models.DateTimeField(null=True, blank=True)
    customer_email = models.EmailField()
    invoice_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    payment_due_at = models.DateTimeField(null=True, blank=True)
    payment_confirmed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='confirmed_orders',
    )
    payment_confirmed_at = models.DateTimeField(null=True, blank=True)
    payment_confirmation_note = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)

    def mark_payment_confirmed(self, admin_user, note=''):
        self.status = 'PAID'
        self.payment_confirmed_by = admin_user
        self.payment_confirmed_at = timezone.now()
        self.payment_confirmation_note = note
        self.save(update_fields=[
            'status', 'payment_confirmed_by', 'payment_confirmed_at',
            'payment_confirmation_note',
        ])

    def __str__(self):
        return f"Order {self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL)

    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    product_title_snapshot = models.CharField(max_length=255, default='')
    sku_snapshot = models.CharField(max_length=255, blank=True, default='')
    options_snapshot = models.JSONField(default=dict, blank=True)
    image_snapshot = models.URLField(blank=True, default='')

    def __str__(self):
        return f"{self.product} x {self.quantity}"


class OrderAudit(models.Model):
    order = models.ForeignKey(Order, related_name='audit_events', on_delete=models.CASCADE)
    actor = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=80)
    from_status = models.CharField(max_length=30, blank=True, default='')
    to_status = models.CharField(max_length=30, blank=True, default='')
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)