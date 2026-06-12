# API Gateway

Punto de entrada publico de SportData. Expone `/api`, valida JWT y reenvia peticiones a usuarios, productos y pedidos.

## Requisitos

- Node.js 18+
- Servicios de usuarios, productos y pedidos accesibles.

## Configuracion local

```bash
cd api-gateway
cp .env.example .env
npm install
```

Variables principales:

- `PORT` (`5000` por defecto)
- `USER_SERVICE_URL`
- `PRODUCT_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `JWT_SECRET` (igual que usuarios y pedidos)
- `API_JSON_LIMIT` y `API_FORM_LIMIT` (opcionales)

## Ejecucion

```bash
npm run dev
# o
npm start
```

Rutas utiles:

- API: `http://localhost:5000/api`
- Health: `GET /health`
- Swagger: `GET /docs`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d api-gateway
```

## Rutas principales

Grupo | Rutas
--- | ---
Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`
Usuarios | `GET /api/users/me`, `PUT /api/users/me`, `GET /api/users`
Productos | `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `PATCH /api/products/:id/stock`, `DELETE /api/products/:id`
Carrito | `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
Favoritos | `GET /api/favorites`, `POST /api/favorites/:productId`, `DELETE /api/favorites/:productId`
Pedidos | `GET /api/orders`, `POST /api/orders/checkout`, `GET /api/admin/stats`

Las rutas de escritura de productos, listado de usuarios y estadisticas requieren JWT de administrador.

## Tests

```bash
npm test
npm run test:coverage
```
