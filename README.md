# Ecommerce Platform

Frontend y backend viven en el mismo repo, pero el frontend ahora queda consolidado en un solo lugar:

- `frontend/`: aplicacion Vite + React + Tailwind.
- `frontend/src/`: codigo fuente real del cliente.
- `public/`: assets estaticos servidos por Vite.
- `backend/`: API y servicios de Django.

Comandos desde la raiz del proyecto:

- `npm run dev`
- `npm run build`
- `npm run lint`

## Transferencias y emails

El checkout genera una factura proforma pendiente de pago. Los datos bancarios y el correo transaccional se configuran en `backend/.env`:

```env
BANK_ACCOUNT_HOLDER=Tienda Demo S.L.
BANK_NAME=Banco Demo
BANK_IBAN=ESXX XXXX XXXX XXXX XXXX XXXX
DEFAULT_FROM_EMAIL=pedidos@example.com
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=pedidos@example.com
EMAIL_HOST_PASSWORD=tu-clave
EMAIL_USE_TLS=True
TAX_RATE=0.00
SHIPPING_FLAT_RATE=0.00
```

En desarrollo, si no se define `EMAIL_BACKEND`, Django muestra los emails en la consola. El cliente descarga la proforma desde el endpoint autenticado `/api/orders/<id>/proforma/`. El equipo administrativo confirma la transferencia desde la acción `confirm_payment`, añadiendo una nota opcional; posteriormente puede avanzar la orden a preparación y envío con transportista y tracking.
