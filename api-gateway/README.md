## API Gateway (SportData)
Punto de entrada unico para el frontend web y para clientes externos. Expone la API agregada bajo `/api`, valida JWT y enruta hacia los microservicios de usuarios, productos y pedidos.

### Requisitos
- Node.js 18 o superior.
- Servicios de usuarios, productos y pedidos accesibles (en Docker los nombres de host ya coinciden).

### Configuracion rapida
```bash
cd api-gateway
cp .env.example .env
npm install
```
Variables principales:
- `PORT` (por defecto 5000)
- `USER_SERVICE_URL` (p. ej. http://user-service:4001/api)
- `PRODUCT_SERVICE_URL` (p. ej. http://product-service:8002)
- `ORDER_SERVICE_URL` (p. ej. http://orders-service:7000)
- `JWT_SECRET` (debe ser el mismo que usa usuarios y pedidos)

### Ejecucion
```bash
npm run dev    # recarga automatica
# o
npm start
```
Endpoint de salud: `GET /health`. La API publica queda en `http://localhost:5000/api`.

### Uso con Docker
Se construye automaticamente con `docker compose up --build -d` desde la raiz. El `docker-compose.yml` ya inyecta todas las variables y conecta con los servicios internos.

### Rutas destacadas
- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/users/me`, `PUT /api/users/me`
- `GET /api/products`, `GET /api/products/:id`
- `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId`, `DELETE /api/cart/items/:productId`
- `POST /api/orders/checkout`

El frontend (`web/`) usa `fetch` contra este gateway. En despliegues externos ajusta `API_BASE_URL` si el dominio cambia.
