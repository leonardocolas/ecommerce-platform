from django.urls import path
from .views import CreatePaymentView, SimulatePaymentView

urlpatterns = [
    path('create/<int:order_id>/', CreatePaymentView.as_view()),
    path('simulate/<uuid:transaction_id>/', SimulatePaymentView.as_view()),
]