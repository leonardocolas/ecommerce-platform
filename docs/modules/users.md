# Módulo de usuarios y autenticación

## Objetivo

Administrar la identidad del cliente, los roles del sistema, la recuperación de contraseña y la gestión de direcciones guardadas.

## Roles principales

- `USER`: cliente estándar
- `PROVIDER`: proveedor o comercializador parcial del catálogo
- `STAFF`: personal operativo
- `ADMIN`: administración total

## Entidades principales

- `User`: modelo extendido de Django con roles y foto de perfil.
- `SavedAddress`: direcciones guardadas por el usuario.

## Endpoints relevantes

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/profile/`
- `PATCH /api/auth/profile/`
- `POST /api/auth/password-reset/`
- `POST /api/auth/password-reset/<uid>/<token>/`
- `GET /api/auth/admin/users/`
- `PATCH /api/auth/admin/users/<id>/change_role/`
- `PATCH /api/auth/admin/users/<id>/toggle_active/`

## Funcionamiento

- El registro crea un usuario con rol por defecto `USER`.
- El login emite access y refresh tokens JWT.
- El logout invalida el refresh token asociado.
- La recuperación de contraseña usa tokens temporales y envío por email.
- Las direcciones se gestionan desde perfil y pueden marcarse como predeterminadas.

## Reglas de negocio

- El usuario autenticado solo debería poder gestionar sus propias direcciones.
- Los cambios de rol y activación de usuarios están restringidos a personal con permisos de administración.
- El perfil debe proporcionar la información mínima para completar la compra.

## Riesgos y mejoras pendientes

- revisar validación de contraseñas según política de seguridad más estricta;
- añadir confirmación de email para alta de cuenta;
- permitir más variedad de datos de perfil y preferencias;
- mejorar UX de recuperación de contraseña y confirmación del cambio.
