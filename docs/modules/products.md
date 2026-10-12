# Módulo de productos

## Objetivo

Gestionar el catálogo digital de la tienda, incluyendo publicación, búsqueda, variantes, imágenes y control de inventario.

## Entidades principales

- `Product`: producto base con metadata, precio base, stock general y proveedor.
- `ProductVariant`: variante específica con SKU, opciones y stock por variante.
- `ProductImage`: imágenes adicionales del producto.
- `InventoryMovement`: historial de cambios de stock.

## Reglas de negocio

- Solo los usuarios con rol `PROVIDER` o `ADMIN` pueden crear o editar productos.
- Los usuarios no autenticados solo pueden ver productos publicados.
- La búsqueda soporta filtro por texto, categoría, rango de precios y ordenación.
- El stock se valida antes de operaciones de compra o ajuste administrativo.

## Endpoints relevantes

- `GET /api/products/`
- `GET /api/products/by-handle/<handle>/`
- `POST /api/products/`
- `PATCH /api/products/<id>/`
- `DELETE /api/products/<id>/`
- `POST /api/products/<id>/adjust_stock/`
- `GET /api/products/export_inventory/`

## Casos de uso

### Búsqueda y catálogo

- Un cliente visita la página de productos y ve una lista paginada.
- Puede filtrar por búsqueda libre, tipo de producto y precio.
- El frontend muestra variantes e imágenes cuando están disponibles.

### Gestión interna

- Un proveedor o administrador crea un producto nuevo con título, descripción, SKU y precio base.
- Puede ajustar stock desde la operación administrativa.
- El sistema registra cada movimiento de inventario y conserva trazabilidad.

## Riesgos y mejoras pendientes

- Validación más estricta de campos en CSV o importación masiva.
- Mejoras en manejo de imágenes y carga masiva.
- Mejor UX para comparar variantes en la interfaz.
- Mayor control de estado de publicación y stock por variante.
