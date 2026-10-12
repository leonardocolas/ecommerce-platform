# SPEC-04: Administración y dashboard

## Objetivo

Proporcionar a staff y admins información operativa y herramientas para gestionar tienda, usuarios y pedidos.

## Actores

- Administrador
- Staff
- Proveedor

## Flujo principal

1. El admin entra al panel.
2. El sistema muestra KPIs, estadísticas por fecha y productos más vendidos.
3. El usuario revisa pedidos, clientes y stock.
4. Puede ajustar roles, estado de usuarios y operaciones comerciales.

## Casos de error

- usuario sin permisos intenta acceder al panel;
- rol inválido al realizar cambio;
- petición de exportación sin permisos apropiados.

## Criterios de aceptación

- El dashboard requiere autenticación y permisos de administración.
- Las métricas se calculan por período.
- Los cambios de estado o rol quedan registrados.
- Las operaciones administrativas son trazables.

## Dependencias

- backend/dashboard
- backend/users
- backend/orders
- frontend/features/admin
