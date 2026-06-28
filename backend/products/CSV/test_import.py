#!/usr/bin/env python
import sys
import os
from pathlib import Path

# Configurar Django
backend_path = Path(__file__).parent.parent.parent  # Ir hasta backend/
sys.path.insert(0, str(backend_path))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from products.models import Product

print("✅ Django configurado correctamente")
print(f"📊 Productos en BD: {Product.objects.count()}")

# Probar importar CSV
import csv
csv_path = os.path.join(os.path.dirname(__file__), 'apparel.csv')
print(f"📁 Buscando CSV en: {csv_path}")
print(f"📂 Existe archivo: {os.path.exists(csv_path)}")

if os.path.exists(csv_path):
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        print(f"📈 Filas en CSV: {len(rows)}")
        if rows:
            print(f"📋 Primera fila: {rows[0].get('Title', 'N/A')}")
            
            # Probar crear un producto
            print("🔄 Intentando crear producto...")
            try:
                product = Product(
                    handle=rows[0].get('Handle', 'test-handle'),
                    title=rows[0].get('Title', 'Test Product'),
                    variant_price=50.00
                )
                product.save()
                print("✅ Producto creado exitosamente!")
                print(f"📊 Productos en BD ahora: {Product.objects.count()}")
            except Exception as e:
                print(f"❌ Error creando producto: {e}")