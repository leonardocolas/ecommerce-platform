# Ecommerce Platform

Plataforma de comercio electrónico con frontend React y backend Django, pensada para una tienda online con catálogo, carrito, autenticación, checkout con transferencia bancaria, gestión de pedidos y panel administrativo.

## Resumen ejecutivo

- Frontend: React 19 + Vite + Tailwind CSS
- Backend: Django + Django REST Framework + JWT
- Base de datos: PostgreSQL por defecto, con SQLite local para desarrollo rápido
- Arquitectura: monorepo con frontend y backend separados en carpetas del mismo repositorio
- Funcionalidades clave: catálogo de productos, detalle de producto, carrito anónimo/usuario, checkout, pagos por transferencia, historial de pedidos y panel administrativo

## Estructura principal

```text
.
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── docs/
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── design.md
│   ├── data-model.md
│   ├── api.md
│   ├── security.md
│   ├── testing.md
│   ├── decisions/
│   ├── specs/
│   └── tasks/
├── frontend/
│   ├── src/
│   └── AGENTS.md
├── backend/
│   ├── apps/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   ├── cart/
│   ├── users/
│   └── AGENTS.md
├── .github/
│   └── copilot-instructions.md
├── instructions/
├── prompts/
├── agents/
├── .agents/skills/
└── package.json
```

## Requisitos de ejecución

### Requisitos mínimos

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+ (recomendado para producción)
- Git

### Variables de entorno

El backend usa `backend/.env` para configuración local. Un ejemplo útil aparece en `backend/.env.example`.

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DJANGO_SECRET_KEY=tu-secret-key
DJANGO_DEBUG=True
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
BANK_ACCOUNT_HOLDER=Tienda Demo S.L.
BANK_NAME=Banco Demo
BANK_IBAN=ESXX XXXX XXXX XXXX XXXX XXXX
DEFAULT_FROM_EMAIL=pedidos@example.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=pedidos@example.com
EMAIL_HOST_PASSWORD=tu-clave
EMAIL_USE_TLS=True
TAX_RATE=0.00
SHIPPING_FLAT_RATE=0.00
```

## Puesta en marcha

### 1) Instalar dependencias del frontend

```bash
npm install
```

### 2) Preparar el backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

### 3) Ejecutar la app en desarrollo

Desde la raíz:

```bash
npm run dev
```

Esto inicia simultáneamente:

- Frontend Vite en `http://localhost:5173`
- Backend Django en `http://localhost:8000`

## Scripts disponibles

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run preview
npm run lint
```

## Funcionalidades actuales

### Frontend

- Catálogo y búsqueda de productos
- Página de detalle del producto
- Carrito para usuarios anónimos y autenticados
- Login, registro, recuperación de contraseña y perfil
- Historial y detalle de pedidos
- Panel administrativo para productos, usuarios, pedidos, banners y cupones

### Backend

- API REST con JWT para autenticación
- Modelado de productos, variantes, imágenes e inventario
- Carrito, cupones y cupones aplicados
- Ordenes con estados: created, awaiting payment, paid, processing, shipped, canceled
- Generación de proforma PDF y confirmación manual de pago
- Dashboard con estadísticas operativas y configuración

## Documentación del proyecto

- [docs/product-requirements.md](docs/product-requirements.md): requisitos funcionales y usuario
- [docs/architecture.md](docs/architecture.md): vistas de arquitectura y flujos de datos
- [docs/design.md](docs/design.md): guía de diseño e interfaces
- [docs/data-model.md](docs/data-model.md): modelo de datos y entidades principales
- [docs/api.md](docs/api.md): API del backend
- [docs/security.md](docs/security.md): controles y recomendaciones de seguridad
- [docs/testing.md](docs/testing.md): estrategia y ejecución de tests

## Notas de negocio

El checkout genera una factura proforma pendiente de pago. Los datos bancarios y el correo de notificaciones se configurarán desde las variables de entorno del backend. El cliente puede descargar la proforma desde el endpoint autenticado `/api/orders/<id>/proforma/`. El equipo administrativo confirma la transferencia desde la acción `confirm_payment`, con nota opcional; luego puede avanzar la orden a preparación y envío con transportista y tracking.

## Estado de proyecto

El repositorio ya incluye una implementación funcional del catálogo, carrito, autenticación y administración. La documentación aquí creada busca servir como base para continuar el desarrollo, mantener consistencia entre frontend y backend, y facilitar la colaboración en equipo.
