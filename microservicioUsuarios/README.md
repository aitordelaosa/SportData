# Microservicio de Usuarios (Node.js + Express + MongoDB)

Servicio de cuentas para SportData: registro, login JWT, recuperacion de contrasena, perfil y gestion de roles.

## Requisitos

- Node.js 18+
- MongoDB 6+

## Configuracion

```bash
cd microservicioUsuarios
cp .env.example .env
npm install
```

Variables clave:

- `PORT` (default `4001`)
- `NODE_ENV` (`development`/`production`)
- `MONGO_URI` (ejemplo `mongodb://localhost:27018/sportdata_usuarios`)
- `JWT_SECRET` (debe coincidir con gateway y pedidos)
- `JWT_EXPIRES_IN` (ejemplo `2h`)
- `MAIL_USER`
- `MAIL_APP_PASSWORD`
- `MAIL_FROM`

## Ejecucion

```bash
npm run dev
# o
npm start
```

- Base URL: `http://localhost:4001/api`
- Base info: `GET /api`
- Health: `GET /health` o `GET /api/health`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d user-service
```

## Endpoints

Metodo | Ruta | Notas
--- | --- | ---
POST | `/auth/register` | Crea usuario
POST | `/auth/login` | Devuelve JWT
POST | `/auth/forgot-password` | Genera y envia contrasena temporal
GET | `/users` | Listado de usuarios (JWT admin)
GET | `/users/me` | Perfil autenticado (JWT)
PUT | `/users/me` | Actualiza perfil (JWT)
GET | `/users/me/role` | Devuelve rol del usuario autenticado (JWT)
GET | `/users/me/role/:role` | Valida si el usuario tiene un rol (JWT)
PATCH | `/users/:id/role` | Cambia rol de un usuario (JWT admin)

## Seed de usuarios demo

```bash
npm run seed:users
```

Este script crea usuarios base y clientes demo si no existen ya en la base de datos.
