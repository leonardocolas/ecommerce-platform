# Seguridad

## Controles ya presentes

### Autenticación y permisos

- El backend usa `rest_framework_simplejwt`.
- Se definen permisos por rol y por ownership para proteger acciones sensibles.
- Las rutas de administración requieren autenticación y nivel de permisos específico.

### CORS

- La configuración de CORS se activa con `DEBUG` y permite orígenes configurados en entorno.
- Se recomienda mantener una lista explícita de dominios en producción.

### Configuración sensible

- Las claves y secretos se leen desde variables de entorno.
- `SECRET_KEY` tiene un valor por defecto de desarrollo únicamente.
- La configuración de email, banca y URLs se externaliza.

### CSRF y middleware

- Django mantiene `CsrfViewMiddleware` activado en la API.
- La capa REST usa JWT para acceso autenticado, con contexto apropiado para clientes SPA.

## Riesgos y recomendaciones

### 1) Producción no lista

El proyecto está preparado para desarrollo pero no para despliegue sin revisión. Recomendaciones:

- cambiar `DJANGO_SECRET_KEY` en producción;
- desactivar `DEBUG`;
- usar HTTPS;
- forzar cookies/headers seguros si se usa sesión;
- limitar `ALLOWED_HOSTS`;
- configurar `DJANGO_ENV=production`, `DJANGO_ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` explícitos.

### 1.1) Hardening aplicado

- se valida `DJANGO_ENV` y se bloquea ejecución con `DEBUG=True` en producción;
- `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` y `SECURE_HSTS_*` se habilitan para producción;
- la fila de permisos administrativos separa `ADMIN` de `STAFF`/`PROVIDER` en rutas sensibles;
- se registran cambios de estado clave en pedidos y pagos para auditoría.

### 2) Validación y sanitización

- Se debe mantener validación fuerte en campos de entrada y payloads de pago.
- Los puntos de exportación y filtros deben evitar consultas no controladas y datos no validados.

### 3) Segregación de permisos

- Controlar con rigor acceso a endpoints de confirmación de pago, ajustes de inventario y exportación.
- Verificar que `PROVIDER`, `STAFF` y `ADMIN` no obtengan privilegios por defecto innecesarios.

### 4) Seguridad operativa

- Mantener logs de auditoría y de pagos.
- Proteger la consola de emails y configuraciones de staging.
- Revisa siempre la salida directa de `order.confirm_payment` y `adjust_stock`.

## checklist mínimo antes de producción

- `DEBUG=False`
- secretos reales y rotados
- HTTPS obligatorio
- CORS restringido
- backups y auditoría de base de datos
- validación de stock y pagos en producción
