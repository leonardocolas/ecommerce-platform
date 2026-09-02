from django.urls import path
from .views import DashboardStatsView, OperationsConfigView

urlpatterns = [
    path('stats/', DashboardStatsView.as_view()),
    path('operations-config/', OperationsConfigView.as_view()),
]
