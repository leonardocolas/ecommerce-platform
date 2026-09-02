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
        if self.action in ['list', 'retrieve'] and self.request.user.role not in ['ADMIN', 'STAFF']:
            return BannerPublicSerializer
        return BannerSerializer

    def list(self, request, *args, **kwargs):
        if request.user.role in ['ADMIN', 'STAFF']:
            return super().list(request, *args, **kwargs)
        queryset = self.get_queryset().filter(is_active=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
