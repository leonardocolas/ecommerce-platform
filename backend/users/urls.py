from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, LoginView, UserAdminViewSet

router = DefaultRouter()
router.register(r'admin/users', UserAdminViewSet, basename='admin-user')

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('', include(router.urls)),
]
