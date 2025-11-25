# Microservicio de Productos (FastAPI + PostgreSQL)

Servicio REST para gestionar el catalogo de Sport4Data.

## Requisitos
- Python 3.11+
- PostgreSQL 14+
- Entorno virtual recomendado

## Instalacion
```bash
cd microservicioProductos
python -m venv .venv
.venv\Scripts\activate  # En Windows
pip install -r requirements.txt
```

## Configuracion de la base de datos
1. Crear la base de datos (ajusta credenciales):
   ```sql
   CREATE DATABASE sport4data;
   ```
2. Define el usuario con permisos o reutiliza uno existente.
3. Edita `app/config.py` o exporta la variable:
   ```bash
   set PRODUCTS_DATABASE_URL=postgresql://user:password@localhost:5432/sport4data
   ```
4. Las tablas se crean automaticamente al iniciar FastAPI gracias a `Base.metadata.create_all(engine)` en `app/main.py`. Ejecutalo al menos una vez antes de usar el servicio en produccion.

### SQL de referencia de la tabla `producto`
```sql
CREATE TABLE IF NOT EXISTS producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    deporte VARCHAR(100),
    color VARCHAR(60),
    marca VARCHAR(120),
    precio NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    disponible BOOLEAN NOT NULL DEFAULT TRUE
);
```

## Recursos estaticos (imagenes)
- Las imagenes locales del catalogo se sirven desde el directorio `static/` ubicado en la raiz del repositorio.
- Puedes personalizar la ruta con `PRODUCTS_STATIC_DIR` (por defecto se detectan `../static` o `./static` segun el entorno).
- El enlace publico que recibiran los clientes se construye con `PRODUCTS_STATIC_BASE_URL`. En Docker ya se fija a `http://127.0.0.1:8002/static`.

## Ejecucion
```bash
uvicorn app.main:app --reload --port 8000
```
La API quedara disponible en `http://localhost:8000`, y la documentacion interactiva en `/docs` o `/redoc`. En la pila Docker se expone en `http://127.0.0.1:8002` (Swagger en `/docs`).

## Ejecutar con Docker
```bash
docker compose up -d product-service
```
Esto tambien levanta el contenedor `products-db` (PostgreSQL). El servicio queda accesible en:
- API: `http://127.0.0.1:8002/products`
- Swagger UI: `http://127.0.0.1:8002/docs`
- ReDoc: `http://127.0.0.1:8002/redoc`

> Nota: en `docker-compose.yml` los puertos estan publicados solo en IPv4 (`127.0.0.1`) para evitar problemas con IPv6 en Windows/WSL2.

## Poblar datos de ejemplo
```bash
python seed_products.py
```
El script reutiliza la misma configuracion del microservicio e inserta entre 15 y 30 productos con diferentes categorias, deportes y disponibilidad.

> **Nota:** Cuando el contenedor `product-service` se inicia (via `docker compose up`), ejecuta automaticamente un proceso de espera hasta que PostgreSQL este listo y lanza `seed_products.py`. Esto garantiza que los HTML del frontend dispongan de datos en cuanto levantes todo el stack con `docker compose up -d`.

## Endpoints principales
- `GET /products`: lista productos con filtros y paginacion.
- `GET /products/{id}`: detalle de un producto.
- `POST /products`: crear (solo administracion, pendiente de integrar autenticacion).
- `PUT /products/{id}`: actualizar todos los campos.
- `DELETE /products/{id}`: marca como no disponible.
- `PATCH /products/{id}/stock`: actualiza unicamente el stock.
