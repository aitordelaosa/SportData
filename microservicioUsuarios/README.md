# Microservicio de Usuarios

Servicio de cuentas de SportData: registro, login JWT, recuperacion de contrasena, perfil y roles.

## Requisitos

- Node.js 18+
- MongoDB 6+

## Configuracion local

```bash
cd microservicioUsuarios
cp .env.example .env
npm install
```

Variables principales:

- `PORT` (`4001` por defecto)
- `MONGO_URI`
- `JWT_SECRET` (igual que gateway y pedidos)
- `JWT_EXPIRES_IN`
- `MAIL_USER`, `MAIL_APP_PASSWORD`, `MAIL_FROM` (opcionales para correo)

## Ejecucion

```bash
npm run dev
# o
npm start
```

Rutas utiles:

- API: `http://localhost:4001/api`
- Health: `GET /health` o `GET /api/health`

## Docker

Desde la raiz del proyecto:

```bash
docker compose up --build -d user-service
```

## Endpoints

Metodo | Ruta | Uso
--- | --- | ---
POST | `/auth/register` | Crear usuario
POST | `/auth/login` | Obtener JWT
POST | `/auth/forgot-password` | Generar contrasena temporal
GET | `/users` | Listar usuarios (admin)
GET | `/users/me` | Ver perfil
PUT | `/users/me` | Actualizar perfil
GET | `/users/me/role` | Ver rol propio
GET | `/users/me/role/:role` | Validar rol propio
PATCH | `/users/:id/role` | Cambiar rol (admin)

Las rutas de usuario requieren JWT salvo registro, login y recuperacion.

## Tests y seed

```bash
npm test
npm run test:coverage
npm run seed:users
```
