# AGENTS.md

Este repositorio combina frontend y backend en un mismo proyecto. La intención es mantener un flujo claro de trabajo, documentación viva y decisiones explícitas antes de tocar funcionalidad crítica.

## Principios generales

- Mantener frontend y backend sincronizados cuando se cambien contratos, modelos o flujos de usuario.
- Documentar cambios funcionales importantes en `docs/` y en `CHANGELOG.md` cuando afecten al producto o a la operación.
- Priorizar cambios pequeños, comprensibles y alineados con la arquitectura actual.
- Antes de ampliar funcionalidad, revisar la estructura del código existente y reutilizar patrones ya usados.

## Estructura del proyecto

- `frontend/`: aplicación React + Vite + Tailwind.
- `backend/`: aplicación Django + Django REST Framework.
- `docs/`: requisitos, arquitectura, diseño, API, seguridad y testing.
- `.github/`: instrucciones para Copilot y automatizaciones.

## Reglas de colaboración

### Frontend

- Preferir componentes pequeños, reusables y con lógica encapsulada.
- Mantener nombres de archivos y rutas coherentes con `features/` y `app/`.
- No introducir librerías nuevas sin justificar la necesidad.
- Respetar el flujo de autenticación y rutas protegidas ya definido en el router.

### Backend

- Reutilizar `viewsets`, serializers y permisos existentes.
- Usar validación de entrada y manejo de errores con `Response` y `status` de DRF.
- Proteger acciones administrativas con permisos concretos.
- Respetar el modelo de inventario, reglas de stock y auditoría de pedidos.

### Documentación

- Actualizar el README y la documentación relevante cuando cambie: arquitectura, API, flujo de negocio o configuración.
- Mantener `docs/` como fuente de verdad operativa para funciones clave.

## Flujo recomendado

1. Revisar la documentación del área afectada.
2. Comprender el flujo de usuario y el modelo de datos.
3. Realizar cambios mínimos con validación.
4. Probar la ruta afectada y dejar la documentación sincronizada.

## Preguntas frecuentes

- ¿Qué pasa si necesito crear una nueva funcionalidad? Se recomienda primero documentarla en `docs/specs/` o `docs/tasks/`.
- ¿Debo tocar la API y la UI a la vez? Sí, cuando el cambio altere contratos de datos o comportamientos del usuario.
- ¿Cómo marco un cambio relevante? Con un resumen claro en `CHANGELOG.md` y, si procede, en `docs/decisions/`.

## Criterio de aceptación

Un cambio queda correcto cuando:

- cumple el requisito funcional;
- sigue el estilo y arquitectura del proyecto;
- queda documentado; y
- no rompe el flujo actual del usuario ni de la API.
