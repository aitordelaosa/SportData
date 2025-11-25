## API Gateway

Punto de entrada para el frontend web de SportData. Este servicio centraliza las peticiones hacia los microservicios (usuarios y productos) y aplica una verificacion basica de tokens JWT antes de reenviarlas.

### Requisitos

- Node.js 18 o superior
- Microservicio de usuarios levantado (por defecto `http://localhost:4001/api`)
- Microservicio de productos levantado (por defecto `http://localhost:8002`)

### Configuracion

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de entorno y ajusta los valores:
   ```bash
   cp .env.example .env
   ```
   - `PORT`: Puerto donde escuchara el gateway (default `5000`).
   - `USER_SERVICE_URL`: URL base del microservicio de usuarios.
   - `PRODUCT_SERVICE_URL`: URL base del microservicio FastAPI de productos.
   - `JWT_SECRET`: Debe coincidir con el usado por el microservicio de usuarios para validar tokens.

### Ejecucion

```bash
npm run dev    # con recarga automatica
# o
npm start
```

### Uso mediante Docker

- El gateway se construye automaticamente desde el `Dockerfile` cuando ejecutas `docker compose up --build -d` en la raiz del proyecto.
- Asegurate de que los microservicios y el gateway compartan el mismo `JWT_SECRET`; puedes definirlo en un archivo `.env` en la raiz (`JWT_SECRET=<valor>`).

El endpoint de salud se encuentra en `GET /health`. Las rutas expuestas para el frontend estan bajo `/api`, por ejemplo:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me` (requiere cabecera `Authorization: Bearer <token>`)
- `PUT /api/users/me` (requiere cabecera `Authorization`)
- `GET /api/products` y `GET /api/products/:id` (catalogo proveniente del microservicio FastAPI)

### Flujo del Frontend

El frontend estatico (`web/`) utiliza `fetch` contra el gateway (`http://localhost:5000/api`). Ajusta `API_BASE_URL` en produccion si el gateway se despliega con otra URL.
