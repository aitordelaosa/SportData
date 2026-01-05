## SportData
 Web para explorar y comprar material deportivo. Se apoya en una arquitectura de microservicios conectados a traves de un API Gateway que expone tanto la interfaz HTML5 como la API (OpenAPI 3.0). El usuario puede navegar catalogo, gestionar carrito, tramitar pedidos, marcar favoritos y administrar cuentas.

### Estructura del proyecto
Carpeta | Descripcion
------- | -----------
api-gateway | Gateway Node.js que actua como proxy inverso hacia los microservicios y agrega la API publica bajo `/api`.
microservicioUsuarios | Backend Express + MongoDB para registro, login, perfil y roles.
microservicioProductos | FastAPI + PostgreSQL con el catalogo de productos y assets estaticos.
microservicioPedidos | Servicio Express + MongoDB que gestiona carrito, favoritos y pedidos.
web | Frontend estatico (HTML, CSS, JS) servido por Nginx a traves del gateway.

### Flujo recomendado: Docker Compose
1. Requisitos previos
   - Ten Docker y Docker Compose instalados.
   - Abre la aplicación Docker
   - Descarga o clona el repo y abre una terminal en la raiz.
   - Opcional: crea un `.env` en la raiz para compartir el secreto JWT:
     ```env
     JWT_SECRET=super-clave-segura
     ```
     Si no lo defines se usa `sportdata-dev-secret`.
2. Construye y levanta todos los servicios:
   ```bash
   docker compose up --build -d
   ```
3. Verifica que los contenedores estan arriba:
   ```bash
   docker compose ps
   ```
4. Accede al frontend en `http://localhost:8080/html/index.html` o `http://localhost:8080/html/cart.html`. El frontend consume siempre el gateway (`http://localhost:5000/api`).
5. Servicios que quedan levantados:
   - `mongo` y `orders-db`: bases MongoDB para usuarios y pedidos.
   - `products-db`: PostgreSQL con el catalogo.
   - `user-service`: Express (puerto 4001 interno).
   - `product-service`: FastAPI (puerto 8002 interno).
   - `orders-service`: Express pedidos/carrito (puerto 7000 interno).
   - `api-gateway`: expone `/api` en `http://localhost:5000`.
   - `frontend`: Nginx sirviendo `web` en `http://localhost:8080`.

### Flujo alternativo: Arranque manual (sin Docker)
1. Arranca las bases de datos (o usa instalaciones locales):
   - MongoDB usuarios: `docker run -p 27018:27017 mongo:6`
   - MongoDB pedidos: `docker run -p 27019:27017 mongo:6`
   - PostgreSQL productos: `docker run -p 5432:5432 -e POSTGRES_USER=sport4data -e POSTGRES_PASSWORD=sport4data -e POSTGRES_DB=sport4data postgres:15`
2. Prepara las variables de entorno copiando cada `.env.example` a `.env`. Valores minimos:
   - Raiz: `JWT_SECRET` (compartido).
   - microservicioUsuarios: `MONGO_URI`, `PORT`, `JWT_SECRET`.
   - microservicioProductos: `PRODUCTS_DATABASE_URL`, `PRODUCTS_STATIC_DIR`, `PRODUCTS_STATIC_BASE_URL`.
   - microservicioPedidos: `ORDERS_MONGO_URI`, `PRODUCT_SERVICE_URL`, `JWT_SECRET`.
   - api-gateway: `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL`, `PORT`, `JWT_SECRET`.
3. Inicia microservicio de usuarios (Node.js):
   ```bash
   cd microservicioUsuarios
   cp .env.example .env
   npm install
   npm run dev   # http://localhost:4001
   ```
4. Inicia microservicio de productos (Python/FastAPI):
   ```bash
   cd microservicioProductos
   python -m venv .venv && .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn app.main:app --reload --port 8002
   ```
5. Inicia microservicio de pedidos (Node.js):
   ```bash
   cd microservicioPedidos
   cp .env.example .env   # crea uno si no existe
   npm install
   npm run dev   # http://localhost:7000
   ```
6. Inicia el API Gateway (Node.js):
   ```bash
   cd api-gateway
   cp .env.example .env
   npm install
   npm run dev   # http://localhost:5000/api
   ```
7. Sirve el frontend estatico:
   ```bash
   cd web
   python -m http.server 8080
   ```

### Servicios expuestos
Servicio | URL/Conexion
-------- | ------------
Frontend | http://localhost:8080
API Gateway | http://localhost:5000/api
Usuarios | http://localhost:4001/api
Productos | http://localhost:8002/products (Swagger en `/docs`)
Pedidos | http://localhost:7000 (health en `/health`)
MongoDB usuarios | mongodb://localhost:27018/sportdata_usuarios
MongoDB pedidos | mongodb://localhost:27019/sportdata_orders
PostgreSQL productos | postgres://sport4data:sport4data@localhost:5432/sport4data

### Detener y limpiar
- Pausar: `docker compose stop`
- Reanudar: `docker compose start`
- Bajar todo: `docker compose down`
- Bajar y borrar datos (volumenes): `docker compose down -v`
