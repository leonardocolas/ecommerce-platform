import csv
import logging
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.db import transaction
from django.db.utils import IntegrityError

from .models import Product


LOGGER = logging.getLogger(__name__)
DEFAULT_CSV_DIR = Path(__file__).resolve().parent / "CSV"


@dataclass
class ImportStats:
    files: int = 0
    total: int = 0
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: int = 0


class ProductCsvImporter:
    required_columns = ("Handle", "Title")

    def __init__(self, logger=None):
        self.logger = logger or LOGGER
        self.stats = ImportStats()

    @staticmethod
    def parse_decimal(value, default=None):
        if value is None:
            return default

        cleaned = str(value).strip().replace("$", "").replace(",", "")
        if not cleaned:
            return default

        try:
            return Decimal(cleaned)
        except (InvalidOperation, TypeError, ValueError):
            return default

    @staticmethod
    def parse_int(value, default=0):
        if value is None:
            return default

        cleaned = str(value).strip().replace(",", "")
        if not cleaned:
            return default

        try:
            return int(float(cleaned))
        except (TypeError, ValueError):
            return default

    @staticmethod
    def parse_boolean(value, default=False):
        if value is None:
            return default

        cleaned = str(value).strip().lower()
        if not cleaned:
            return default

        return cleaned in {"true", "1", "yes", "published"}

    @staticmethod
    def clean_text(value, max_length=None):
        if value is None:
            return None

        cleaned = str(value).strip()
        if not cleaned:
            return None

        if max_length is not None:
            return cleaned[:max_length]
        return cleaned

    @classmethod
    def resolve_paths(cls, csv_paths=None, directory=None, import_all=False):
        if csv_paths:
            return [Path(path).resolve() for path in csv_paths]

        base_dir = Path(directory).resolve() if directory else DEFAULT_CSV_DIR
        if import_all:
            return sorted(base_dir.glob("*.csv"))

        raise ValueError("Debes indicar archivos CSV o usar --all.")

    @staticmethod
    def detect_delimiter(csv_file):
        sample = csv_file.read(2048)
        csv_file.seek(0)
        return ";" if sample.count(";") > sample.count(",") else ","

    def get_existing_product(self, row):
        handle = self.clean_text(row.get("Handle"), 255)
        sku = self.clean_text(row.get("Variant SKU"), 255)

        if handle:
            try:
                return Product.objects.get(handle=handle)
            except Product.DoesNotExist:
                pass

        if sku:
            try:
                return Product.objects.get(variant_sku=sku)
            except Product.DoesNotExist:
                pass

        return None

    @staticmethod
    def get_column(row, column_names):
        names = column_names if isinstance(column_names, (list, tuple)) else [column_names]
        for name in names:
            value = row.get(name)
            if value:
                return value
        return None

    def build_product_data(self, row):
        image_src = self.clean_text(row.get("Image Src"))

        return {
            "handle": self.clean_text(row.get("Handle"), 255),
            "title": self.clean_text(row.get("Title"), 255) or "Producto sin titulo",
            "body_html": self.clean_text(row.get("Body (HTML)")),
            "vendor": self.clean_text(row.get("Vendor"), 255),
            "product_type": self.clean_text(row.get("Type"), 255),
            "tags": self.clean_text(row.get("Tags")),
            "published": self.parse_boolean(row.get("Published"), default=False),
            "option1_name": self.clean_text(row.get("Option1 Name"), 100),
            "option1_value": self.clean_text(row.get("Option1 Value"), 100),
            "option2_name": self.clean_text(row.get("Option2 Name"), 100),
            "option2_value": self.clean_text(row.get("Option2 Value"), 100),
            "option3_name": self.clean_text(row.get("Option3 Name"), 100),
            "option3_value": self.clean_text(row.get("Option3 Value"), 100),
            "variant_sku": self.clean_text(row.get("Variant SKU"), 255),
            "variant_grams": self.parse_int(row.get("Variant Grams"), default=0),
            "variant_inventory_tracker": self.clean_text(row.get("Variant Inventory Tracker"), 50),
            "variant_inventory_qty": self.parse_int(row.get("Variant Inventory Qty"), default=0),
            "variant_inventory_policy": self.clean_text(row.get("Variant Inventory Policy"), 50),
            "variant_fulfillment_service": self.clean_text(row.get("Variant Fulfillment Service"), 100),
            "variant_price": self.parse_decimal(row.get("Variant Price"), default=Decimal("0.00")),
            "variant_compare_at_price": self.parse_decimal(row.get("Variant Compare At Price")),
            "variant_requires_shipping": self.parse_boolean(row.get("Variant Requires Shipping"), default=True),
            "variant_taxable": self.parse_boolean(row.get("Variant Taxable"), default=True),
            "variant_barcode": self.clean_text(row.get("Variant Barcode"), 255),
            "image_src": image_src,
            "image_position": self.parse_int(row.get("Image Position"), default=0) or None,
            "image_alt_text": self.clean_text(row.get("Image Alt Text")),
            "gift_card": self.parse_boolean(row.get("Gift Card"), default=False),
            "seo_title": self.clean_text(row.get("SEO Title"), 255),
            "seo_description": self.clean_text(row.get("SEO Description")),
            "google_shopping_product_category": self.clean_text(
                self.get_column(row, "Google Shopping / Google Product Category"),
                255,
            ),
            "google_shopping_gender": self.clean_text(self.get_column(row, "Google Shopping / Gender"), 50),
            "google_shopping_age_group": self.clean_text(
                self.get_column(row, "Google Shopping / Age Group"),
                50,
            ),
            "google_shopping_mpn": self.clean_text(self.get_column(row, "Google Shopping / MPN"), 255),
            "google_shopping_adwords_grouping": self.clean_text(
                self.get_column(row, "Google Shopping / AdWords Grouping"),
                255,
            ),
            "google_shopping_adwords_labels": self.clean_text(
                self.get_column(row, "Google Shopping / AdWords Labels")
            ),
            "google_shopping_condition": self.clean_text(
                self.get_column(row, "Google Shopping / Condition"),
                50,
            ),
            "google_shopping_custom_product": self.clean_text(
                self.get_column(row, "Google Shopping / Custom Product"),
                50,
            ),
            "google_shopping_custom_label_0": self.clean_text(
                self.get_column(row, "Google Shopping / Custom Label 0"),
                255,
            ),
        }

    @transaction.atomic
    def import_row(self, row, row_number, source_name):
        handle = self.clean_text(row.get("Handle"), 255)
        if not handle:
            self.stats.skipped += 1
            self.logger.warning(
                "Fila %s de %s omitida porque no tiene handle.",
                row_number,
                source_name,
            )
            return

        product_data = self.build_product_data(row)
        product = self.get_existing_product(row)

        try:
            if product is None:
                Product.objects.create(**product_data)
                self.stats.created += 1
            else:
                for field, value in product_data.items():
                    setattr(product, field, value)
                product.save()
                self.stats.updated += 1

            self.stats.total += 1
        except IntegrityError:
            self.stats.errors += 1
            self.logger.exception(
                "Error de integridad importando la fila %s de %s (%s).",
                row_number,
                source_name,
                handle,
            )
        except Exception:
            self.stats.errors += 1
            self.logger.exception(
                "Error inesperado importando la fila %s de %s (%s).",
                row_number,
                source_name,
                handle,
            )

    def import_file(self, csv_path):
        csv_path = Path(csv_path).resolve()
        if not csv_path.exists():
            raise FileNotFoundError(f"No existe el archivo CSV: {csv_path}")

        self.logger.info("Importando %s", csv_path)

        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            delimiter = self.detect_delimiter(csv_file)
            reader = csv.DictReader(csv_file, delimiter=delimiter)
            fieldnames = reader.fieldnames or []
            missing_columns = [column for column in self.required_columns if column not in fieldnames]
            if missing_columns:
                raise ValueError(
                    f"El archivo {csv_path.name} no contiene las columnas requeridas: {missing_columns}"
                )

            self.stats.files += 1
            for row_number, row in enumerate(reader, start=2):
                self.import_row(row, row_number, csv_path.name)

        return self.stats

    def import_many(self, csv_paths):
        paths = [Path(path).resolve() for path in csv_paths]
        if not paths:
            raise ValueError("No se encontraron archivos CSV para importar.")

        for csv_path in paths:
            self.import_file(csv_path)

        return self.stats
