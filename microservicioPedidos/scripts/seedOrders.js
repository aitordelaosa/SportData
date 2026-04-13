#!/usr/bin/env node

const path = require('path');

const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Order = require('../src/models/Order');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ORDERS_MONGO_URI =
  process.env.ORDERS_MONGO_URI || 'mongodb://127.0.0.1:27019/sportdata_orders';
const USERS_MONGO_URI =
  process.env.USERS_MONGO_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/sportdata_usuarios';
const PRODUCT_SERVICE_URL = process.env.SEED_PRODUCT_SERVICE_URL || 'http://127.0.0.1:8002';

const START_DATE = new Date('2024-01-01T00:00:00.000Z');

const STATUSES = ['created', 'paid', 'shipped', 'delivered'];
const ITEM_COUNT_SEQUENCE = [1, 2, 3, 4];

function hasFlag(name) {
  return process.argv.slice(2).includes(name);
}

function getArg(name, fallback) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) return fallback;
  return value;
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(start, end) {
  const min = start.getTime();
  const max = end.getTime();
  return new Date(randomInt(min, max));
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function pickDistinctProducts(allProducts, count, requiredProduct) {
  const byId = new Map(allProducts.map((product) => [product.id, product]));
  const selected = [];
  const used = new Set();

  if (requiredProduct && byId.has(requiredProduct.id)) {
    selected.push(requiredProduct);
    used.add(requiredProduct.id);
  }

  while (selected.length < count) {
    const candidate = allProducts[randomInt(0, allProducts.length - 1)];
    if (used.has(candidate.id)) continue;
    selected.push(candidate);
    used.add(candidate.id);
  }

  return selected;
}

async function getUsers(usersConn) {
  const candidates = ['usuarios', 'users', 'usuario'];

  for (const collectionName of candidates) {
    const docs = await usersConn
      .collection(collectionName)
      .find({}, { projection: { _id: 1, nombre: 1, email: 1, direccion: 1 } })
      .toArray();

    if (docs.length) {
      return docs;
    }
  }

  return [];
}

function parseProductList(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

async function getAvailableProducts() {
  const client = axios.create({
    baseURL: PRODUCT_SERVICE_URL,
    timeout: 10000,
  });

  const all = [];
  let skip = 0;
  const limit = 100;

  while (true) {
    const response = await client.get('/products', { params: { skip, limit } });
    const batch = parseProductList(response.data);

    if (!batch.length) break;

    for (const raw of batch) {
      if (raw?.disponible === false) continue;

      const id = String(raw?.id ?? raw?._id ?? '');
      const precio = Number(raw?.precio);
      if (!id || !Number.isFinite(precio)) continue;

      all.push({
        id,
        nombre: raw?.nombre || `Producto ${id}`,
        precio: roundMoney(precio),
        imagen_url: raw?.imagen_url || '',
      });
    }

    if (batch.length < limit) break;
    skip += limit;
  }

  return all;
}

function buildOrder(user, baseProduct, itemCount, allProducts) {
  const safeCount = Math.max(1, Math.min(itemCount, allProducts.length));
  const selectedProducts = pickDistinctProducts(allProducts, safeCount, baseProduct);
  const createdAt = randomDateBetween(START_DATE, new Date());
  let total = 0;

  const items = selectedProducts.map((product) => {
    const quantity = randomInt(1, 3);
    total += roundMoney(product.precio * quantity);
    return {
      productId: product.id,
      nombre: product.nombre,
      precio: product.precio,
      quantity,
      imagen_url: product.imagen_url,
    };
  });

  return {
    userId: String(user._id),
    total: roundMoney(total),
    status: STATUSES[randomInt(0, STATUSES.length - 1)],
    items,
    shipping: {
      nombre: user.nombre || 'Usuario',
      apellidos: '',
      direccion: user.direccion || 'Sin direccion',
      ciudad: '',
      provincia: '',
      pais: 'ES',
      cp: '',
      telefono: '',
      email: user.email || '',
      notas: '',
      fechaNacimiento: '',
    },
    payment: {
      method: 'card',
      brand: 'Visa',
      last4: String(randomInt(1000, 9999)),
      holder: user.nombre || 'Usuario',
      expMonth: '12',
      expYear: String(new Date().getFullYear() + 2),
      country: 'ES',
      remember: false,
    },
    createdAt,
    updatedAt: createdAt,
  };
}

async function main() {
  const clearExisting = hasFlag('--clear');
  const dryRun = hasFlag('--dry-run');
  const repeat = parsePositiveInt(getArg('--repeat', '1'), 1);

  await mongoose.connect(ORDERS_MONGO_URI);
  const usersConn = await mongoose.createConnection(USERS_MONGO_URI).asPromise();

  try {
    const users = await getUsers(usersConn);
    if (!users.length) {
      throw new Error(`No se encontraron usuarios en ${USERS_MONGO_URI}`);
    }

    const products = await getAvailableProducts();
    if (!products.length) {
      throw new Error(`No se encontraron productos disponibles en ${PRODUCT_SERVICE_URL}`);
    }

    const totalToGenerate = users.length * products.length * repeat;

    // eslint-disable-next-line no-console
    console.log(
      `[seed-orders] Usuarios: ${users.length}. Productos disponibles: ${products.length}. Pedidos a generar: ${totalToGenerate}.`,
    );

    if (dryRun) return;

    if (clearExisting) {
      await Order.deleteMany({});
    }

    const batchSize = 1000;
    let batch = [];
    let inserted = 0;
    let orderIndex = 0;

    for (let round = 0; round < repeat; round += 1) {
      for (const user of users) {
        for (const product of products) {
          const itemCount = ITEM_COUNT_SEQUENCE[orderIndex % ITEM_COUNT_SEQUENCE.length];
          batch.push(buildOrder(user, product, itemCount, products));
          orderIndex += 1;

          if (batch.length >= batchSize) {
            const docs = await Order.insertMany(batch, { ordered: false });
            inserted += docs.length;
            batch = [];
          }
        }
      }
    }

    if (batch.length) {
      const docs = await Order.insertMany(batch, { ordered: false });
      inserted += docs.length;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[seed-orders] Insertados ${inserted} pedidos en ${ORDERS_MONGO_URI} (rango fechas: 2024-01-01 a hoy).`,
    );
  } finally {
    await usersConn.close();
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[seed-orders] Error:', error.message);
  process.exit(1);
});

