import csv

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.http import HttpResponse
from .models import Product, InventoryMovement
from .serializers import ProductSerializer
from .permissions import IsProviderOrAdmin, IsOwnerOrAdmin
from users.permissions import is_admin_user


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    class CatalogPagination(PageNumberPagination):
        page_size = 12
        page_size_query_param = 'page_size'
        max_page_size = 48

    pagination_class = CatalogPagination

    def get_queryset(self):
        user = self.request.user
        # Staff and admin can see all products (including drafts).
        # Everyone else only sees published products.
        queryset = Product.objects.all() if user.is_authenticated and (user.role == 'PROVIDER' or is_admin_user(user)) else Product.objects.filter(published=True)
        search = self.request.query_params.get('search', '').strip()
        category = self.request.query_params.get('category', '').strip()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(body_html__icontains=search) |
                Q(tags__icontains=search) | Q(vendor__icontains=search)
            )
        if category:
            queryset = queryset.filter(product_type__iexact=category)
        if min_price:
            queryset = queryset.filter(variant_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(variant_price__lte=max_price)
        ordering = self.request.query_params.get('ordering', '-updated_at')
        if ordering.lstrip('-') in {'updated_at', 'variant_price', 'title', 'variant_inventory_qty'}:
            queryset = queryset.order_by(ordering)
        return queryset.prefetch_related('variants', 'images')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(queryset, many=True).data)

    def get_permissions(self):
        if self.action in ['create']:
            return [IsProviderOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsProviderOrAdmin(), IsOwnerOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        if not is_admin_user(request.user):
            return Response({'error': 'No tienes permisos.'}, status=403)
        product = self.get_object()
        try:
            quantity = int(request.data.get('quantity'))
        except (TypeError, ValueError):
            return Response({'error': 'La cantidad debe ser un número entero.'}, status=400)
        if quantity == 0 or product.variant_inventory_qty + quantity < 0:
            return Response({'error': 'El ajuste dejaría el inventario en un valor inválido.'}, status=400)
        product.variant_inventory_qty += quantity
        product.save(update_fields=['variant_inventory_qty'])
        movement = InventoryMovement.objects.create(
            product=product, quantity=quantity,
            reason=request.data.get('reason', 'MANUAL_ADJUSTMENT'),
            reference=request.data.get('reference', ''), actor=request.user,
        )
        return Response({'stock': product.variant_inventory_qty, 'movement_id': movement.id})

    @action(detail=False, methods=['get'])
    def export_inventory(self, request):
        if not is_admin_user(request.user):
            return Response({'error': 'No tienes permisos.'}, status=403)
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="inventario.csv"'
        writer = csv.writer(response)
        writer.writerow(['producto', 'sku', 'stock', 'variante', 'actualizado'])
        for product in Product.objects.prefetch_related('variants').order_by('title'):
            variants = list(product.variants.all())
            if variants:
                for variant in variants:
                    writer.writerow([product.title, variant.sku, variant.inventory_qty, True, product.updated_at.isoformat()])
            else:
                writer.writerow([product.title, product.variant_sku or '', product.variant_inventory_qty, False, product.updated_at.isoformat()])
        return response

    @action(detail=False, methods=['get'], url_path=r'by-handle/(?P<handle>[-\w]+)')
    def by_handle(self, request, handle=None):
        product = self.get_queryset().get(handle=handle)
        return Response(self.get_serializer(product).data)
