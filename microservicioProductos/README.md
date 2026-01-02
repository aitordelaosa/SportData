# Microservicio de Productos (FastAPI + PostgreSQL)
API REST para el catalogo de SportData: listado, filtros, detalle y gestion de stock. Sirve tambien los recursos estaticos (imagenes) de los productos.

## Requisitos
- Python 3.11+
- PostgreSQL 14+
- Entorno virtual recomendado

## Configuracion
```bash
cd microservicioProductos
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
Variables clave (`.env`):
- `PRODUCTS_DATABASE_URL` (ej. `postgresql+psycopg://sport4data:sport4data@localhost:5432/sport4data`)
- `PRODUCTS_STATIC_DIR` (ruta a `static/`)
- `PRODUCTS_STATIC_BASE_URL` (URL publica de las imagenes, en Docker `http://127.0.0.1:8002/static`)

Base de datos: crea la BD antes de arrancar:
```sql
CREATE DATABASE sport4data;
```

## Ejecucion
```bash
uvicorn app.main:app --reload --port 8002
```
API: `http://localhost:8002/products`  
Swagger: `http://localhost:8002/docs`

## Con Docker
```bash
docker compose up -d product-service
```
Levanta tambien `products-db` (PostgreSQL). En `docker-compose.yml` los puertos se publican en `127.0.0.1` para evitar problemas con IPv6/WSL2.

## Semillas de datos
```bash
python seed_products.py
```
Inserta un conjunto de productos de prueba. En Docker el seeding se lanza al iniciar el contenedor.

## Endpoints principales
- `GET /products` (filtros por deporte, categoria, disponibilidad)
- `GET /products/{id}`
- `POST /products` (pendiente de auth)
- `PUT /products/{id}`
- `PATCH /products/{id}/stock`
- `DELETE /products/{id}`
