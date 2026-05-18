# SportData

Plataforma web para explorar y comprar material deportivo. El sistema esta terminado y funciona sobre una arquitectura de microservicios conectados por un API Gateway. Desde el frontend se puede navegar catalogo, gestionar carrito, marcar favoritos, completar checkout y consultar pedidos.

## Arquitectura

Carpeta | Descripcion
--- | ---
`api-gateway` | Gateway Node.js que agrega la API publica bajo `/api` y enruta peticiones a usuarios, productos y pedidos.
`microservicioUsuarios` | Express + MongoDB para registro, login, perfil y gestion de roles.
`microservicioProductos` | FastAPI + PostgreSQL para catalogo, filtros, stock y recursos estaticos.
`microservicioPedidos` | Express + MongoDB para carrito, favoritos, checkout y estadisticas de pedidos.
`web` | Frontend estatico (HTML/CSS/JS).
`static` | Imagenes y assets de productos.

## Flujo recomendado (Docker Compose)

1. Requisitos:
   - Docker y Docker Compose.
   - Terminal en la raiz del repositorio.
2. Crea opcionalmente un `.env` en la raiz:
   ```env
   JWT_SECRET=super-clave-segura
   MAIL_USER=tu_cuenta@gmail.com
   MAIL_APP_PASSWORD=tu_app_password_de_gmail
   MAIL_FROM=SportData <tu_cuenta@gmail.com>
   ```
   Si `JWT_SECRET` no se define, se usa `sportdata-dev-secret`.
3. Construye y levanta todo:
   ```bash
   docker compose up --build -d
   ```
4. Verifica estado:
   ```bash
   docker compose ps
   ```
5. Abre el frontend:
   - `http://127.0.0.1:8080`
   - `http://127.0.0.1:8080/html/cart.html`

## Arranque manual (sin Docker)

1. Arranca las bases de datos:
   - MongoDB usuarios: `docker run -p 27018:27017 mongo:6`
   - MongoDB pedidos: `docker run -p 27019:27017 mongo:6`
   - PostgreSQL productos:
     `docker run -p 5432:5432 -e POSTGRES_USER=sport4data -e POSTGRES_PASSWORD=sport4data -e POSTGRES_DB=sport4data postgres:15`
2. Usuarios:
   ```bash
   cd microservicioUsuarios
   cp .env.example .env
   npm install
   npm run dev
   ```
3. Productos:
   ```bash
   cd microservicioProductos
   python -m venv .venv && .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   uvicorn app.main:app --reload --port 8002
   ```
4. Pedidos (este servicio no incluye `.env.example`):
   ```bash
   cd microservicioPedidos
   npm install
   npm run dev
   ```
   Variables minimas recomendadas:
   - `PORT=7000`
   - `ORDERS_MONGO_URI=mongodb://localhost:27019/sportdata_orders`
   - `PRODUCT_SERVICE_URL=http://localhost:8002`
   - `JWT_SECRET=<mismo valor que usuarios y gateway>`
5. API Gateway:
   ```bash
   cd api-gateway
   cp .env.example .env
   npm install
   npm run dev
   ```
6. Frontend estatico:
   ```bash
   cd web
   python -m http.server 8080
   ```

## Servicios expuestos

Servicio | URL / Conexion
--- | ---
Frontend | `http://127.0.0.1:8080`
API Gateway (base API) | `http://127.0.0.1:5000/api`
Swagger Gateway | `http://127.0.0.1:5000/docs`
Usuarios | `http://127.0.0.1:4001/api` (`/api/health` y `/health` para salud)
Productos (base API) | `http://127.0.0.1:8002/products`
Swagger Productos | `http://127.0.0.1:8002/docs`
Pedidos | `http://127.0.0.1:7000` (`/health` para salud)
MongoDB usuarios | `mongodb://127.0.0.1:27018/sportdata_usuarios`
MongoDB pedidos | `mongodb://127.0.0.1:27019/sportdata_orders`
PostgreSQL productos | `postgres://sport4data:sport4data@127.0.0.1:5432/sport4data`

## Comandos utiles

- Parar servicios: `docker compose stop`
- Reanudar servicios: `docker compose start`
- Bajar servicios: `docker compose down`
- Bajar y borrar volumenes: `docker compose down -v`

## Pruebas y cobertura

SportData incluye una suite automatizada de backend con cobertura por servicio y un dashboard HTML consolidado. La ejecucion principal se lanza desde la raiz:

```bash
npm run test:coverage
```

El informe visual unificado se genera en:

```text
coverage-report/index.html
```

Resumen de la ultima ejecucion validada:

Servicio | Statements | Branches | Functions | Lines
--- | ---: | ---: | ---: | ---:
`api-gateway` | 83.39% | 59.70% | 92.45% | 83.39%
`microservicioUsuarios` | 72.10% | 41.02% | 78.26% | 72.46%
`microservicioProductos` | 73.90% | 41.89% | N/A | 68.00%
`microservicioPedidos` | 71.04% | 48.79% | 65.71% | 72.40%
**GLOBAL backend** | **74.96%** | **47.17%** | **80.60%** | **75.38%**

> En Python, `coverage.py` no expone cobertura de funciones; por eso `microservicioProductos` aparece como `N/A` en esa columna. El calculo global de funciones se hace con los servicios Node.js.

Instalacion de dependencias de test:

```bash
npm install

cd api-gateway
npm install

cd ../microservicioUsuarios
npm install

cd ../microservicioPedidos
npm install

cd ../microservicioProductos
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-test.txt
```

En Linux/macOS, usa `.venv/bin/python -m pip install -r requirements-test.txt` para el servicio de productos. Si quieres usar otro interprete Python, define `PYTHON` antes de ejecutar la cobertura global.

Comandos utiles:

```bash
npm run test
npm run test:coverage
npm run coverage:summary
npm run coverage:open
npm run coverage:merge
npm run coverage:publish
```

Estructura generada:

```text
coverage-report/
  index.html
  summary.json
  services/
    api-gateway/
    microservicioUsuarios/
    microservicioProductos/
    microservicioPedidos/
```

Para que el informe sea accesible sin depender de una ruta local como `C:\Users\...`, genera una version publicable:

```bash
npm run test:coverage
npm run coverage:publish
```

Esto copia el dashboard a:

```text
docs/coverage/index.html
```

Esa carpeta se puede subir al repositorio y publicar con GitHub Pages:

1. Haz commit de `docs/`.
2. En GitHub, entra en `Settings > Pages`.
3. Selecciona `Deploy from a branch`.
4. Usa la rama `main` y la carpeta `/docs`.
5. La URL esperada sera:

```text
https://aitordelaosa.github.io/SportData/coverage/
```

Mientras Docker Compose este levantado, tambien puedes servir una copia estatica desde cualquier servidor web. La idea es que `coverage-report/` sea el resultado local de trabajo y `docs/coverage/` sea la version publicable para tribunal, tutor o companeros.

Estrategia usada:

- `api-gateway`: Jest + Supertest. Se mockean los clientes HTTP externos y se prueban health, 404, autenticacion, rutas de productos, usuarios y pedidos.
- `microservicioUsuarios`: Jest + Supertest + `mongodb-memory-server`. MongoDB se levanta en memoria y se limpian colecciones entre tests.
- `microservicioPedidos`: Jest + Supertest + `mongodb-memory-server`. MongoDB se levanta en memoria y las llamadas al servicio de productos/correo se mockean.
- `microservicioProductos`: pytest + FastAPI TestClient + coverage.py. La configuracion de test usa SQLite en memoria mediante `PRODUCTS_DATABASE_URL=sqlite:///:memory:`.
- El comando global copia los informes HTML individuales y crea `coverage-report/summary.json` y `coverage-report/index.html` con tarjetas, tabla comparativa, barras, archivos con menor cobertura y recomendaciones.

Los informes temporales (`coverage/`, `htmlcov/`, `coverage-report/`, `.coverage`, `coverage.json`, `coverage.xml`) estan ignorados por git. La carpeta `docs/coverage/` es la copia publicable si quieres compartir el dashboard. Docker Compose no se modifica: los tests no dependen de las bases de datos reales ni requieren levantar los contenedores de produccion.
