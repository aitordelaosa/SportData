process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockUserServiceClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
};
const mockProductServiceClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};
const mockOrderServiceClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../src/utils/httpClient', () => ({
  userServiceClient: mockUserServiceClient,
  productServiceClient: mockProductServiceClient,
  orderServiceClient: mockOrderServiceClient,
}));

const createApp = require('../src/app');

describe('api-gateway', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function tokenFor(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  test('responde al health check', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'api-gateway',
    });
  });

  test('devuelve informacion base bajo /api', async () => {
    const res = await request(app).get('/api').set('Host', 'sportdata.test');

    expect(res.status).toBe(200);
    expect(res.body.service).toBe('api-gateway');
    expect(res.body.docs).toBe('http://sportdata.test/docs');
  });

  test('devuelve 404 para rutas inexistentes', async () => {
    const res = await request(app).get('/ruta-que-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('/ruta-que-no-existe');
  });

  test('lista productos a traves del servicio de productos', async () => {
    mockProductServiceClient.get.mockResolvedValueOnce({
      data: [
      { id: 1, nombre: 'Balon', disponible: true },
      ],
    });

    const res = await request(app).get('/api/products?search=balon');

    expect(res.status).toBe(200);
    expect(mockProductServiceClient.get).toHaveBeenCalledWith(
      '/products',
      { params: expect.objectContaining({ search: 'balon' }) },
    );
    expect(res.body.data).toHaveLength(1);
  });

  test('reenvia registro y login al servicio de usuarios', async () => {
    mockUserServiceClient.post
      .mockResolvedValueOnce({ data: { message: 'registrado', data: { user: { id: 'u1' } } } })
      .mockResolvedValueOnce({ data: { message: 'login ok', data: { token: 'token-remoto' } } });

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Ane', email: 'ane@example.com', password: 'Password123' });
    expect(registerRes.status).toBe(201);
    expect(mockUserServiceClient.post).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ email: 'ane@example.com' }),
    );

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ane@example.com', password: 'Password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBe('token-remoto');
  });

  test('protege creacion de productos sin token', async () => {
    const res = await request(app).post('/api/products').send({ nombre: 'Raqueta' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Token');
  });

  test('bloquea creacion de productos a usuarios no admin', async () => {
    const token = tokenFor({ id: 'user-1', rol: 'user' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Raqueta' });

    expect(res.status).toBe(403);
  });

  test('permite a admin crear productos', async () => {
    mockProductServiceClient.post.mockResolvedValueOnce({ data: { id: 2, nombre: 'Raqueta' } });
    const token = tokenFor({ id: 'admin-1', rol: 'admin' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Raqueta', precio: 99.9, stock: 5 });

    expect(res.status).toBe(201);
    expect(mockProductServiceClient.post).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({ nombre: 'Raqueta' }),
    );
    expect(res.body.data.id).toBe(2);
  });

  test('permite a admin actualizar producto, stock y borrado logico', async () => {
    const token = tokenFor({ id: 'admin-1', rol: 'admin' });
    mockProductServiceClient.put.mockResolvedValueOnce({ data: { id: 2, nombre: 'Raqueta Pro' } });
    mockProductServiceClient.patch.mockResolvedValueOnce({ data: { id: 2, stock: 12 } });
    mockProductServiceClient.delete.mockResolvedValueOnce({ data: { id: 2, disponible: false } });

    const updateRes = await request(app)
      .put('/api/products/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Raqueta Pro' });
    expect(updateRes.status).toBe(200);

    const stockRes = await request(app)
      .patch('/api/products/2/stock')
      .set('Authorization', `Bearer ${token}`)
      .send({ stock: 12 });
    expect(stockRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete('/api/products/2')
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);
    expect(mockProductServiceClient.put).toHaveBeenCalledWith('/products/2', { nombre: 'Raqueta Pro' });
    expect(mockProductServiceClient.patch).toHaveBeenCalledWith('/products/2/stock', { stock: 12 });
    expect(mockProductServiceClient.delete).toHaveBeenCalledWith('/products/2');
  });

  test('reenvia perfil y listado de usuarios autenticados', async () => {
    const userToken = tokenFor({ id: 'user-1', rol: 'customer' });
    const adminToken = tokenFor({ id: 'admin-1', rol: 'admin' });
    mockUserServiceClient.get
      .mockResolvedValueOnce({ data: { data: { id: 'user-1', email: 'user@example.com' } } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'user-1' }] } });
    mockUserServiceClient.put.mockResolvedValueOnce({ data: { data: { nombre: 'Nuevo' } } });

    const profileRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`);
    expect(profileRes.status).toBe(200);

    const updateRes = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ nombre: 'Nuevo' });
    expect(updateRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(mockUserServiceClient.get).toHaveBeenLastCalledWith(
      '/users',
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
  });

  test('reenvia operaciones principales de pedidos', async () => {
    const token = tokenFor({ id: 'user-1', rol: 'customer' });
    mockOrderServiceClient.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [{ productId: 'p1' }] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 'order-1' }] } });
    mockOrderServiceClient.post
      .mockResolvedValueOnce({ data: { data: { productId: 'p1', quantity: 1 } } })
      .mockResolvedValueOnce({ data: { data: { productId: 'p1' } } })
      .mockResolvedValueOnce({ data: { data: { id: 'order-1' } } });
    mockOrderServiceClient.patch.mockResolvedValueOnce({ data: { data: { productId: 'p1', quantity: 2 } } });
    mockOrderServiceClient.delete
      .mockResolvedValueOnce({ data: { data: null } })
      .mockResolvedValueOnce({ data: { data: null } });

    expect((await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).post('/api/cart/items').set('Authorization', `Bearer ${token}`).send({ productId: 'p1' })).status).toBe(201);
    expect((await request(app).patch('/api/cart/items/p1').set('Authorization', `Bearer ${token}`).send({ quantity: 2 })).status).toBe(200);
    expect((await request(app).delete('/api/cart/items/p1').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).get('/api/favorites').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).post('/api/favorites/p1').set('Authorization', `Bearer ${token}`)).status).toBe(201);
    expect((await request(app).delete('/api/favorites/p1').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).get('/api/orders').set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect((await request(app).post('/api/orders/checkout').set('Authorization', `Bearer ${token}`).send({})).status).toBe(201);
  });

  test('reenvia estadisticas de pedidos para admin', async () => {
    const token = tokenFor({ id: 'admin-1', rol: 'admin' });
    mockOrderServiceClient.get.mockResolvedValueOnce({ data: { summary: { totalOrders: 1 } } });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.summary.totalOrders).toBe(1);
  });

  test('propaga errores remotos con detalles', async () => {
    mockProductServiceClient.get.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          message: 'Catalogo no disponible',
          details: [{ field: 'service', message: 'down' }],
        },
      },
    });

    const res = await request(app).get('/api/products/123');

    expect(res.status).toBe(503);
    expect(res.body.message).toBe('Catalogo no disponible');
    expect(res.body.details).toHaveLength(1);
  });
});
