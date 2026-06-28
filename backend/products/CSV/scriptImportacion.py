#!/usr/bin/env python
"""
Script para importar productos desde CSV a Django con manejo de todos los casos:
- Fechas (created_at, updated_at)
- Imágenes (descarga local o URLs externas)
- Validación de datos
- Manejo de duplicados
- Logging completo
"""

import os
import csv
import logging
import requests
import uuid
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse
from django.core.files.base import ContentFile
from django.core.files import File
from django.utils import timezone
from django.db import transaction
from django.db.utils import IntegrityError

# Configurar Django ANTES de usar cualquier funcionalidad de Django
import sys
import django
from pathlib import Path as PathLib

backend_path = PathLib(__file__).parent.parent.parent  # Ir hasta backend/
sys.path.insert(0, str(backend_path))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Ahora sí podemos usar Django
from products.models import Product

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('import_products.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuración
DOWNLOAD_IMAGES = False  # True para descargar imágenes localmente, False para usar URLs
IMAGES_DIR = Path('media/products/')
DEFAULT_IMAGE = 'https://via.placeholder.com/500x500?text=No+Image'
DATE_DEFAULT = timezone.now()  # Fecha por defecto para registros antiguos

class ProductImporter:
    def __init__(self, csv_file_path, download_images=False):
        self.csv_file_path = csv_file_path
        self.download_images = download_images
        self.stats = {
            'total': 0,
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0
        }
        
        if download_images:
            IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    def parse_decimal(self, value):
        """Convierte valores a Decimal de forma segura"""
        if not value or value.strip() == '':
            return Decimal('0.00')
        try:
            # Limpiar el valor (remover $, comas, etc.)
            cleaned = str(value).replace('$', '').replace(',', '').strip()
            return Decimal(cleaned)
        except:
            return Decimal('0.00')
    
    def parse_int(self, value):
        """Convierte valores a Integer de forma segura"""
        if not value or value.strip() == '':
            return 0
        try:
            return int(float(str(value).replace(',', '')))
        except:
            return 0
    
    def parse_boolean(self, value):
        """Convierte valores a Boolean de forma segura"""
        if not value or value.strip() == '':
            return False
        return str(value).lower() in ['true', '1', 'yes', 'published', 'true']
    
    def parse_datetime(self, value):
        """Convierte fechas a datetime de forma segura"""
        if not value or value.strip() == '':
            return DATE_DEFAULT
        
        # Formatos de fecha posibles
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%d/%m/%Y %H:%M:%S',
            '%d/%m/%Y',
            '%Y-%m-%dT%H:%M:%S',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(str(value).strip(), fmt)
                return timezone.make_aware(dt)
            except:
                continue
        
        logger.warning(f"No se pudo parsear fecha: {value}, usando default")
        return DATE_DEFAULT
    
    def download_image(self, url, product_title):
        """Descarga una imagen desde URL y la guarda localmente"""
        if not url or url.strip() == '':
            url = DEFAULT_IMAGE
        
        try:
            # Generar nombre único para la imagen
            extension = url.split('.')[-1].lower()
            if extension not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                extension = 'jpg'
            
            filename = f"{uuid.uuid4().hex}_{product_title[:50]}.{extension}"
            filepath = IMAGES_DIR / filename
            
            # Descargar imagen
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Guardar imagen
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            return f"products/{filename}"
        except Exception as e:
            logger.error(f"Error descargando imagen {url}: {e}")
            return None
    
    def get_or_create_product(self, row):
        """Obtiene producto existente por handle o SKU, o crea uno nuevo"""
        handle = row.get('Handle', '').strip()
        sku = row.get('Variant SKU', '').strip()
        
        if not handle and not sku:
            return None
        
        # Buscar por handle (único en Shopify)
        if handle:
            try:
                return Product.objects.get(handle=handle)
            except Product.DoesNotExist:
                pass
        
        # Buscar por SKU como fallback
        if sku:
            try:
                return Product.objects.get(variant_sku=sku)
            except Product.DoesNotExist:
                pass
        
        return None
    
    @transaction.atomic
    def import_product(self, row, row_number):
        """Importa un solo producto desde una fila del CSV"""
        try:
            handle = row.get('Handle', '').strip()
            
            # El handle es obligatorio - si está vacío, es una variante del anterior
            if not handle:
                logger.debug(f"Fila {row_number}: Sin handle, omitiendo")
                self.stats['skipped'] += 1
                return True
            
            # Buscar producto existente
            product = self.get_or_create_product(row)
            action = 'update' if product else 'create'
            
            # Preparar datos
            image_url = row.get('Image Src', '').strip()
            image_path = None
            
            # Manejar imagen
            if self.download_images and image_url:
                image_path = self.download_image(image_url, row.get('Title', 'product'))
            elif image_url:
                image_path = image_url  # Usar URL directamente
            
            # Mapeo de campos del CSV al modelo
            # Buscar variantes posibles de nombres de columnas
            def get_column(name_variants):
                """Busca una columna por sus variantes de nombre"""
                for name in name_variants if isinstance(name_variants, list) else [name_variants]:
                    if name in row and row[name]:
                        return row[name]
                return ''
            
            # Datos del producto
            product_data = {
                'handle': handle[:255],
                'title': row.get('Title', '')[:255],
                'body_html': row.get('Body (HTML)', ''),
                'vendor': row.get('Vendor', '')[:255],
                'product_type': row.get('Type', '')[:255],
                'tags': row.get('Tags', ''),
                'published': self.parse_boolean(row.get('Published', 'False')),
                'option1_name': row.get('Option1 Name', '')[:100],
                'option1_value': row.get('Option1 Value', '')[:100],
                'option2_name': row.get('Option2 Name', '')[:100],
                'option2_value': row.get('Option2 Value', '')[:100],
                'option3_name': row.get('Option3 Name', '')[:100],
                'option3_value': row.get('Option3 Value', '')[:100],
                'variant_sku': row.get('Variant SKU', '')[:255],
                'variant_grams': self.parse_int(row.get('Variant Grams', 0)),
                'variant_inventory_tracker': row.get('Variant Inventory Tracker', '')[:50],
                'variant_inventory_qty': self.parse_int(row.get('Variant Inventory Qty', 0)),
                'variant_inventory_policy': row.get('Variant Inventory Policy', '')[:50],
                'variant_fulfillment_service': row.get('Variant Fulfillment Service', '')[:100],
                'variant_price': self.parse_decimal(row.get('Variant Price', 0)),
                'variant_compare_at_price': self.parse_decimal(row.get('Variant Compare At Price', 0)),
                'variant_requires_shipping': self.parse_boolean(row.get('Variant Requires Shipping', 'True')),
                'variant_taxable': self.parse_boolean(row.get('Variant Taxable', 'True')),
                'variant_barcode': row.get('Variant Barcode', '')[:255],
                'image_src': image_path if image_path else image_url,
                'image_position': self.parse_int(row.get('Image Position', 1)),
                'image_alt_text': row.get('Image Alt Text', '')[:255],
                'gift_card': self.parse_boolean(row.get('Gift Card', 'False')),
                'seo_title': row.get('SEO Title', '')[:255],
                'seo_description': row.get('SEO Description', ''),
                'google_shopping_product_category': get_column('Google Shopping / Google Product Category')[:255],
                'google_shopping_gender': get_column('Google Shopping / Gender')[:50],
                'google_shopping_age_group': get_column('Google Shopping / Age Group')[:50],
                'google_shopping_mpn': get_column('Google Shopping / MPN')[:255],
                'google_shopping_adwords_grouping': get_column('Google Shopping / AdWords Grouping')[:255],
                'google_shopping_adwords_labels': get_column('Google Shopping / AdWords Labels'),
                'google_shopping_condition': get_column('Google Shopping / Condition')[:50],
                'google_shopping_custom_product': get_column('Google Shopping / Custom Product')[:50],
                'google_shopping_custom_label_0': get_column('Google Shopping / Custom Label 0')[:255],
            }
            
            # Crear o actualizar
            if action == 'create':
                product = Product(**product_data)
                product.save()
                self.stats['created'] += 1
                logger.info(f"Creado: {product.title} (#{handle})")
            else:
                # Actualizar producto existente
                for key, value in product_data.items():
                    setattr(product, key, value)
                product.save()
                self.stats['updated'] += 1
                logger.info(f"Actualizado: {product.title}")
            
            self.stats['total'] += 1
            return True
            
        except IntegrityError as e:
            logger.error(f"Error integridad fila {row_number}: {e}")
            logger.error(f"Datos: {row.get('Title', 'Desconocido')}")
            self.stats['errors'] += 1
            return False
        except Exception as e:
            logger.error(f"Error inesperado fila {row_number}: {e}")
            logger.error(f"Datos: {row.get('Title', 'Desconocido')}")
            self.stats['errors'] += 1
            return False
    
    def import_csv(self):
        """Importa todo el archivo CSV"""
        logger.info(f"Iniciando importacion desde {self.csv_file_path}")
        
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8-sig') as f:
                # Detectar el delimitador
                sample = f.read(1024)
                f.seek(0)
                delimiter = ',' if ',' in sample else ';'
                
                csv_reader = csv.DictReader(f, delimiter=delimiter)
                
                # Validar columnas requeridas
                required_columns = ['Title', 'Handle']
                missing_columns = [col for col in required_columns if col not in csv_reader.fieldnames]
                
                if missing_columns:
                    raise ValueError(f"Columnas requeridas faltantes: {missing_columns}")
                
                for row_number, row in enumerate(csv_reader, start=2):  # start=2 por header
                    self.import_product(row, row_number)
                    
                    # Mostrar progreso cada 10 productos
                    if self.stats['total'] % 10 == 0:
                        logger.info(f"Progreso: {self.stats['total']} productos procesados")
            
            self.print_summary()
            
        except FileNotFoundError:
            logger.error(f"Archivo no encontrado: {self.csv_file_path}")
        except Exception as e:
            logger.error(f"Error general: {e}")
            import traceback
            traceback.print_exc()
    
    def print_summary(self):
        """Muestra resumen de la importación"""
        logger.info("=" * 50)
        logger.info("RESUMEN DE IMPORTACION")
        logger.info("=" * 50)
        logger.info(f"Total procesados: {self.stats['total']}")
        logger.info(f"Creados: {self.stats['created']}")
        logger.info(f"Actualizados: {self.stats['updated']}")
        logger.info(f"Saltados: {self.stats['skipped']}")
        logger.info(f"Errores: {self.stats['errors']}")
        logger.info("=" * 50)

# Script principal
if __name__ == "__main__":
    import sys
    
    # Ejecutar importación
    csv_path = sys.argv[1] if len(sys.argv) > 1 else 'apparel.csv'
    download_images = len(sys.argv) > 2 and sys.argv[2].lower() == 'download'
    
    # Si es una ruta relativa, buscarla en el mismo directorio del script
    if not os.path.isabs(csv_path):
        csv_path = os.path.join(os.path.dirname(__file__), csv_path)
    
    importer = ProductImporter(csv_path, download_images)
    importer.import_csv()