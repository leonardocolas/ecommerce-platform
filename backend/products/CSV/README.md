# Importación de Productos desde CSV

Este script importa productos desde archivos CSV (formato Shopify) a la base de datos Django del ecommerce.

## Estado Actual
- **Productos importados**: 60 productos en total
- **Archivos procesados**: apparel.csv, home-and-garden.csv, jewelery.csv
- **Estado**: Importacion disponible desde `manage.py`

## Archivos CSV disponibles

- `apparel.csv` - Productos de ropa (20 productos importados ✅)
- `home-and-garden.csv` - Productos de hogar y jardín (21 productos importados ✅)
- `jewelery.csv` - Productos de joyería

## Requisitos

- Python 3.8+
- Django configurado (settings.py)
- Las migraciones aplicadas (`python manage.py migrate`)

## Uso

### Importación básica desde Django

```bash
cd backend
python manage.py import_products_csv products/CSV/apparel.csv
```

### Importar todos los CSV del directorio

```bash
python manage.py import_products_csv --all
```

### Importar un conjunto específico de archivos

```bash
python manage.py import_products_csv products/CSV/apparel.csv products/CSV/jewelery.csv
```

## Características del script

✅ **Importación eficiente con Django ORM**
- Usa transacciones atómicas para integridad de datos
- Validación automática de campos
- Permite importar uno o varios archivos desde `manage.py`

✅ **Manejo robusto de datos**
- Parseo automático de decimales, enteros y booleanos
- Normalización de URLs de imágenes
- Detección inteligente de variantes

✅ **Gestión de duplicados**
- Identifica productos existentes por `handle` (único)
- Actualiza productos si ya existen
- Preserva `created_at` en actualizaciones

✅ **Resumen claro al finalizar**
- Muestra archivos procesados, creados, actualizados y errores
- Salida en consola en tiempo real

## Campos soportados

El modelo Product ahora soporta todos estos campos:

### Información básica
- handle (único)
- title
- body_html
- vendor
- product_type
- tags
- published

### Opciones de producto
- option1_name, option1_value
- option2_name, option2_value
- option3_name, option3_value

### Información de variante
- variant_sku
- variant_price
- variant_compare_at_price
- variant_grams
- variant_inventory_qty
- variant_inventory_policy
- variant_fulfillment_service
- variant_requires_shipping
- variant_taxable
- variant_barcode

### Imágenes
- image_src (URL)
- image_position
- image_alt_text

### Google Shopping
- google_shopping_product_category
- google_shopping_gender
- google_shopping_age_group
- google_shopping_mpn
- google_shopping_adwords_grouping
- google_shopping_adwords_labels
- google_shopping_condition
- google_shopping_custom_product
- google_shopping_custom_label_0

### Metadatos
- created_at (automático)
- updated_at (automático)
- gift_card

## Notas importantes

1. **Handle único**: El campo `handle` debe ser único. Si intenta importar un producto con handle duplicado, se actualizará el existente.

2. **Imágenes**:
   - Por defecto, guarda URLs de imágenes tal como están

3. **Variantes**: El CSV de Shopify mantiene variantes en filas separadas con el mismo `handle`. El script actualiza el primer registro con la nueva variante.

4. **Errores**: El comando detiene la ejecución si falta un archivo o una columna requerida

## Ejemplo de salida

```
2024-04-03 10:15:32,123 - INFO - 🚀 Iniciando importación desde apparel.csv
2024-04-03 10:15:32,456 - INFO - ✅ Creado: Ocean Blue Shirt (#ocean-blue-shirt)
2024-04-03 10:15:32,789 - INFO - 🔄 Actualizado: Classic Varsity Top
...
2024-04-03 10:15:35,000 - INFO - ==================================================
2024-04-03 10:15:35,001 - INFO - 📊 RESUMEN DE IMPORTACIÓN
2024-04-03 10:15:35,002 - INFO - ==================================================
2024-04-03 10:15:35,003 - INFO - 📝 Total procesados: 45
2024-04-03 10:15:35,004 - INFO - ✨ Creados: 40
2024-04-03 10:15:35,005 - INFO - 🔄 Actualizados: 5
2024-04-03 10:15:35,006 - INFO - ⏭️ Saltados: 0
2024-04-03 10:15:35,007 - INFO - ❌ Errores: 0
```

## Troubleshooting

### Error: "Cannot find module 'products.models'"
- Asegúrese de estar ejecutando desde el directorio `backend/`

### Error: "DJANGO_SETTINGS_MODULE not configured"
- El script intenta auto-detectar la configuración. Si falla, edite la línea `os.environ.setdefault()`

### Imágenes no se descargan
- Verifique que la carpeta `media/products/` sea escribible
- Compruebe que las URLs de imágenes sean válidas

