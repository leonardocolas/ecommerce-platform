# AGENTS.md del frontend

## Objetivo

Mantener la UI consistente, legible y alineada con el negocio de la tienda.

## Reglas

- Usar `features/` para organizar páginas y lógica por dominio.
- Mantener componentes pequeños y reutilizables.
- Evitar lógica de negocio duplicada dentro de componentes.
- Validar rutas protegidas frente a permisos del usuario.
- Revisar el impacto visual de cambios sobre catálogo, carrito y panel admin.

## Patrón recomendado

- `app/` para enrutado
- `features/` para vistas por dominio
- `components/` para elementos compartidos
- `hooks/` para lógica reutilizable
- `lib/` para utilidades

## Checklist antes de cerrar un cambio

- la pantalla funciona en el flujo principal;
- no rompe navegación ni autenticación;
- el diseño sigue la guía visual del proyecto;
- no hay errores de linting ni de render.
