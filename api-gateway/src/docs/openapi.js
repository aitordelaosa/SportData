const jsonObjectSchema = {
  type: 'object',
  additionalProperties: true,
};

const successResponse = {
  description: 'Operacion completada',
  content: {
    'application/json': {
      schema: jsonObjectSchema,
    },
  },
};

const unauthorizedResponse = {
  description: 'Token no valido o no proporcionado',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Token de autenticacion no proporcionado' },
        },
      },
    },
  },
};

const forbiddenResponse = {
  description: 'Permisos insuficientes',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Permisos insuficientes' },
        },
      },
    },
  },
};

const genericBody = {
  required: true,
  content: {
    'application/json': {
      schema: jsonObjectSchema,
    },
  },
};

const baseOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SportData API Gateway',
    version: '1.0.0',
    description: 'Documentacion de rutas expuestas por el API Gateway.',
  },
  tags: [
    { name: 'Meta', description: 'Estado y documentacion' },
    { name: 'Auth', description: 'Registro, login y recuperacion de acceso' },
    { name: 'Users', description: 'Perfil de usuario y gestion de usuarios' },
    { name: 'Products', description: 'Consulta y gestion de productos' },
    { name: 'Cart', description: 'Carrito de compra' },
    { name: 'Favorites', description: 'Favoritos' },
    { name: 'Orders', description: 'Pedidos y checkout' },
    { name: 'Admin', description: 'Analitica y operaciones de administrador' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Meta'],
        summary: 'Informacion base de la API',
        responses: {
          200: successResponse,
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuario',
        requestBody: genericBody,
        responses: {
          201: successResponse,
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesion',
        requestBody: genericBody,
        responses: {
          200: successResponse,
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Solicitar recuperacion de contrasena',
        requestBody: genericBody,
        responses: {
          200: successResponse,
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios (admin)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Obtener perfil propio',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Actualizar perfil propio',
        security: [{ BearerAuth: [] }],
        requestBody: genericBody,
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Listar productos',
        parameters: [
          { name: 'term', in: 'query', schema: { type: 'string' } },
          { name: 'categoria', in: 'query', schema: { type: 'string' } },
          { name: 'deporte', in: 'query', schema: { type: 'string' } },
          { name: 'disponible', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: successResponse,
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Crear producto (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: genericBody,
        responses: {
          201: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Obtener producto por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: successResponse,
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Actualizar producto (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: genericBody,
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Eliminar producto (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
    '/products/{id}/stock': {
      patch: {
        tags: ['Products'],
        summary: 'Actualizar stock de producto (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: genericBody,
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Obtener carrito',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Agregar item al carrito',
        security: [{ BearerAuth: [] }],
        requestBody: genericBody,
        responses: {
          201: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/cart/items/{productId}': {
      patch: {
        tags: ['Cart'],
        summary: 'Actualizar cantidad de un item del carrito',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: genericBody,
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Eliminar item del carrito',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Obtener favoritos',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/favorites/{productId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Agregar favorito',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          201: successResponse,
          401: unauthorizedResponse,
        },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Eliminar favorito',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Listar pedidos del usuario autenticado',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/orders/checkout': {
      post: {
        tags: ['Orders'],
        summary: 'Confirmar checkout y crear pedido',
        security: [{ BearerAuth: [] }],
        requestBody: genericBody,
        responses: {
          201: successResponse,
          401: unauthorizedResponse,
        },
      },
    },
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Obtener estadisticas para administrador',
        security: [{ BearerAuth: [] }],
        responses: {
          200: successResponse,
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
  },
};

function getServerOrigin(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'http';
  return `${protocol}://${req.get('host')}`;
}

function buildOpenApiSpec(req) {
  const spec = JSON.parse(JSON.stringify(baseOpenApiSpec));
  spec.servers = [
    {
      url: `${getServerOrigin(req)}/api`,
      description: 'Base URL del API Gateway',
    },
  ];
  return spec;
}

function renderSwaggerHtml(openApiUrl = '/openapi.json') {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SportData API Gateway - Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f1320; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      window.SwaggerUIBundle({
        url: '${openApiUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [window.SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout',
      });
    };
  </script>
</body>
</html>`;
}

module.exports = {
  buildOpenApiSpec,
  renderSwaggerHtml,
};

