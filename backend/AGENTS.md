# AGENTS.md del backend

## Objetivo

Mantener la API confiable, segura y alineada con la lógica de negocio.

## Reglas

- Preferir serializers, viewsets y permisos ya existentes.
- No introducir cambios en el modelo sin revisar impacto en inventario y pedidos.
- Cualquier cambio en estados de pedido o pago debe incluir auditoría.
- Validar permisos para admin, staff y usuarios normales.
- Proteger endpoints de exportación, stock y confirmación de pago.

## Áreas clave

- `users/` para autenticación y roles
- `products/` para catálogo, stock y exportación
- `orders/` para flujo de compra y proforma
- `payments/` para confirmación y revisión
- `dashboard/` para métricas operativas

## Checklist antes de cerrar un cambio

- la API responde con el código esperado;
- se revisan permisos y validaciones;
- no se rompe el flujo de compra ni el estado de la orden;
- el cambio queda documentado si afecta contratos o negocio.
