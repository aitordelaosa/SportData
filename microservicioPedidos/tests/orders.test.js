process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.PRODUCT_SERVICE_URL = 'http://products.test';

const fs = require('fs');
const path = require('path');
const mongoBinaryDir = path.join(__dirname, '..', '.tmp', 'mongodb-binaries');
fs.mkdirSync(mongoBinaryDir, { recursive: true });
process.env.MONGOMS_DOWNLOAD_DIR = mongoBinaryDir;

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const { getProduct } = require('../src/utils/productClient');
const { sendOrderReceivedEmail } = require('../src/utils/mailService');
const createApp = require('../src/app');

jest.mock('../src/utils/productClient', () => ({
  getProduct: jest.fn(),
}));

jest.mock('../src/utils/mailService', () => ({
  sendOrderReceivedEmail: jest.fn(() => Promise.resolve({ sent: false, reason: 'test' })),
}));

jest.setTimeout(120000);

describe('microservicioPedidos', () => {
  let mongoServer;
  let app;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
    userToken = jwt.sign({ id: 'user-1', rol: 'user', email: 'user@example.com' }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: 'admin-1', rol: 'admin', email: 'admin@example.com' }, process.env.JWT_SECRET);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    await Promise.all(
      Object.values(mongoose.connection.collections).map((collection) =>
        collection.deleteMany({}),
      ),
    );
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  function auth(token = userToken) {
    return { Authorization: `Bearer ${token}` };
  }

  function mockProduct(overrides = {}) {
    return {
      id: 'prod-1',
      nombre: 'Balon Training',
      precio: 25,
      stock: 10,
      disponible: true,
      imagen_url: 'http://static.test/products/balon.jpg',
      ...overrides,
    };
  }

  test('responde al health check', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      productService: 'http://products.test',
    });
  });

  test('devuelve carrito vacio para usuario autenticado', async () => {
    const res = await request(app).get('/cart').set(auth());

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('rechaza carrito sin autenticacion', async () => {
    const res = await request(app).get('/cart');

    expect(res.status).toBe(401);
  });

  test('permite anadir, actualizar y eliminar items del carrito', async () => {
    getProduct.mockResolvedValue(mockProduct());

    const addRes = await request(app)
      .post('/cart/items')
      .set(auth())
      .send({ productId: 'prod-1', quantity: 2 });

    expect(addRes.status).toBe(201);
    expect(addRes.body.data.quantity).toBe(2);

    const updateRes = await request(app)
      .patch('/cart/items/prod-1')
      .set(auth())
      .send({ quantity: 3 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.quantity).toBe(3);

    const deleteRes = await request(app).delete('/cart/items/prod-1').set(auth());

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data).toBeNull();
  });

  test('gestiona favoritos', async () => {
    getProduct.mockResolvedValue(mockProduct());

    const addRes = await request(app).post('/favorites/prod-1').set(auth());
    expect(addRes.status).toBe(201);

    const listRes = await request(app).get('/favorites').set(auth());
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].product.nombre).toBe('Balon Training');

    const deleteRes = await request(app).delete('/favorites/prod-1').set(auth());
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data).toBeNull();
  });

  test('rechaza checkout con carrito vacio', async () => {
    const res = await request(app).post('/orders/checkout').set(auth()).send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('carrito');
  });

  test('crea pedido en checkout y vacia el carrito', async () => {
    getProduct.mockResolvedValue(mockProduct({ precio: 30 }));

    await request(app)
      .post('/cart/items')
      .set(auth())
      .send({ productId: 'prod-1', quantity: 2 });

    const checkoutRes = await request(app)
      .post('/orders/checkout')
      .set(auth())
      .send({
        shipping: {
          nombre: 'Ane',
          apellidos: 'QA',
          direccion: 'Calle Testing 1',
          ciudad: 'Bilbao',
          provincia: 'Bizkaia',
          pais: 'ES',
          cp: '48001',
          email: 'ane.qa@example.com',
        },
        payment: {
          cardNumber: '4111111111111111',
          holder: 'Ane QA',
          expMonth: '12',
          expYear: '2030',
        },
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.data.total).toBe(60);
    expect(checkoutRes.body.data.payment.brand).toBe('Visa');
    expect(sendOrderReceivedEmail).toHaveBeenCalled();

    const cartRes = await request(app).get('/cart').set(auth());
    expect(cartRes.body.data).toEqual([]);
  });

  test('devuelve estadisticas para admin', async () => {
    getProduct.mockResolvedValue(mockProduct({ precio: 20 }));

    await request(app)
      .post('/cart/items')
      .set(auth())
      .send({ productId: 'prod-1', quantity: 2 });
    await request(app).post('/orders/checkout').set(auth()).send({});

    const statsRes = await request(app)
      .get('/orders/admin/stats')
      .set(auth(adminToken));

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.summary.totalOrders).toBe(1);
    expect(statsRes.body.topProducts[0].name).toBe('balon training');
  });
});
