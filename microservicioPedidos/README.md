# Microservicio de Pedidos (Node.js + Express + MongoDB)
Gestiona carrito, favoritos y pedidos para SportData. Consume el microservicio de productos para validar disponibilidad y precios antes de crear el pedido.

## Requisitos
- Node.js >= 18
- MongoDB >= 6 (local o contenedor)

## Configuracion
```bash
cd microservicioPedidos
cp .env.example .env   # crea uno si no existe
npm install
```
Variables clave:
- `PORT` (default 7000)
- `ORDERS_MONGO_URI` (ej. `mongodb://localhost:27019/sportdata_orders`)
- `PRODUCT_SERVICE_URL` (ej. `http://localhost:8002`)
- `JWT_SECRET` (igual que gateway y usuarios)

## Ejecucion
```bash
npm run dev   # desarrollo con recarga
# o
npm start
```
Health check: `GET /health`.

## Con Docker
Se incluye en `docker-compose.yml`. Desde la raiz:
```bash
docker compose up --build -d orders-service
```
Levanta tambien `orders-db` (MongoDB) y se conecta al resto de servicios internos.

## Endpoints
Metodo | Ruta | Notas
--- | --- | ---
GET | `/cart` | Devuelve carrito del usuario (JWT)
POST | `/cart/items` | Agrega producto (JWT)
PATCH | `/cart/items/:productId` | Cambia cantidad (JWT)
DELETE | `/cart/items/:productId` | Elimina del carrito (JWT)
GET | `/favorites` | Lista favoritos (JWT)
POST | `/favorites/:productId` | Marca favorito (JWT)
DELETE | `/favorites/:productId` | Quita favorito (JWT)
POST | `/orders/checkout` | Crea pedido a partir del carrito, guarda datos de envio/pago (JWT)
GET | `/orders` | Lista pedidos del usuario (JWT)
