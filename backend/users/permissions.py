from rest_framework.permissions import BasePermission


def is_admin_user(user):
    return bool(
        user and user.is_authenticated
        and (user.is_superuser or user.role in {'STAFF', 'ADMIN'})
    )


def is_platform_admin(user):
    return bool(
        user and user.is_authenticated
        and (user.is_superuser or user.role == 'ADMIN')
    )


class IsStaffOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and is_admin_user(request.user)
        )


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_platform_admin(request.user)