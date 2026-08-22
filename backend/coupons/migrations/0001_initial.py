import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('discount_type', models.CharField(choices=[('PERCENTAGE', 'Porcentaje'), ('FIXED', 'Monto fijo'), ('BOGO', '2x1'), ('FREE_SHIPPING', 'Envío gratis')], max_length=20)),
                ('discount_value', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('min_purchase', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('max_uses', models.PositiveIntegerField(default=0, help_text='0 = sin límite')),
                ('used_count', models.PositiveIntegerField(default=0)),
                ('valid_from', models.DateTimeField(default=django.utils.timezone.now)),
                ('valid_to', models.DateTimeField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('applicable_categories', models.JSONField(blank=True, default=list, help_text='Lista de categorías. Vacío = todas.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('applicable_products', models.ManyToManyField(blank=True, related_name='coupons', to='products.product')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CouponUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('used_at', models.DateTimeField(auto_now_add=True)),
                ('coupon', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='usages', to='coupons.coupon')),
                ('order', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='coupon_usages', to='orders.order')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='coupon_usages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-used_at'],
            },
        ),
    ]
