from django.contrib import admin
from .models import Coupon, CouponUsage


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'min_purchase', 'used_count', 'max_uses', 'is_active', 'valid_from', 'valid_to']
    list_filter = ['discount_type', 'is_active', 'valid_from', 'valid_to']
    search_fields = ['code', 'description']
    readonly_fields = ['used_count', 'created_at']
    filter_horizontal = ['applicable_products']


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ['coupon', 'user', 'order', 'used_at']
    list_filter = ['used_at']
    search_fields = ['coupon__code', 'user__username']
    readonly_fields = ['used_at']
