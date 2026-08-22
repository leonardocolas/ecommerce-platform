from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import LoginSerializer, RegisterSerializer, UserAdminSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'error': 'Credenciales invalidas'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role,
                'email': user.email,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class LogoutView(APIView):
    """Blacklists the provided refresh token so it can no longer be used."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Se requiere el refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Token inválido o ya fue revocado.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ('true', '1', 'yes'))
        if search:
            qs = qs.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search)
            )
        return qs

    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'is_active': user.is_active})

    @action(detail=True, methods=['patch'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get('role')
        if role not in dict(User.ROLE_CHOICES):
            return Response({'error': 'Rol invalido'}, status=400)
        user.role = role
        user.save(update_fields=['role'])
        return Response({'role': user.role})

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        user = self.get_object()
        from orders.models import Order
        orders = Order.objects.filter(user=user).order_by('-created_at').select_related().prefetch_related('items__product')
        from orders.serializers import OrderSerializer
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        email = request.data.get('email')
        username = request.data.get('username')
        if email:
            user.email = email
        if username:
            user.username = username
        user.save(update_fields=['email', 'username'])
        return Response({'id': user.id, 'username': user.username, 'email': user.email})
