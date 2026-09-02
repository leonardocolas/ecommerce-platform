from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from .models import Cart, CartItem
from .serializers import (
    CartSerializer, CartItemSerializer,
    AddToCartSerializer, UpdateCartItemSerializer,
)
from .permissions import CartPermission


class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [CartPermission]

    def _get_or_create_cart(self, request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        else:
            session_key = request.headers.get('X-Session-Key') or request.query_params.get('session_key')
            if not session_key:
                return None
            cart, _ = Cart.objects.get_or_create(session_key=session_key)
        return cart

    @action(detail=False, methods=['get'])
    def current(self, request):
        cart = self._get_or_create_cart(request)
        if not cart:
            return Response({'items': [], 'total': '0.00', 'item_count': 0})
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='items/add')
    def add_item(self, request):
        cart = self._get_or_create_cart(request)
        if not cart:
            return Response({'error': 'Se requiere session_key para usuarios anónimos'}, status=400)

        serializer = AddToCartSerializer(data=request.data, context={'cart': cart})
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product_id']
        variant = serializer.validated_data.get('variant_id')
        quantity = serializer.validated_data['quantity']

        with transaction.atomic():
            item, created = CartItem.objects.get_or_create(
                cart=cart, product=product, variant=variant,
                defaults={'quantity': quantity}
            )
            if not created:
                new_qty = item.quantity + quantity
                stock = variant.inventory_qty if variant else product.variant_inventory_qty
                if new_qty > stock:
                    return Response(
                        {'error': f"Stock insuficiente. Disponible: {product.variant_inventory_qty}."},
                        status=400
                    )
                item.quantity = new_qty
                item.save(update_fields=['quantity'])

        return Response(CartItemSerializer(item).data, status=201)

    @action(detail=False, methods=['patch', 'delete'], url_path='items/(?P<item_id>[0-9]+)')
    def item_detail(self, request, item_id=None):
        """PATCH para actualizar cantidad, DELETE para eliminar el item."""
        cart = self._get_or_create_cart(request)
        if not cart:
            return Response({'error': 'Carrito no encontrado'}, status=404)

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item no encontrado'}, status=404)

        if request.method == 'DELETE':
            item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # PATCH
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity = serializer.validated_data['quantity']
        stock = item.variant.inventory_qty if item.variant else item.product.variant_inventory_qty
        if quantity > stock:
            return Response(
                {'error': f"Stock insuficiente. Disponible: {item.product.variant_inventory_qty}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save(update_fields=['quantity'])
        return Response(CartItemSerializer(item).data)

    @action(detail=False, methods=['post'])
    def merge(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Autenticación requerida'}, status=401)

        session_key = request.headers.get('X-Session-Key')
        if not session_key:
            return Response({'error': 'X-Session-Key header requerido'}, status=400)

        user_cart, _ = Cart.objects.get_or_create(user=request.user)
        try:
            anon_cart = Cart.objects.get(session_key=session_key)
        except Cart.DoesNotExist:
            return Response(CartSerializer(user_cart).data)

        with transaction.atomic():
            for anon_item in anon_cart.items.select_related('product', 'variant'):
                user_item, created = CartItem.objects.get_or_create(
                    cart=user_cart, product=anon_item.product, variant=anon_item.variant,
                    defaults={'quantity': anon_item.quantity}
                )
                if not created:
                    new_qty = user_item.quantity + anon_item.quantity
                    stock = anon_item.variant.inventory_qty if anon_item.variant else anon_item.product.variant_inventory_qty
                    if new_qty <= stock:
                        user_item.quantity = new_qty
                        user_item.save(update_fields=['quantity'])

            anon_cart.delete()

        return Response(CartSerializer(user_cart).data)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        cart = self._get_or_create_cart(request)
        if not cart:
            return Response({'error': 'Carrito no encontrado'}, status=404)

        cart.items.all().delete()
        return Response(status=204)
