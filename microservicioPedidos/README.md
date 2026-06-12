# Microservicio de Pedidos

Servicio de carrito, favoritos, checkout y estadisticas de pedidos. Consulta productos para validar disponibilidad y precio al comprar.

## Requisitos

- Node.js 18+
- MongoDB 6+
- Microservicio de productos accesible.

## Configuracion local

```bash
cd microservicioPedidos
npm install
```

Este servicio no incluye `.env.example`. Para ejecucion local, crea un `.env`:

```env
PORT=7000
ORDERS_MONGO_URI=mongodb://localhost:27019/sportdata_orders
PRODUCT_SERVICE_URL=http://localhost:8002
JWT_SECRET=super-clave-segura
MAIL_USER=
MAIL_APP_PASSWORD=
MAIL_FROM=
```

`JWT_SECRET` debe coincidir con usuarios y gateway.

## Ejecucion

```bash
npm run dev
# o
npm start
```

Rutas utiles:

- API: `http://localhost:7000`
- Health: `GET /health`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d orders-service
```

## Endpoints

Metodo | Ruta | Uso
--- | --- | ---
GET | `/cart` | Ver carrito
POST | `/cart/items` | Agregar producto al carrito
PATCH | `/cart/items/:productId` | Cambiar cantidad
DELETE | `/cart/items/:productId` | Eliminar producto del carrito
GET | `/favorites` | Ver favoritos
POST | `/favorites/:productId` | Marcar favorito
DELETE | `/favorites/:productId` | Quitar favorito
GET | `/orders` | Ver pedidos del usuario
POST | `/orders/checkout` | Crear pedido desde el carrito
GET | `/orders/admin/stats` | Ver estadisticas (admin)

Todas las rutas anteriores requieren JWT.

## Seed

```bash
npm run seed:orders -- --clear
```

Opciones: `--clear`, `--repeat <n>`, `--dry-run`.

## Tests

```bash
npm test
npm run test:coverage
```
