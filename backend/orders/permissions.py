from rest_framework.permissions import BasePermission
from users.permissions import is_admin_user


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (
            obj.user == request.user or is_admin_user(request.user)
        )


class IsStaffOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin_user(request.user)
