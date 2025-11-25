## SportData - Arquitectura Contenerizada

El proyecto incluye:

- **microservicioUsuarios** (Node.js + Express + MongoDB).
- **microservicioProductos** (FastAPI + PostgreSQL).
- **api-gateway** (Node.js + Express).
- **web** (HTML/CSS/JS estatico servido por Nginx).
- **MongoDB** y **PostgreSQL** como bases de datos.

### Requisitos

- Docker y Docker Compose instalados.
- Opcional: archivo `.env` en la raiz para definir el secreto JWT compartido:
  ```env
  JWT_SECRET=super-clave-segura
  ```
  Si no se define, se usara `sportdata-dev-secret`.

### Puesta en marcha

1. Construir y levantar todo el stack en segundo plano:
   ```bash
   docker compose up --build -d
   ```
2. Verificar contenedores:
   ```bash
   docker compose ps
   ```

### Servicios expuestos

| Servicio                 | URL/Conexion                                       |
|--------------------------|-----------------------------------------------------|
| Frontend estatico        | http://localhost:8080                              |
| API Gateway              | http://localhost:5000/api                          |
| Microservicio usuarios   | http://localhost:4001/api                          |
| Microservicio productos  | http://localhost:8002/products (Swagger: /docs)    |
| MongoDB                  | mongodb://localhost:27018/sportdata_usuarios       |
| PostgreSQL productos     | postgres://sport4data:sport4data@localhost:5432/sport4data |

Los formularios del frontend consumen automaticamente el gateway (`http://<host>:5000/api`). Para ver los datos en MongoDB Compass utiliza `mongodb://localhost:27018/sportdata_usuarios?directConnection=true`.

### Detener y eliminar contenedores

Para pausar los servicios manteniendo contenedores y volumenes:
```bash
docker compose stop
```

Cuando quieras reanudarlos:
```bash
docker compose start
```

```bash
docker compose down
```

Para destruir los volumenes (incluidos los datos de MongoDB y PostgreSQL):
```bash
docker compose down -v
```
