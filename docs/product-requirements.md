# Requisitos del producto

## Visión

La plataforma pretende ofrecer una experiencia de compra moderna para una tienda online con catálogo, autenticación, gestión operativa y administración interna. El foco es operar de forma segura y clara tanto para clientes finales como para equipos internos.

## Usuarios principales

### Cliente

- Explora el catálogo y busca productos.
- Revisa información del producto, precio, disponibilidad y variantes.
- Añade artículos al carrito y continúa con el checkout.
- Compra mediante transferencia bancaria con proforma y confirmación administrativa.
- Consulta historial de pedidos y detalle del pedido.

### Administrador / staff

- Gestiona productos, inventario y precios.
- Revisa pedidos y confirma pagos.
- Envía pedidos a preparación y envío con transportista y tracking.
- Administra banners, cupones y usuarios.

## Requisitos funcionales

### Catálogo

- Mostrar productos publicados con paginación y filtros.
- Buscar por texto, categoría y rango de precios.
- Mostrar variantes y imágenes cuando existan.
- Permitir acceso ampliado a proveedores y administradores para gestionar contenido no publicado.

### Carrito

- Soportar carrito anónimo con `X-Session-Key`.
- Fusionar carrito anónimo con usuario autenticado.
- Validar stock antes de aumentar cantidades.
- Permitir actualizar cantidades y eliminar líneas.

### Autenticación

- Registro de usuarios.
- Login/logout con JWT.
- Recuperación de contraseña por email.
- Perfil de usuario con dirección guardada.

### Pedidos

- Crear órdenes a partir del carrito.
- Disponibilidad de subtotal, descuento, impuestos y total.
- Generar proforma PDF con datos de pago.
- Confirmación manual de pago por parte del equipo.
- Estados de pedido: `CREATED`, `AWAITING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `CANCELED`.

### Cobros y pagos

- Generar una orden en estado de espera de pago.
- Preparar comprobación de transferencia.
- Confirmar pago y registrar la operación para envío.
- Registrar auditoría y notificaciones por email.

### Administración

- Dashboard con métricas operativas.
- Gestión de productos y usuarios.
- Gestión de banners y cupones promocionales.
- Exportación de inventario y pedidos.

## Criterios de aceptación

### Catálogo

- Un cliente puede ver productos en la vista principal y navegar al detalle.
- Un usuario autenticado con rol proveedor o admin puede ver productos ocultos o no publicados.

### Pedido

- Una vez completado el checkout, la orden se crea con estado válido y total calculado.
- Si el pago no está confirmado, la orden queda en espera de pago.
- Si el administrador confirma la transferencia, la orden pasa a pagada y se genera el registro de pago.

### Seguridad

- Las rutas administrativas solo deben estar disponibles para usuarios autorizados.
- No deben exponerse operaciones sensibles sin autenticación.

## Prioridades

1. Catalogo + carrito + checkout
2. Gestión de pedidos y pagos
3. Panel administrativo + exportación
4. Mejoras de seguridad, trazabilidad y automatización
