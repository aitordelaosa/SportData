## API Gateway

Punto de entrada para el frontend web de SportData. Centraliza las peticiones hacia el microservicio de usuarios y aplica verificación básica de tokens JWT antes de reenviarlas.

### Requisitos

- Node.js 18 o superior
- Microservicio de usuarios ejecutándose (por defecto en `http://localhost:4001/api`)

### Configuración

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de entorno y ajusta los valores:
   ```bash
  cp .env.example .env
   ```
   - `PORT`: Puerto en el que escuchará el gateway (default `5000`).
   - `USER_SERVICE_URL`: URL base del microservicio de usuarios.
   - `JWT_SECRET`: Debe coincidir con el usado por el microservicio para validar tokens.

### Ejecución

```bash
npm run dev    # con recarga automática
# o
npm start
```

### Uso mediante Docker

- El gateway se construye automáticamente desde el `Dockerfile` cuando ejecutas `docker compose up --build -d` en la raíz del proyecto.
- Asegúrate de que el microservicio de usuarios y el gateway compartan el mismo `JWT_SECRET`; puedes definirlo en un archivo `.env` en la raíz (`JWT_SECRET=<valor>`).

El endpoint de salud se encuentra en `GET /health`. Las rutas expuestas para el frontend están bajo `/api`, por ejemplo:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me` (requiere cabecera `Authorization: Bearer <token>`)
- `PUT /api/users/me` (requiere cabecera `Authorization`)

### Flujo del Frontend

El frontend estático (`web/`) utiliza `fetch` contra el gateway (`http://localhost:5000/api`). Ajusta `API_BASE_URL` en producción si el gateway se despliega con otra URL.
