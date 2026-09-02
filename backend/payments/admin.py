from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'order', 'status', 'amount', 'proof_reference', 'reviewed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['transaction_id', 'order__id', 'order__user__username']
    readonly_fields = ['transaction_id', 'order', 'status', 'amount', 'created_at', 'reviewed_at']
