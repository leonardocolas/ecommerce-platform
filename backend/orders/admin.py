from django.contrib import admin
from .models import Order, OrderItem, OrderAudit


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price']


class OrderAuditInline(admin.TabularInline):
    model = OrderAudit
    extra = 0
    can_delete = False
    readonly_fields = ['actor', 'action', 'from_status', 'to_status', 'note', 'created_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'user', 'status', 'total', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'id']
    readonly_fields = ['user', 'total', 'created_at', 'invoice_number']
    inlines = [OrderItemInline, OrderAuditInline]
    list_editable = ['status']
