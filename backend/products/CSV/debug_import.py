import sys
import os
from pathlib import Path

print("🔍 Probando inicialización del importador...")

# Configurar Django
backend_path = Path(r'd:\Pincha\Personal\ecommerce-platform\ecommerce-platform\backend')
sys.path.insert(0, str(backend_path))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from products.models import Product

print('✅ Django configurado')

# Simular inicialización
csv_path = r'd:\Pincha\Personal\ecommerce-platform\ecommerce-platform\backend\products\CSV\apparel.csv'
print(f'📁 CSV: {csv_path}')
print(f'📂 Existe: {os.path.exists(csv_path)}')

# Intentar importar la clase ProductImporter del archivo
try:
    sys.path.insert(0, r'd:\Pincha\Personal\ecommerce-platform\ecommerce-platform\backend\products\CSV')
    from scriptImportacion import ProductImporter
    print('✅ Clase ProductImporter importada')
    
    importer = ProductImporter(csv_path, False)
    print('✅ Instancia ProductImporter creada')
    
    # Intentar ejecutar import_csv
    print('🔄 Ejecutando import_csv...')
    importer.import_csv()
    print('✅ import_csv completado')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()