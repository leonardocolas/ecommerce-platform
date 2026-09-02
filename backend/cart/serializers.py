from rest_framework import serializers
from .models import Cart, CartItem
from products.models import Product, ProductVariant


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    variant_id = serializers.IntegerField(source='variant.id', read_only=True, allow_null=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_stock = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'variant_id', 'product_title', 'product_price', 'product_image', 'product_stock', 'quantity', 'subtotal']

    def get_product_price(self, obj):
        return obj.variant.price if obj.variant else obj.product.variant_price

    def get_product_stock(self, obj):
        return obj.variant.inventory_qty if obj.variant else obj.product.variant_inventory_qty

    def get_product_image(self, obj):
        return (obj.variant.image or obj.product.image_src) if obj.variant else obj.product.image_src

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        return value

    def validate(self, data):
        product = data.get('product')
        quantity = data.get('quantity', 1)
        if product and quantity > product.variant_inventory_qty:
            raise serializers.ValidationError(
                {"quantity": f"Stock insuficiente. Disponible: {product.variant_inventory_qty}."}
            )
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'items', 'total', 'item_count', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.none())
    variant_id = serializers.PrimaryKeyRelatedField(queryset=ProductVariant.objects.filter(is_active=True), required=False, allow_null=True)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['product_id'].queryset = Product.objects.filter(published=True)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        return value

    def validate(self, data):
        product = data['product_id']
        variant = data.get('variant_id')
        if variant and variant.product_id != product.id:
            raise serializers.ValidationError({'variant_id': 'La variante no pertenece a este producto.'})
        quantity = data['quantity']
        stock = variant.inventory_qty if variant else product.variant_inventory_qty

        # Considerar unidades que ya están en el carrito para este producto.
        # El carrito se pasa como contexto desde la view.
        cart = self.context.get('cart')
        already_in_cart = 0
        if cart is not None:
            try:
                existing_item = CartItem.objects.get(cart=cart, product=product, variant=variant)
                already_in_cart = existing_item.quantity
            except CartItem.DoesNotExist:
                pass

        if already_in_cart + quantity > stock:
            available = max(0, stock - already_in_cart)
            if available == 0:
                raise serializers.ValidationError(
                    {"quantity": f"Ya tienes el máximo disponible de '{product.title}' en el carrito."}
                )
            raise serializers.ValidationError(
                {"quantity": f"Stock insuficiente. Puedes agregar {available} unidad(es) más de '{product.title}'."}
            )
        return data


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        return value