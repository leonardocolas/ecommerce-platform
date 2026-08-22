from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from products.models import Product

User = get_user_model()


PERIOD_MAP = {
    'today': timedelta(days=1),
    '7d': timedelta(days=7),
    '30d': timedelta(days=30),
    '90d': timedelta(days=90),
}


def get_period_start(period: str):
    if period == 'all' or period not in PERIOD_MAP:
        return None
    return timezone.now() - PERIOD_MAP[period]


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['ADMIN', 'STAFF']:
            return Response({'error': 'No tienes permisos'}, status=403)

        period = request.query_params.get('period', 'all')
        period_start = get_period_start(period)

        # ── Base querysets ─────────────────────────────────────────────────────
        orders_qs = Order.objects.all()
        users_qs = User.objects.all()
        order_items_qs = OrderItem.objects.select_related('order', 'product')

        if period_start:
            orders_qs = orders_qs.filter(created_at__gte=period_start)
            users_qs = users_qs.filter(date_joined__gte=period_start)
            order_items_qs = order_items_qs.filter(order__created_at__gte=period_start)

        paid_orders = orders_qs.filter(status='PAID')

        # ── Summary stats ──────────────────────────────────────────────────────
        total_revenue = paid_orders.aggregate(total=Sum('total'))['total'] or 0
        total_orders = orders_qs.count()
        paid_count = paid_orders.count()
        total_users = users_qs.count()
        total_products = Product.objects.count()

        # ── Revenue over time ──────────────────────────────────────────────────
        revenue_by_date = (
            paid_orders
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(revenue=Sum('total'), count=Count('id'))
            .order_by('date')
        )
        revenue_chart = [
            {
                'date': item['date'].isoformat(),
                'revenue': float(item['revenue']),
                'orders': item['count'],
            }
            for item in revenue_by_date
        ]

        # ── Top selling products ───────────────────────────────────────────────
        top_products = (
            order_items_qs
            .filter(order__status='PAID')
            .values(
                product_id=F('product__id'),
                title=F('product__title'),
                image=F('product__image_src'),
            )
            .annotate(
                total_sold=Count('id'),
                total_revenue=Sum(F('price') * F('quantity')),
            )
            .order_by('-total_sold')[:10]
        )
        top_products_list = [
            {
                'id': item['product_id'],
                'title': item['title'],
                'image': item['image'],
                'total_sold': item['total_sold'],
                'total_revenue': float(item['total_revenue'] or 0),
            }
            for item in top_products
        ]

        # ── New customers over time ────────────────────────────────────────────
        customers_by_date = (
            users_qs
            .filter(role='USER')
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        customers_chart = [
            {'date': item['date'].isoformat(), 'count': item['count']}
            for item in customers_by_date
        ]

        # ── Orders by status ───────────────────────────────────────────────────
        orders_by_status = (
            orders_qs
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        status_chart = [
            {'status': item['status'], 'count': item['count']}
            for item in orders_by_status
        ]

        return Response({
            'summary': {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'paid_orders': paid_count,
                'total_users': total_users,
                'total_products': total_products,
            },
            'revenue_chart': revenue_chart,
            'top_products': top_products_list,
            'customers_chart': customers_chart,
            'status_chart': status_chart,
        })
