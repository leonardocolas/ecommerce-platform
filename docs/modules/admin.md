# Módulo administrativo

## Objetivo

Dar acceso a operaciones internas de la tienda: gestión de usuarios, revisión de pedidos, dashboard, configuración operacional y campañas promocionales.

## Funcionalidades actuales

- Dashboard con KPIs y métricas por período.
- Gestión de usuarios con filtro por rol y estado.
- Gestión de pedidos con estados, cancelación y envío.
- Gestión de banners, cupones y productos.
- Exportación de inventario y pedidos.

## Endpoints relevantes

- `GET /api/dashboard/stats/`
- `GET /api/dashboard/operations-config/`
- `GET /api/products/export_inventory/`
- `GET /api/orders/export/`
- `GET /api/auth/admin/users/`
- `PATCH /api/auth/admin/users/<id>/toggle_active/`
- `PATCH /api/auth/admin/users/<id>/change_role/`

## Reglas de negocio

- El acceso es restringido a usuarios con rol `ADMIN` o `STAFF`.
- Las operaciones de estado de pedido deben registrarse en auditoría.
- Los cambios de inventario deben quedar documentados con motivo y referencia.
- La operación de confirmación de pago debe registrar quién lo aprobó y cuándo.

## Comportamiento esperado

- El panel administrativo muestra ingresos, pedidos, usuarios y productos activos.
- La vista puede filtrar por período temporal (`today`, `7d`, `30d`, `90d`).
- Las operaciones comerciales se exponen con trazabilidad.

## Mejoras recomendadas

- dashboard más rico con comparativas e indicadores por canal;
- gestión de finanzas y pagos con historial más completo;
- flujo de aprobación de descuentos y promociones;
- roles más granulares por módulo y permisos.
