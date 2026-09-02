from django.db import models
from orders.models import Order
import uuid


class Payment(models.Model):
    STATUS_CHOICES = [
        ('INITIATED', 'Initiated'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('PENDING_TRANSFER', 'Pending transfer'),
        ('PROOF_RECEIVED', 'Proof received'),
        ('MANUAL_CONFIRMED', 'Manual confirmed'),
        ('REJECTED', 'Rejected'),
        ('REFUNDED', 'Refunded'),
    ]

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    proof_reference = models.CharField(max_length=255, blank=True, default='')
    proof_note = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey('users.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_payments')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.transaction_id}"
