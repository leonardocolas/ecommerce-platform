from django.urls import path
from .views import CreatePaymentView, SimulatePaymentView, SubmitPaymentProofView, ReviewPaymentProofView, ExportPaymentsView

urlpatterns = [
    path('create/<int:order_id>/', CreatePaymentView.as_view()),
    path('simulate/<uuid:transaction_id>/', SimulatePaymentView.as_view()),
    path('proof/<int:order_id>/', SubmitPaymentProofView.as_view()),
    path('proof/<int:order_id>/review/', ReviewPaymentProofView.as_view()),
    path('export/', ExportPaymentsView.as_view()),
]