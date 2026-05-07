# API Gateway (SportData)

Punto de entrada unico para frontend y clientes externos. Expone la API agregada bajo `/api`, valida JWT y enruta peticiones a usuarios, productos y pedidos.

## Requisitos

- Node.js 18+
- Microservicios accesibles en red (`user-service`, `product-service`, `orders-service`)

## Configuracion

```bash
cd api-gateway
cp .env.example .env
npm install
```

Variables principales:

- `PORT` (por defecto `5000`)
- `USER_SERVICE_URL` (por defecto `http://localhost:4001/api`)
- `PRODUCT_SERVICE_URL` (por defecto `http://localhost:8002`)
- `ORDER_SERVICE_URL` (por defecto `http://localhost:7000`)
- `JWT_SECRET` (debe coincidir con usuarios y pedidos)
- `API_JSON_LIMIT` (opcional, por defecto `2gb`)
- `API_FORM_LIMIT` (opcional, por defecto `2gb`)

## Ejecucion

```bash
npm run dev
# o
npm start
```

- Health check: `GET /health`
- Base publica: `http://localhost:5000/api`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d api-gateway
```

## Rutas principales

Autenticacion:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

Usuarios:

- `GET /api/users/me` (JWT)
- `PUT /api/users/me` (JWT)
- `GET /api/users` (JWT admin)

Productos:

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` (JWT admin)
- `PUT /api/products/:id` (JWT admin)
- `PATCH /api/products/:id/stock` (JWT admin)
- `DELETE /api/products/:id` (JWT admin)

Pedidos, carrito y favoritos:

- `GET /api/cart` (JWT)
- `POST /api/cart/items` (JWT)
- `PATCH /api/cart/items/:productId` (JWT)
- `DELETE /api/cart/items/:productId` (JWT)
- `GET /api/favorites` (JWT)
- `POST /api/favorites/:productId` (JWT)
- `DELETE /api/favorites/:productId` (JWT)
- `GET /api/orders` (JWT)
- `POST /api/orders/checkout` (JWT)
- `GET /api/orders/admin/stats` (JWT admin)

## Notas

- El frontend en `web/` consume este gateway como backend unico.
- El gateway valida el JWT y reenvia el token a los microservicios cuando aplica.
