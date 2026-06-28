from rest_framework.permissions import BasePermission


class IsProviderOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PROVIDER', 'ADMIN']


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.provider == request.user or request.user.role == 'ADMIN'