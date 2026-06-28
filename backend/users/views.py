from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserAdminSerializer

User = get_user_model()


class TestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"msg": "ok"})


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


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if search:
            qs = qs.filter(username__icontains=search) | qs.filter(email__icontains=search)
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
            return Response({'error': 'Rol inválido'}, status=400)
        user.role = role
        user.save(update_fields=['role'])
        return Response({'role': user.role})
