# API

## Base URL

- Backend local: `http://localhost:8000`
- Prefijo principal: `/api`

## Autenticación

El backend usa JWT con `rest_framework_simplejwt`.

### Endpoints de autenticación

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/profile/`
- `POST /api/auth/password-reset/`
- `POST /api/auth/password-reset/<uid>/<token>/`

## Productos

- `GET /api/products/` – catálogo paginado
- `GET /api/products/by-handle/<handle>/`
- `POST /api/products/` – crear producto (proveedor/admin)
- `PATCH /api/products/<id>/`
- `DELETE /api/products/<id>/`
- `POST /api/products/<id>/adjust_stock/`
- `GET /api/products/export_inventory/`

## Carrito

- `GET /api/cart/current/`
- `POST /api/cart/items/add`
- `PATCH /api/cart/items/<item_id>/`
- `DELETE /api/cart/items/<item_id>/`
- `POST /api/cart/merge/`
- `DELETE /api/cart/clear/`

## Pedidos

- `GET /api/orders/`
- `POST /api/orders/`
- `GET /api/orders/<id>/`
- `PATCH /api/orders/<id>/`
- `POST /api/orders/<id>/proforma/`
- `POST /api/orders/<id>/confirm_payment/`
- `POST /api/orders/<id>/refund/`
- `GET /api/orders/export/`

## Pagos

- `POST /api/payments/create/<order_id>/`
- `POST /api/payments/simulate/<transaction_id>/`
- `POST /api/payments/proof/<order_id>/`
- `POST /api/payments/proof/<order_id>/review/`
- `GET /api/payments/export/`

## Dashboard

- `GET /api/dashboard/stats/`
- `GET /api/dashboard/operations-config/`

## Notas de uso

- Los endpoints de administración requieren autenticación y permisos adecuados.
- El carrito anónimo usa `X-Session-Key` para no perder el contenido cuando el usuario inicia sesión.
- La API del backend devuelve respuestas JSON y usa paginación para listados de catálogo y pedidos.
