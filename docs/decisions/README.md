# Decisiones de arquitectura

Este directorio recoge decisiones relevantes del proyecto para mantener la historia del diseño y facilitar cambios futuros.

## ADR iniciales

### 1. Monorepo con frontend y backend separados

Se mantiene una única raíz de repositorio para reducir fricción local de desarrollo y facilitar la coordinación entre cliente y API.

### 2. Django REST Framework como API backend

Se eligió DRF por su rapidez de desarrollo, permisos, serialización y compatibilidad con JWT.

### 3. React + Vite en frontend

Se prioriza un cliente moderno, ligero y rápido para e-commerce con routing y escalabilidad.

### 4. Pago por transferencia bancaria con confirmación manual

El flujo de negocio actual usa proforma y confirmación del equipo admin para controlar pagos fuera de la plataforma.

### 5. Roles para administración

Los roles `USER`, `PROVIDER`, `STAFF` y `ADMIN` se usan para controlar acceso a catálogo, gestión y operaciones.
