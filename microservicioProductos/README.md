# Microservicio de Productos

API de catalogo de SportData. Gestiona productos, filtros, stock e imagenes estaticas.

## Requisitos

- Python 3.11+
- PostgreSQL 14+

## Configuracion local

```bash
cd microservicioProductos
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

Este servicio no incluye `.env.example`. Si lo ejecutas fuera de Docker, crea un `.env` con los valores necesarios:

```env
PRODUCTS_DATABASE_URL=postgresql+psycopg://sport4data:sport4data@localhost:5432/sport4data
PRODUCTS_STATIC_DIR=../static
PRODUCTS_STATIC_BASE_URL=http://127.0.0.1:8002/static
```

La base `sport4data` debe existir antes de arrancar el servicio.

## Ejecucion

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8002
```

Rutas utiles:

- API: `http://localhost:8002/products`
- Swagger: `http://localhost:8002/docs`
- Health: `GET /`
- Estaticos: `http://localhost:8002/static/...`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d product-service
```

El contenedor espera a PostgreSQL, ejecuta el seed incremental y arranca FastAPI.

## Seed

```bash
.venv\Scripts\python seed_products.py
```

El seed inserta productos que faltan y evita duplicados por `nombre + marca`.

## Endpoints

Metodo | Ruta | Uso
--- | --- | ---
GET | `/products` | Listar y filtrar productos
GET | `/products/{id}` | Ver detalle
POST | `/products` | Crear producto
PUT | `/products/{id}` | Actualizar producto
PATCH | `/products/{id}/stock` | Actualizar stock
DELETE | `/products/{id}` | Eliminar producto

Filtros disponibles en `GET /products`: `categoria`, `deporte`, `marca`, `precio_min`, `precio_max`, `disponible`, `search`, `skip`, `limit`.

## Imagenes

Para crear o editar productos se puede enviar:

- `imagen_base64`
- `imagen_nombre`
- `imagen_mime`

La API guarda la imagen en `static/products` y devuelve `imagen_url`.

## Tests

```bash
.venv\Scripts\python -m pip install -r requirements-test.txt
.venv\Scripts\python -m pytest
```
