import logging

from django.core.management.base import BaseCommand, CommandError

from products.importers import DEFAULT_CSV_DIR, ProductCsvImporter


class Command(BaseCommand):
    help = "Importa productos desde uno o varios archivos CSV a la base de datos."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_paths",
            nargs="*",
            help="Ruta a uno o varios archivos CSV.",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            dest="import_all",
            help="Importa todos los CSV del directorio indicado.",
        )
        parser.add_argument(
            "--directory",
            default=str(DEFAULT_CSV_DIR),
            help="Directorio desde el que se buscaran los CSV al usar --all.",
        )

    def handle(self, *args, **options):
        logger = logging.getLogger("products.importer")
        if not logger.handlers:
            handler = logging.StreamHandler(self.stdout)
            handler.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
            logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False

        try:
            csv_paths = ProductCsvImporter.resolve_paths(
                csv_paths=options["csv_paths"],
                directory=options["directory"],
                import_all=options["import_all"],
            )
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        if not csv_paths:
            raise CommandError("No se encontraron archivos CSV para importar.")

        importer = ProductCsvImporter(logger=logger)

        try:
            stats = importer.import_many(csv_paths)
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS("Importacion completada."))
        self.stdout.write(
            "Archivos: {files} | Procesados: {total} | Creados: {created} | "
            "Actualizados: {updated} | Omitidos: {skipped} | Errores: {errors}".format(
                files=stats.files,
                total=stats.total,
                created=stats.created,
                updated=stats.updated,
                skipped=stats.skipped,
                errors=stats.errors,
            )
        )
