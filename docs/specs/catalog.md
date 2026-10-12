# SPEC-01: Catálogo y búsqueda

## Objetivo

Permitir a los usuarios navegar por el catálogo de productos, aplicar filtros y ver detalles del producto antes de comprar.

## Actores

- Cliente no autenticado
- Cliente autenticado
- Proveedor
- Administrador

## Flujo principal

1. El usuario entra a la vista de productos.
2. El sistema obtiene la lista según permisos y visibilidad.
3. El usuario aplica búsqueda, categoría y filtros de precio.
4. El cliente selecciona un producto y accede al detalle.
5. El sistema muestra información de producto, imágenes y variantes.

## Casos de error

- Producto inexistente en ruta por handle.
- Filtros con precio inválido o vacío.
- Producto sin variante disponible o sin imagen.

## Criterios de aceptación

- La API devuelve productos publicados para usuarios públicos.
- Los roles `PROVIDER` y `ADMIN` pueden ver productos no publicados.
- El listado responde con paginación y orden por fecha de actualización por defecto.
- El detalle de producto se puede abrir por handle.

## Dependencias

- backend/products
- frontend/features/products
- routing de app
