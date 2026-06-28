from pathlib import Path

from django.core.management import call_command
from django.test import TestCase

from .models import Product


class ImportProductsCsvCommandTests(TestCase):
    fixtures_dir = Path(__file__).resolve().parent / "testdata"

    def test_imports_all_csv_files_from_directory(self):
        base_path = self.fixtures_dir / "import_all"

        call_command("import_products_csv", "--all", f"--directory={base_path}")

        self.assertEqual(Product.objects.count(), 3)
        self.assertTrue(Product.objects.filter(handle="ring-1", title="Anillo 1").exists())

    def test_updates_existing_product_when_handle_matches(self):
        Product.objects.create(
            handle="ring-1",
            title="Anillo viejo",
            variant_price="15.00",
            published=False,
        )

        csv_path = self.fixtures_dir / "update_existing.csv"

        call_command("import_products_csv", str(csv_path))

        product = Product.objects.get(handle="ring-1")
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(product.title, "Anillo nuevo")
        self.assertEqual(str(product.variant_price), "30.00")
        self.assertTrue(product.published)
