# Microservicio de Pedidos (Node.js + Express + MongoDB)

Servicio de carrito, favoritos, checkout y analitica de pedidos para SportData. Consulta el microservicio de productos para validar disponibilidad y precio en tiempo de compra.

## Requisitos

- Node.js 18+
- MongoDB 6+

## Configuracion

```bash
cd microservicioPedidos
npm install
```

Este servicio no incluye `.env.example`. Variables recomendadas:

- `PORT=7000`
- `ORDERS_MONGO_URI=mongodb://localhost:27019/sportdata_orders`
- `PRODUCT_SERVICE_URL=http://localhost:8002`
- `JWT_SECRET=<mismo valor que gateway y usuarios>`
- `MAIL_USER=`
- `MAIL_APP_PASSWORD=`
- `MAIL_FROM=`

## Ejecucion

```bash
npm run dev
# o
npm start
```

- Base URL: `http://localhost:7000`
- Health check: `GET /health`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d orders-service
```

Levanta tambien `orders-db` y conecta con `product-service`.

## Seed de pedidos

Genera pedidos de prueba combinando usuarios existentes y productos disponibles:

```bash
npm run seed:orders -- --clear
```

Opciones:

- `--clear`: borra pedidos antes de insertar
- `--repeat <n>`: repite el cruce usuario x producto (`1` por defecto)
- `--dry-run`: calcula volumen sin insertar

Variables usadas por el script:

- `ORDERS_MONGO_URI` (default `mongodb://127.0.0.1:27019/sportdata_orders`)
- `USERS_MONGO_URI` (si no existe, usa `MONGO_URI` o `mongodb://127.0.0.1:27018/sportdata_usuarios`)
- `SEED_PRODUCT_SERVICE_URL` (default `http://127.0.0.1:8002`)

## Endpoints

Metodo | Ruta | Notas
--- | --- | ---
GET | `/cart` | Carrito del usuario (JWT)
POST | `/cart/items` | Agrega producto al carrito (JWT)
PATCH | `/cart/items/:productId` | Cambia cantidad (JWT)
DELETE | `/cart/items/:productId` | Elimina item del carrito (JWT)
GET | `/favorites` | Lista favoritos (JWT)
POST | `/favorites/:productId` | Marca favorito (JWT)
DELETE | `/favorites/:productId` | Quita favorito (JWT)
GET | `/orders` | Lista pedidos del usuario (JWT)
POST | `/orders/checkout` | Crea pedido desde carrito (JWT)
GET | `/orders/admin/stats` | Estadisticas agregadas (JWT admin)

## Correo de confirmacion

Al hacer checkout, el servicio intenta enviar email a `shipping.email`.
Si SMTP no esta configurado, el pedido se crea igualmente y se registra la incidencia en logs.
