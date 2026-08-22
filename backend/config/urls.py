
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/coupons/', include('coupons.urls')),
    path('api/banners/', include('banners.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
