from rest_framework.permissions import BasePermission


class IsProviderOrAdmin(BasePermission):
    """Allows access to users with PROVIDER, STAFF, or ADMIN roles."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ['PROVIDER', 'ADMIN', 'STAFF']
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: the provider who owns the product, or ADMIN/STAFF."""

    def has_object_permission(self, request, view, obj):
        return (
            obj.provider == request.user
            or request.user.role in ['ADMIN', 'STAFF']
        )
