# Arquitectura

## Visión general

El proyecto está organizado en dos bloques principales bajo un único repositorio:

- `frontend/`: cliente web en React con Vite y Tailwind.
- `backend/`: API en Django con Django REST Framework.

La separación es clara, pero se mantienen dependencias funcionales porque el frontend consume la API del backend y el backend expone datos y operaciones de negocio.

## Frontend

### Stack

- React 19
- Vite
- Tailwind CSS
- React Router
- Zustand para estado global (si se usa)
- Recharts para métricas

### Estructura

```text
frontend/src/
├── app/
│   └── AppRouter.tsx
├── components/
├── features/
│   ├── admin/
│   ├── auth/
│   ├── cart/
│   ├── orders/
│   ├── payments/
│   ├── products/
│   ├── shop/
│   └── storefront/
├── hooks/
├── layout/
├── lib/
└── main.tsx
```

### Patrón principal

- El router central decide accesos: rutas públicas, autenticadas y administrativas.
- Los módulos bajo `features/` encapsulan páginas y lógica por dominio.
- La API se consume desde hooks y servicios del cliente.

## Backend

### Stack

- Django
- DRF
- SimpleJWT
- PostgreSQL por defecto
- SQLite para desarrollo local

### Apps principales

```text
backend/
├── cart/
├── coupons/
├── dashboard/
├── orders/
├── payments/
├── products/
├── users/
├── config/
└── core/
```

### Organización

Cada app se encarga de un ámbito funcional:

- `users`: autenticación, perfiles, direcciones y roles.
- `products`: catálogo, variantes, imágenes, inventario y exportación.
- `orders`: órdenes, estados, proforma, auditoría y cancelaciones.
- `payments`: pagos, resúmenes y revisión de comprobantes.
- `cart`: carrito y merge de sesión.
- `coupons`: cupones y descuentos.
- `banners`: contenido promocional.
- `dashboard`: métricas y configuración operativa.

## Flujos principales

### Flujo de compra

1. Cliente navega por catálogo.
2. Añade productos a su carrito.
3. El backend valida stock y calcula totales.
4. Se crea la orden y queda pendiente de pago.
5. El cliente descarga la proforma y realiza transferencia.
6. El administrador confirma el pago.
7. La orden se actualiza y puede pasar a preparación y envío.

### Flujo de autenticación

1. El cliente registra o inicia sesión.
2. El backend devuelve JWT.
3. El frontend guarda el token y usa rutas protegidas.
4. El backend valida permisos con permisos personalizados.

## Despliegue y entorno

- Frontend se ejecuta con Vite en puerto 5173.
- Backend se ejecuta con Django en puerto 8000.
- El middleware de CORS está configurado para `localhost` en desarrollo.
- La configuración sensible se extrae de variables de entorno.

## Decisiones de diseño arquitectónico

- Un mismo repositorio para frontend y backend reduce fricción de integración local.
- El backend ofrece una API REST estable para separación de responsabilidades.
- Los permisos están gestionados a nivel de modelo y endpoint, con decisiones centralizadas por app.
- El modelo de inventario y auditoría de pedidos es clave para trazabilidad.
