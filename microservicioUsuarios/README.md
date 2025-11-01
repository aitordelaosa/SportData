# Microservicio de Gestion de Usuarios

Servicio REST construido con Node.js y Express para cubrir las necesidades de gestion de cuentas dentro del ecosistema SportData. Expone endpoints para registro, autenticacion por JWT, edicion de perfil y validacion de roles sobre una base de datos MongoDB.

## Caracteristicas
- Registro de usuarios con hashing bcrypt y roles predeterminados.
- Inicio de sesion con emision de JSON Web Tokens.
- Endpoints protegidos para consultar y actualizar el perfil de la persona autenticada.
- Validacion de roles y actualizacion de rol para administradores.
- Conexion a MongoDB y manejo consistente de errores API.

## Requisitos previos
- Node.js >= 18
- MongoDB >= 6 (local o en la nube)

## Puesta en marcha
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Ajustar las variables del nuevo `.env` (puerto, credenciales y secretos JWT).
4. Asegurate de que tu instancia de MongoDB este en ejecucion y que la URI configurada sea alcanzable.
5. Lanzar el servicio en modo desarrollo:
   ```bash
   npm run dev
   ```
   o en modo produccion:
   ```bash
   npm start
   ```

### Ejecución con Docker
- El microservicio cuenta con un `Dockerfile` y se integra en `docker-compose.yml`.
- Dentro de la raíz del proyecto ejecuta `docker compose up --build -d` para levantar todos los servicios (MongoDB, gateway, frontend y microservicio).
- Las variables `MONGO_URI` y `JWT_SECRET` se inyectan desde el `docker-compose` (puedes sobreescribir el secreto mediante un archivo `.env` en la raíz con `JWT_SECRET=<valor>`).

## Variables de entorno principales
- `PORT`: Puerto de escucha del microservicio (por defecto 4001).
- `JWT_SECRET`: Clave usada para firmar los tokens.
- `JWT_EXPIRES_IN`: Tiempo de vida del token (por ejemplo `2h`).
- `MONGO_URI`: Cadena de conexion para MongoDB (por defecto `mongodb://localhost:27018/sportdata_usuarios`).

## Endpoints
Ruta base: `/api`

| Metodo | Ruta | Proteccion | Descripcion |
| --- | --- | --- | --- |
| POST | `/auth/register` | Publico | Registra un nuevo usuario. |
| POST | `/auth/login` | Publico | Autentica un usuario y entrega un JWT. |
| GET | `/users/me` | Requiere JWT | Devuelve el perfil del usuario autenticado. |
| PUT | `/users/me` | Requiere JWT | Actualiza nombre, email o direccion del perfil. |
| GET | `/users/me/role` | Requiere JWT | Devuelve el rol vigente. |
| GET | `/users/me/role/:role` | Requiere JWT | Verifica si el usuario posee el rol solicitado. |
| PATCH | `/users/:id/role` | JWT + rol `admin` | Permite cambiar el rol de otro usuario. |

### Formato de respuestas
Todas las respuestas exitosas devuelven un objeto JSON con `message` y `data`. En caso de error se entrega `message`, `status` HTTP acorde y, si aplica, la lista de `details`.

## Estructura del proyecto
```
src/
  app.js                 Configuracion principal de Express
  server.js              Punto de entrada del servicio
  config/                Lectura de entorno y conexion a MongoDB
  controllers/           Logica HTTP de cada recurso
  middlewares/           Autenticacion, validaciones y manejo de errores
  models/                Esquemas de Mongoose
  routes/                Definicion de rutas agrupadas
  services/              Reglas de negocio y acceso a datos
  utils/                 Utilidades (JWT, roles, errores personalizados)
  validators/            Validaciones con express-validator
```

## Pruebas rapidas con cURL
- Registro:
  ```bash
  curl -X POST http://localhost:4001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"nombre":"Ana", "email":"ana@example.com", "password":"Pass1234", "direccion":"Bilbao"}'
  ```
- Login:
  ```bash
  curl -X POST http://localhost:4001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ana@example.com", "password":"Pass1234"}'
  ```
- Consulta de perfil (reemplaza `<TOKEN>` por el valor recibido en login):
  ```bash
  curl http://localhost:4001/api/users/me \
    -H "Authorization: Bearer <TOKEN>"
  ```

## Datos de prueba
- Ejecuta `npm run seed:users` para cargar usuarios ficticios. Se crean:
  - Un administrador (`admin@sportdata.com` / `Admin1234`).
  - Un manager (`manager@sportdata.com` / `Manager1234`).
  - 15 clientes demo con correos como `lucia.garcia1@sportdata.com` y contraseñas `ClienteXX!` (por ejemplo `Cliente01!`).

## Notas
- Para un entorno productivo recuerda usar un secreto JWT robusto y configurar tu cluster de MongoDB con autenticacion y cifrado en transito.
- Puedes ampliar la lista de roles en `src/config/constants.js`; recuerda mantener esos mismos valores en el modelo de usuario (`src/models/user.model.js`).

