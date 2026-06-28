from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    provider = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            # Información básica
            'handle', 'title', 'body_html', 'vendor', 'product_type', 'tags', 'published',
            # Opciones
            'option1_name', 'option1_value',
            'option2_name', 'option2_value',
            'option3_name', 'option3_value',
            # Variante
            'variant_sku', 'variant_grams', 'variant_inventory_tracker',
            'variant_inventory_qty', 'variant_inventory_policy', 'variant_fulfillment_service',
            'variant_price', 'variant_compare_at_price',
            'variant_requires_shipping', 'variant_taxable', 'variant_barcode',
            # Imágenes
            'image_src', 'image_position', 'image_alt_text',
            # Otros
            'gift_card',
            # SEO
            'seo_title', 'seo_description',
            # Google Shopping
            'google_shopping_product_category', 'google_shopping_gender', 'google_shopping_age_group',
            'google_shopping_mpn', 'google_shopping_adwords_grouping', 'google_shopping_adwords_labels',
            'google_shopping_condition', 'google_shopping_custom_product', 'google_shopping_custom_label_0',
            # Control
            'provider', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'provider', 'created_at', 'updated_at']