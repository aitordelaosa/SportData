process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const fs = require('fs');
const path = require('path');
const mongoBinaryDir = path.join(__dirname, '..', '.tmp', 'mongodb-binaries');
fs.mkdirSync(mongoBinaryDir, { recursive: true });
process.env.MONGOMS_DOWNLOAD_DIR = mongoBinaryDir;

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const createApp = require('../src/app');

jest.setTimeout(120000);

describe('microservicioUsuarios', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp();
  });

  afterEach(async () => {
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

  function validUser(overrides = {}) {
    return {
      nombre: 'Ane QA',
      email: 'ane.qa@example.com',
      password: 'Password123',
      direccion: 'Calle Testing 1',
      ...overrides,
    };
  }

  async function registerUser(overrides = {}) {
    return request(app).post('/api/auth/register').send(validUser(overrides));
  }

  test('responde al health check', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'user-service',
    });
  });

  test('registra un usuario valido', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({
      nombre: 'Ane QA',
      email: 'ane.qa@example.com',
      rol: 'customer',
    });
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('rechaza registro con datos invalidos', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: '',
      email: 'email-invalido',
      password: 'corta',
    });

    expect(res.status).toBe(422);
    expect(res.body.details).toEqual(expect.any(Array));
  });

  test('inicia sesion con credenciales correctas', async () => {
    await registerUser();

    const res = await request(app).post('/api/auth/login').send({
      email: 'ane.qa@example.com',
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('ane.qa@example.com');
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('rechaza login con credenciales incorrectas', async () => {
    await registerUser();

    const res = await request(app).post('/api/auth/login').send({
      email: 'ane.qa@example.com',
      password: 'PasswordIncorrecta',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Credenciales');
  });

  test('rechaza acceso a perfil sin token', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Token');
  });

  test('devuelve perfil con token valido', async () => {
    const registerRes = await registerUser();
    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('ane.qa@example.com');
  });

  test('actualiza perfil con token valido', async () => {
    const registerRes = await registerUser();
    const token = registerRes.body.data.token;

    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Ane Actualizada',
        direccion: 'Nueva direccion 2',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Ane Actualizada');
    expect(res.body.data.direccion).toBe('Nueva direccion 2');
  });

  test('devuelve y valida el rol del usuario autenticado', async () => {
    const registerRes = await registerUser();
    const token = registerRes.body.data.token;

    const roleRes = await request(app)
      .get('/api/users/me/role')
      .set('Authorization', `Bearer ${token}`);
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.rol).toBe('customer');

    const validateRes = await request(app)
      .get('/api/users/me/role/customer')
      .set('Authorization', `Bearer ${token}`);
    expect(validateRes.status).toBe(200);
    expect(validateRes.body.data.valido).toBe(true);
  });

  test('bloquea listado de usuarios a roles no admin', async () => {
    const registerRes = await registerUser();
    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('permite a admin listar usuarios y actualizar roles', async () => {
    const userRes = await registerUser({ email: 'cliente@example.com' });
    const adminRes = await registerUser({
      nombre: 'Admin QA',
      email: 'admin.qa@example.com',
      rol: 'admin',
    });
    const adminToken = adminRes.body.data.token;

    const listRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(2);

    const roleRes = await request(app)
      .patch(`/api/users/${userRes.body.data.user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rol: 'manager' });

    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.rol).toBe('manager');
  });
});
