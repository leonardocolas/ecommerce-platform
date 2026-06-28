from rest_framework.permissions import BasePermission


class IsCartOwnerOrSession(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.user == request.user
        session_key = request.headers.get('X-Session-Key') or request.query_params.get('session_key')
        return obj.session_key and obj.session_key == session_key
