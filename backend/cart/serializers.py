from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=None, source='product', write_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_price = serializers.DecimalField(source='product.variant_price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.URLField(source='product.image_src', read_only=True, default=None)
    product_stock = serializers.IntegerField(source='product.variant_inventory_qty', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product_id', 'product_title', 'product_price', 'product_image', 'product_stock', 'quantity', 'subtotal']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from products.models import Product
        self.fields['product_id'].queryset = Product.objects.filter(published=True)

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
    product_id = serializers.PrimaryKeyRelatedField(queryset=None)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from products.models import Product
        self.fields['product_id'].queryset = Product.objects.filter(published=True)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        return value

    def validate(self, data):
        product = data['product_id']
        quantity = data['quantity']
        if quantity > product.variant_inventory_qty:
            raise serializers.ValidationError(
                {"quantity": f"Stock insuficiente. Disponible: {product.variant_inventory_qty}."}
            )
        return data


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1.")
        return value
