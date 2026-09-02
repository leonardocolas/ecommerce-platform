from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Product(models.Model):
    # Información básica del producto
    handle = models.SlugField(max_length=255, unique=True)
    title = models.CharField(max_length=255)
    body_html = models.TextField(blank=True, null=True)
    vendor = models.CharField(max_length=255, blank=True, null=True)
    product_type = models.CharField(max_length=255, blank=True, null=True)
    tags = models.TextField(blank=True, null=True)
    published = models.BooleanField(default=True)
    
    # Opciones de producto (variantes)
    option1_name = models.CharField(max_length=100, blank=True, null=True)
    option1_value = models.CharField(max_length=100, blank=True, null=True)
    option2_name = models.CharField(max_length=100, blank=True, null=True)
    option2_value = models.CharField(max_length=100, blank=True, null=True)
    option3_name = models.CharField(max_length=100, blank=True, null=True)
    option3_value = models.CharField(max_length=100, blank=True, null=True)
    
    # Información de variante
    variant_sku = models.CharField(max_length=255, blank=True, null=True)
    variant_grams = models.IntegerField(blank=True, null=True)
    variant_inventory_tracker = models.CharField(max_length=50, blank=True, null=True)
    variant_inventory_qty = models.IntegerField(default=0)
    variant_inventory_policy = models.CharField(max_length=50, blank=True, null=True)
    variant_fulfillment_service = models.CharField(max_length=100, blank=True, null=True)
    variant_price = models.DecimalField(max_digits=10, decimal_places=2)
    variant_compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    variant_requires_shipping = models.BooleanField(default=True)
    variant_taxable = models.BooleanField(default=True)
    variant_barcode = models.CharField(max_length=255, blank=True, null=True)
    
    # Información de imagen
    image_src = models.URLField(blank=True, null=True)
    image_position = models.IntegerField(blank=True, null=True)
    image_alt_text = models.TextField(blank=True, null=True)
    
    # Información adicional
    gift_card = models.BooleanField(default=False)
    
    # SEO
    seo_title = models.CharField(max_length=255, blank=True, null=True)
    seo_description = models.TextField(blank=True, null=True)
    
    # Google Shopping
    google_shopping_product_category = models.CharField(max_length=255, blank=True, null=True)
    google_shopping_gender = models.CharField(max_length=50, blank=True, null=True)
    google_shopping_age_group = models.CharField(max_length=50, blank=True, null=True)
    google_shopping_mpn = models.CharField(max_length=255, blank=True, null=True)
    google_shopping_adwords_grouping = models.CharField(max_length=255, blank=True, null=True)
    google_shopping_adwords_labels = models.TextField(blank=True, null=True)
    google_shopping_condition = models.CharField(max_length=50, blank=True, null=True)
    google_shopping_custom_product = models.CharField(max_length=50, blank=True, null=True)
    google_shopping_custom_label_0 = models.CharField(max_length=255, blank=True, null=True)
    
    # Control de datos
    provider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['handle']),
            models.Index(fields=['vendor']),
            models.Index(fields=['product_type']),
        ]

    def __str__(self):
        return self.title


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    sku = models.CharField(max_length=255, unique=True)
    option1_name = models.CharField(max_length=100, blank=True, default='')
    option1_value = models.CharField(max_length=100, blank=True, default='')
    option2_name = models.CharField(max_length=100, blank=True, default='')
    option2_value = models.CharField(max_length=100, blank=True, default='')
    option3_name = models.CharField(max_length=100, blank=True, default='')
    option3_value = models.CharField(max_length=100, blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    inventory_qty = models.PositiveIntegerField(default=0)
    image = models.URLField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.product.title} - {self.sku}'


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True, default='')
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f'{self.product.title} image {self.position}'


class InventoryMovement(models.Model):
    product = models.ForeignKey(Product, related_name='inventory_movements', on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=80)
    reference = models.CharField(max_length=120, blank=True, default='')
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)