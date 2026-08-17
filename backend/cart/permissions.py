from rest_framework.permissions import BasePermission


class CartPermission(BasePermission):
    """
    Allows all cart operations for authenticated users.
    Allows anonymous users to operate on their own cart when they supply
    X-Session-Key (header or query param).
    The 'merge' action always requires authentication (checked explicitly in the view).
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True

        # Anonymous users are allowed as long as a session key is provided.
        # The view's _get_or_create_cart() will return None if it's missing
        # and the action handlers will return a 400 in that case.
        session_key = (
            request.headers.get('X-Session-Key')
            or request.query_params.get('session_key')
        )
        return bool(session_key)

    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.user == request.user
        session_key = (
            request.headers.get('X-Session-Key')
            or request.query_params.get('session_key')
        )
        return obj.session_key and obj.session_key == session_key


class IsCartOwnerOrSession(BasePermission):
    """Legacy alias kept for reference; use CartPermission on the viewset."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            return obj.user == request.user
        session_key = (
            request.headers.get('X-Session-Key')
            or request.query_params.get('session_key')
        )
        return obj.session_key and obj.session_key == session_key
