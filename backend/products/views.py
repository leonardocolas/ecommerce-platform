from rest_framework import viewsets, permissions
from .models import Product
from .serializers import ProductSerializer
from .permissions import IsProviderOrAdmin, IsOwnerOrAdmin


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer

    def get_queryset(self):
        user = self.request.user
        # Staff and admin can see all products (including drafts).
        # Everyone else only sees published products.
        if user.is_authenticated and user.role in ['ADMIN', 'STAFF', 'PROVIDER']:
            return Product.objects.all()
        return Product.objects.filter(published=True)

    def get_permissions(self):
        if self.action in ['create']:
            return [IsProviderOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsProviderOrAdmin(), IsOwnerOrAdmin()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)
