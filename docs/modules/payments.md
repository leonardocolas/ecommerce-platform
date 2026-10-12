# Módulo de pagos y cobros

## Objetivo

Gestionar el flujo de cobro para una compra con pago por transferencia bancaria, desde la creación de la proforma hasta la confirmación del pago por parte del administrador.

## Entidades principales

- `Order`: orden comercial con estado, totales y datos de entrega.
- `Payment`: registro del intento o confirmación del pago.
- `OrderAudit`: trazabilidad del flujo de estado de la orden.

## Reglas de negocio

- La orden se crea con estado `AWAITING_PAYMENT`.
- Se genera una proforma PDF con datos bancarios y referencia de pedido.
- El administrador confirma la transferencia desde `confirm_payment`.
- Solo se permite avanzar de estado a través del flujo validado en el serializer.
- El sistema asegura auditoría del evento de confirmación.

## Endpoints relevantes

- `POST /api/payments/create/<order_id>/`
- `POST /api/payments/simulate/<transaction_id>/`
- `POST /api/payments/proof/<order_id>/`
- `POST /api/payments/proof/<order_id>/review/`
- `GET /api/payments/export/`
- `POST /api/orders/<id>/proforma/`
- `POST /api/orders/<id>/confirm_payment/`

## Flujo principal

1. El cliente completa el carrito y genera la compra.
2. El backend crea la orden con datos de entrega y totales.
3. El cliente descarga la proforma o factura de pago.
4. El admin revisa la transferencia y confirma el pago.
5. La orden pasa a `PAID` y se registra la confirmación.
6. La preparación y envío pueden continuar si el flujo de logística lo permite.

## Consideraciones importantes

- El flujo actual está orientado a pagos manuales, no a pasarelas automáticas.
- La confirmación manual requiere trazabilidad más que automatización de cobro.
- La seguridad del flujo depende de permisos y validaciones del backend.

## Mejoras recomendadas

- soporte a comprobantes múltiples por pedido;
- revisión gráfica de justificantes con carga de imagen;
- historial de pagos con evidencias visibles;
- integración con pasarela real en un segundo paso.
