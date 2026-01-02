# Microservicio de Usuarios (Node.js + Express + MongoDB)
Gestion de cuentas para SportData: registro, login JWT, perfil y roles.

## Requisitos
- Node.js >= 18
- MongoDB >= 6 (local o contenedor)

## Configuracion
```bash
cd microservicioUsuarios
cp .env.example .env
npm install
```
Variables clave:
- `PORT` (default 4001)
- `MONGO_URI` (ej. `mongodb://localhost:27018/sportdata_usuarios`)
- `JWT_SECRET` (debe coincidir con gateway y pedidos)
- `JWT_EXPIRES_IN` (p. ej. `2h`)

## Ejecucion
```bash
npm run dev   # desarrollo con recarga
# o
npm start
```
Ruta base: `http://localhost:4001/api`. Salud: `GET /health`.

## Con Docker
Incluido en `docker-compose.yml`. Desde la raiz:
```bash
docker compose up --build -d user-service
```
Se levanta junto con `mongo` y comparte el `JWT_SECRET` definido en la raiz.

## Endpoints
Metodo | Ruta | Notas
--- | --- | ---
POST | `/auth/register` | Crea usuario
POST | `/auth/login` | Devuelve JWT
GET | `/users/me` | Perfil (JWT)
PUT | `/users/me` | Actualiza nombre/email/direccion (JWT)
GET | `/users` | Listado para rol `admin` (JWT)

Todas las respuestas entregan `data` y `message` en JSON. Errores incluyen `message`, `status` y, si aplica, `details`.
