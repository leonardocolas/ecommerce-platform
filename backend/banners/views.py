from rest_framework import viewsets, permissions
from rest_framework.response import Response
from users.permissions import IsStaffOrAdminRole
from .models import Banner
from .serializers import BannerSerializer, BannerPublicSerializer


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsStaffOrAdminRole()]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve'] and not self._is_staff_or_admin():
            return BannerPublicSerializer
        return BannerSerializer

    def _is_staff_or_admin(self):
        user = self.request.user
        if not user.is_authenticated:
            return False
        role = getattr(user, 'role', None)
        return user.is_superuser or role in ['ADMIN', 'STAFF']

    def list(self, request, *args, **kwargs):
        if self._is_staff_or_admin():
            return super().list(request, *args, **kwargs)
        queryset = self.get_queryset().filter(is_active=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
