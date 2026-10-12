# SPEC-02: Carrito y checkout

## Objetivo

Permitir que un usuario añada productos al carrito, valide stock, complete la compra y genere la orden asociada.

## Actores

- Cliente no autenticado
- Cliente autenticado
- Administrador

## Flujo principal

1. El usuario añade un producto al carrito.
2. El backend valida que exista stock suficiente.
3. El usuario modifica cantidades o elimina líneas.
4. El cliente inicia el checkout.
5. El backend crea la orden y calcula subtotal, descuento y total.
6. La orden queda en espera de pago.

## Casos de error

- Stock insuficiente.
- Carrito vacío al intentar comprar.
- Cupón inválido o ya no aplicable.
- Usuario sin completar perfil para compra.

## Criterios de aceptación

- Los usuarios anónimos y autenticados pueden gestionar el carrito.
- El carrito anónimo puede fusionarse con el carrito del usuario autenticado.
- La orden se crea con estado `AWAITING_PAYMENT` si la validación pasa.
- El sistema conserva snapshot del producto/pedido para evitar inconsistencias posteriores.

## Dependencias

- backend/cart
- backend/orders
- backend/coupons
- frontend/features/cart
