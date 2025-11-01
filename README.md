## SportData – Arquitectura Contenerizada

El proyecto incluye:

- **microservicioUsuarios** (Node.js + Express + MongoDB).
- **api-gateway** (Node.js + Express).
- **web** (HTML/CSS/JS estático servido por Nginx).
- **MongoDB** como base de datos.

### Requisitos

- Docker y Docker Compose instalados.
- Opcional: archivo `.env` en la raíz para definir el secreto JWT compartido:
  ```env
  JWT_SECRET=super-clave-segura
  ```
  Si no se define, se usará `sportdata-dev-secret`.

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

| Servicio            | URL                                   |
|--------------------|----------------------------------------|
| Frontend estático  | http://localhost:8080                  |
| API Gateway        | http://localhost:5000/api              |
| Microservicio user | http://localhost:4001/api              |
| MongoDB            | mongodb://localhost:27018/sportdata_usuarios |


Los formularios del frontend consumen autom�ticamente el gateway (`http://<host>:5000/api`). Para ver los datos en MongoDB Compass utiliza `mongodb://localhost:27018/sportdata_usuarios?directConnection=true`.

### Detener y eliminar contenedores

Para pausar los servicios manteniendo contenedores y volúmenes:
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

Para destruir los volúmenes (incluidos los datos de MongoDB):
```bash
docker compose down -v
```
