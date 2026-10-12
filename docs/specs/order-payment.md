# SPEC-03: Pedidos y pagos

## Objetivo

Gestionar la evolución del pedido desde la compra hasta la entrega, incluyendo proforma, pago por transferencia y confirmación del pago.

## Actores

- Cliente
- Administrador
- Staff operativo

## Flujo principal

1. El cliente genera la orden.
2. La aplicación calculan totales, descuento y fecha de pago.
3. El cliente descarga la proforma PDF.
4. El usuario confirma transferencia y el equipo admin revisa la operación.
5. El pago se confirma y la orden avanza a `PAID`.
6. El estado puede continuar a `PROCESSING` o `SHIPPED` según la logística.

## Casos de error

- Intento de confirmar pago sobre una orden que no está pendiente.
- Estado inválido para transición de orden.
- Motivo de cancelación faltante al cancelar un pedido.

## Criterios de aceptación

- El pedido no puede pasar a estados no permitidos por la máquina de estados.
- La confirmación de pago genera registro de auditoría.
- La proforma incluye datos de banco, cliente y conceptuales del pedido.
- La cancelación y el envío quedan documentados en el historial del pedido.

## Dependencias

- backend/orders
- backend/payments
- backend/dashboard
- frontend/features/orders
