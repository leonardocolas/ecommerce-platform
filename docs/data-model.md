# Modelo de datos

## Entidades principales

### User

Representa usuarios del sistema con roles:

- `USER`
- `PROVIDER`
- `STAFF`
- `ADMIN`

Campos relevantes:

- `username`
- `email`
- `role`
- `profile_image`

### Product

Modelo base del catálogo.

Campos clave:

- `handle`
- `title`
- `body_html`
- `vendor`
- `product_type`
- `tags`
- `published`
- `variant_price`
- `variant_inventory_qty`
- `image_src`
- `provider`

### ProductVariant

Cada variante añade una combinación específica de atributos y stock.

Campos relevantes:

- `product`
- `sku`
- `option1_name`, `option1_value`, etc.
- `price`
- `inventory_qty`
- `image`
- `is_active`

### ProductImage

Relación para imágenes adicionales del producto.

### InventoryMovement

Registra cambios de stock y su motivo.

### Cart / CartItem

Sirve para persistir el carrito de compra para usuarios autenticados o anónimos.

### Order

Representa la compra final.

Campos clave:

- `user`
- `status`
- `total`, `subtotal`, `discount_amount`
- `customer_name`, `customer_email`
- `shipping_address`, `shipping_city`, `shipping_state`
- `shipping_postal_code`, `shipping_country`
- `shipping_carrier`, `tracking_number`
- `payment_due_at`, `payment_confirmed_at`
- `invoice_number`

### OrderItem

Líneas de pedido snapshot de producto, precio, imagen y opciones.

### OrderAudit

Registro de cambios y decisiones sobre el pedido.

### Payment

Se usa para registrar el resultado del pago o confirmación manual.

### Coupon

Modelado de descuentos promocionales con condiciones de uso.

### Banner

Contenido promocional para secciones del storefront.

## Relaciones relevantes

- Un `User` puede tener varias `SavedAddress`.
- Un `Product` tiene varias `ProductVariant` y `ProductImage`.
- Una `Order` tiene varios `OrderItem` y varios `OrderAudit`.
- Un `Cart` contiene varios `CartItem`.
- Un `Payment` está relacionado con una `Order`.

## Consideraciones de integridad

- El stock se valora en el modelo de producto y variantes.
- Las órdenes conservan snapshots para no depender del estado del producto después de la compra.
- La auditoría de pedidos ayuda a trazabilidad y soporte operativo.
