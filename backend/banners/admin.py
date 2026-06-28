from django.contrib import admin
from .models import Banner


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'position', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['title', 'subtitle', 'description']
    list_editable = ['position', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
