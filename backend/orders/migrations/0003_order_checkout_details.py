from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_alter_order_total_orderitem'),
    ]

    operations = [
        migrations.AddField(model_name='order', name='customer_name', field=models.CharField(max_length=150, default=''), preserve_default=False),
        migrations.AddField(model_name='order', name='tax_id', field=models.CharField(max_length=30, default=''), preserve_default=False),
        migrations.AddField(model_name='order', name='shipping_address', field=models.TextField(default=''), preserve_default=False),
        migrations.AddField(model_name='order', name='customer_email', field=models.EmailField(default='', max_length=254), preserve_default=False),
        migrations.AddField(model_name='order', name='invoice_number', field=models.CharField(blank=True, max_length=30, null=True, unique=True)),
    ]