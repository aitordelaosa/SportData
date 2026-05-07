# Microservicio de Productos (FastAPI + PostgreSQL)

API REST para el catalogo de SportData: listado, filtros, detalle, alta/edicion/borrado de productos y control de stock. Tambien sirve imagenes estaticas.

## Requisitos

- Python 3.11+
- PostgreSQL 14+

## Configuracion

```bash
cd microservicioProductos
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Variables clave (`.env`):

- `PRODUCTS_DATABASE_URL` (ejemplo `postgresql+psycopg://sport4data:sport4data@localhost:5432/sport4data`)
- `PRODUCTS_STATIC_DIR` (ruta del directorio `static`)
- `PRODUCTS_STATIC_BASE_URL` (ejemplo `http://127.0.0.1:8002/static`)

Crea la base de datos antes de arrancar:

```sql
CREATE DATABASE sport4data;
```

## Ejecucion local

```bash
uvicorn app.main:app --reload --port 8002
```

- API productos: `http://localhost:8002/products`
- Swagger: `http://localhost:8002/docs`
- Health: `GET /`
- Estaticos: `http://localhost:8002/static/...`

## Docker

```bash
docker compose up -d product-service
```

En Docker, el entrypoint espera a PostgreSQL, aplica seed incremental e inicia FastAPI.

## Seed de catalogo

```bash
python seed_products.py
```

El seed:

- inserta productos que faltan,
- evita sobreescribir cambios existentes,
- elimina duplicados por clave `nombre + marca`,
- respeta productos de seed marcados como eliminados.

## Endpoints principales

- `GET /products` (filtros: `categoria`, `deporte`, `marca`, `precio_min`, `precio_max`, `disponible`, `search`, `skip`, `limit`)
- `GET /products/{id}`
- `POST /products`
- `PUT /products/{id}`
- `PATCH /products/{id}/stock`
- `DELETE /products/{id}`

## Notas de imagenes

Para alta/edicion se puede enviar imagen codificada en base64 con:

- `imagen_base64`
- `imagen_nombre`
- `imagen_mime`

La API guarda la imagen en `static/products` y devuelve `imagen_url` resolviendo contra `PRODUCTS_STATIC_BASE_URL`.
