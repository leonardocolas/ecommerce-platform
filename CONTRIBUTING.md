# Guía de contribución

## Cómo colaborar

1. Crea una rama descriptiva para el cambio.
2. Mantén los cambios pequeños y específicos.
3. Actualiza la documentación y, si aplica, `CHANGELOG.md`.
4. Ejecuta validación relevante antes de abrir una PR.

## Reglas del proyecto

- No introducir cambios de arquitectura sin documentación previa.
- Mantener consistencia entre frontend, backend y modelos.
- Revisar permisos, stock y flujo de pago antes de tocar módulos críticos.
- Usar nombres claros en variables, funciones y endpoints.

## Validación mínima

```bash
npm run lint
npm run build
cd backend
python manage.py test
```

## PRs

Incluye:

- descripción del problema resuelto;
- alcance del cambio;
- pruebas o validación ejecutada;
- notas de impacto sobre API, UX y negocio.
