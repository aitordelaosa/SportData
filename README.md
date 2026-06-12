# SportData

SportData es una tienda web de material deportivo basada en microservicios. Permite navegar el catalogo, gestionar carrito y favoritos, completar compras y consultar pedidos.

La forma recomendada de ejecucion es Docker Compose desde la raiz del repositorio.

## Estructura

Carpeta | Funcion
--- | ---
`api-gateway` | API publica bajo `/api`; valida JWT y enruta a los servicios.
`microservicioUsuarios` | Registro, login, perfil y roles.
`microservicioProductos` | Catalogo, filtros, stock e imagenes.
`microservicioPedidos` | Carrito, favoritos, checkout y estadisticas.
`web` | Frontend estatico.
`static` | Imagenes compartidas por el servicio de productos.

## Arranque rapido

Requisitos:

- Docker y Docker Compose.
- Terminal abierta en la raiz del proyecto.

Opcionalmente crea un `.env` en la raiz:

```env
JWT_SECRET=super-clave-segura
MAIL_USER=tu_cuenta@gmail.com
MAIL_APP_PASSWORD=tu_app_password_de_gmail
MAIL_FROM=SportData <tu_cuenta@gmail.com>
```

Arranca todo:

```bash
docker compose up --build -d
docker compose ps
```

Abre la aplicacion:

- Frontend: `http://127.0.0.1:8080`
- API Gateway: `http://127.0.0.1:5000/api`
- Swagger Gateway: `http://127.0.0.1:5000/docs`
- Swagger Productos: `http://127.0.0.1:8002/docs`

## Servicios expuestos

Servicio | URL local
--- | ---
Frontend | `http://127.0.0.1:8080`
API Gateway | `http://127.0.0.1:5000/api`
Usuarios | `http://127.0.0.1:4001/api`
Productos | `http://127.0.0.1:8002/products`
Pedidos | `http://127.0.0.1:7000`
MongoDB usuarios | `mongodb://127.0.0.1:27018/sportdata_usuarios`
MongoDB pedidos | `mongodb://127.0.0.1:27019/sportdata_orders`
PostgreSQL productos | `postgres://sport4data:sport4data@127.0.0.1:5432/sport4data`

## Comandos Docker

```bash
docker compose stop
docker compose start
docker compose down
docker compose down -v
```

Para reconstruir un servicio concreto:

```bash
docker compose up --build -d api-gateway
docker compose up --build -d user-service
docker compose up --build -d product-service
docker compose up --build -d orders-service
```

## Desarrollo local

Usa este flujo solo si no quieres ejecutar todo con Docker Compose.

1. Levanta las bases de datos:

   ```bash
   docker run -d --name sportdata-users-db -p 27018:27017 mongo:6
   docker run -d --name sportdata-orders-db -p 27019:27017 mongo:6
   docker run -d --name sportdata-products-db -p 5432:5432 -e POSTGRES_USER=sport4data -e POSTGRES_PASSWORD=sport4data -e POSTGRES_DB=sport4data postgres:15
   ```

2. Prepara las variables locales que no tienen plantilla:

   `microservicioProductos/.env`

   ```env
   PRODUCTS_DATABASE_URL=postgresql+psycopg://sport4data:sport4data@localhost:5432/sport4data
   PRODUCTS_STATIC_DIR=../static
   PRODUCTS_STATIC_BASE_URL=http://127.0.0.1:8002/static
   ```

   `microservicioPedidos/.env`

   ```env
   PORT=7000
   ORDERS_MONGO_URI=mongodb://localhost:27019/sportdata_orders
   PRODUCT_SERVICE_URL=http://localhost:8002
   JWT_SECRET=cambia-esta-clave
   MAIL_USER=
   MAIL_APP_PASSWORD=
   MAIL_FROM=
   ```

3. Arranca cada servicio en una terminal:

   ```bash
   cd microservicioUsuarios
   cp .env.example .env
   npm install
   npm run dev
   ```

   ```bash
   cd microservicioProductos
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   .venv\Scripts\python -m uvicorn app.main:app --reload --port 8002
   ```

   ```bash
   cd microservicioPedidos
   npm install
   npm run dev
   ```

   ```bash
   cd api-gateway
   cp .env.example .env
   npm install
   npm run dev
   ```

4. Sirve el frontend:

   ```bash
   cd web
   python -m http.server 8080
   ```

En ejecucion manual, configura el mismo `JWT_SECRET` en usuarios, gateway y pedidos.

## Pruebas

Instala las dependencias de cada servicio antes de lanzar la suite global:

```bash
npm install
npm --prefix api-gateway install
npm --prefix microservicioUsuarios install
npm --prefix microservicioPedidos install
cd microservicioProductos
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-test.txt
cd ..
npm run test:coverage
```

El dashboard se genera en:

```text
coverage-report/index.html
```

Para publicar una copia estatica:

```bash
npm run coverage:publish
```

La copia queda en `docs/coverage/index.html`.
