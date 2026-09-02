from rest_framework.permissions import BasePermission


def is_admin_user(user):
    return bool(
        user and user.is_authenticated
        and (user.is_superuser or user.role in {'STAFF', 'ADMIN'})
    )


class IsStaffOrAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and is_admin_user(request.user)
        )