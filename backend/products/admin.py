from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'handle', 'vendor', 'variant_price', 'variant_inventory_qty', 'published', 'updated_at')
    list_filter = ('published', 'vendor', 'product_type', 'updated_at')
    search_fields = ('handle', 'title', 'vendor', 'variant_sku')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('handle', 'title', 'body_html', 'vendor', 'product_type', 'tags', 'published')
        }),
        ('Opciones de Producto', {
            'fields': (
                'option1_name', 'option1_value',
                'option2_name', 'option2_value',
                'option3_name', 'option3_value'
            ),
            'classes': ('collapse',)
        }),
        ('Variante', {
            'fields': (
                'variant_sku', 'variant_price', 'variant_compare_at_price',
                'variant_grams', 'variant_inventory_qty', 'variant_inventory_tracker',
                'variant_inventory_policy', 'variant_fulfillment_service',
                'variant_requires_shipping', 'variant_taxable', 'variant_barcode'
            )
        }),
        ('Imágenes', {
            'fields': ('image_src', 'image_position', 'image_alt_text'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('seo_title', 'seo_description'),
            'classes': ('collapse',)
        }),
        ('Google Shopping', {
            'fields': (
                'google_shopping_product_category', 'google_shopping_gender',
                'google_shopping_age_group', 'google_shopping_mpn',
                'google_shopping_adwords_grouping', 'google_shopping_adwords_labels',
                'google_shopping_condition', 'google_shopping_custom_product',
                'google_shopping_custom_label_0'
            ),
            'classes': ('collapse',)
        }),
        ('Otros', {
            'fields': ('gift_card', 'provider', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es creación
            obj.provider = request.user
        super().save_model(request, obj, form, change)
