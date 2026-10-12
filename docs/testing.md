# Testing

## Objetivo

Establecer una estrategia mínima para validar cambios en frontend, backend y flujos de negocio críticos.

## Cobertura recomendada

### Backend

- tests de autenticación
- tests de permisos por rol
- tests de carrito y stock
- tests de creación y estado de pedidos
- tests de confirmación de pago
- tests de exportación y proforma

### Frontend

- navegación por rutas protegidas
- render de páginas principales
- validaciones y formularios
- integración con autenticación y carrito

## Comandos

### Django

```bash
cd backend
python manage.py test
```

### Frontend

```bash
npm run test
npm run lint
npm run build
```

### CI recomendado

La integración continua debe ejecutar en cada PR:

- `npm run lint`
- `npm run test`
- `npm run build`
- `cd backend && python manage.py test`

## Recomendaciones

- Añadir tests para cada regla de negocio nueva.
- Cubrir casos de `stock insuficiente`, `orden cancelada` y `pago confirmado`.
- Validar que las rutas administrativas no estén accesibles para usuarios no autorizados.
- Mantener fixtures simples y reproducibles.

## Buenas prácticas

- No depender de datos de entorno locales para pruebas automatizadas.
- Preferir assertions claras sobre estado, respuesta HTTP y permisos.
- Mantener tests pequeños y dirigidos a una única regla funcional.
