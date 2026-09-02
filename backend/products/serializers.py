from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'option1_name', 'option1_value', 'option2_name',
            'option2_value', 'option3_name', 'option3_value', 'price',
            'inventory_qty', 'image', 'is_active',
        ]
        read_only_fields = ['inventory_qty']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'position']


class ProductSerializer(serializers.ModelSerializer):
    provider = serializers.StringRelatedField(read_only=True)
    variants = ProductVariantSerializer(many=True, required=False)
    images = ProductImageSerializer(many=True, required=False)

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
            # Imágenes y variantes normalizadas
            'image_src', 'image_position', 'image_alt_text', 'images', 'variants',
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
        read_only_fields = [
            'id', 'provider', 'created_at', 'updated_at',
            'variant_inventory_qty',
        ]

    def create(self, validated_data):
        variants = validated_data.pop('variants', [])
        images = validated_data.pop('images', [])
        product = super().create(validated_data)
        ProductVariant.objects.bulk_create([
            ProductVariant(product=product, **variant) for variant in variants
        ])
        ProductImage.objects.bulk_create([
            ProductImage(product=product, **image) for image in images
        ])
        return product

    def update(self, instance, validated_data):
        variants = validated_data.pop('variants', None)
        images = validated_data.pop('images', None)
        product = super().update(instance, validated_data)
        if variants is not None:
            instance.variants.all().delete()
            ProductVariant.objects.bulk_create([
                ProductVariant(product=product, **variant) for variant in variants
            ])
        if images is not None:
            instance.images.all().delete()
            ProductImage.objects.bulk_create([
                ProductImage(product=product, **image) for image in images
            ])
        return product