const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { normalizeRole } = require('../utils/roles');
const { dbUri } = require('./mongoUri');

const CORE_USERS = [
  {
    nombre: 'Admin Demo',
    email: 'admin@sportdata.com',
    password: 'Admin1234',
    rol: 'admin',
    direccion: 'Calle Principal 1, Bilbao',
  },
  {
    nombre: 'Manager Demo',
    email: 'manager@sportdata.com',
    password: 'Manager1234',
    rol: 'manager',
    direccion: 'Calle Lateral 2, Madrid',
  },
];

function buildCustomerSeeds(count = 15) {
  const firstNames = [
    'Lucia',
    'Daniel',
    'Carmen',
    'Javier',
    'Nerea',
    'Sergio',
    'Marta',
    'Iker',
    'Ainhoa',
    'Hugo',
  ];
  const lastNames = [
    'Garcia',
    'Lopez',
    'Martinez',
    'Perez',
    'Sanchez',
    'Ruiz',
    'Vazquez',
    'Torres',
    'Diaz',
    'Navarro',
  ];
  const cities = ['Bilbao', 'Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Zaragoza'];
  const streets = ['Calle Mayor', 'Avenida del Deporte', 'Paseo Central', 'Calle Nueva', 'Camino Verde'];

  const customers = [];
  for (let i = 0; i < count; i += 1) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const city = cities[i % cities.length];
    const street = streets[i % streets.length];
    const streetNumber = 10 + i * 2;

    const nombre = `${first} ${last}`;
    const email = `${first}.${last}${i + 1}@sportdata.com`.toLowerCase();
    const password = `Cliente${String(i + 1).padStart(2, '0')}!`;
    const direccion = `${street} ${streetNumber}, ${city}`;

    customers.push({
      nombre,
      email,
      password,
      rol: 'customer',
      direccion,
    });
  }

  return customers;
}

const SAMPLE_USERS = [...CORE_USERS, ...buildCustomerSeeds()];

async function seedUsers() {
  const uri = dbUri();

  await mongoose.connect(uri);
  try {
    for (const sample of SAMPLE_USERS) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await User.findOne({ email: sample.email }).lean();
      if (exists) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const passwordHash = await bcrypt.hash(sample.password, 10);
      const user = new User({
        nombre: sample.nombre,
        email: sample.email,
        passwordHash,
        direccion: sample.direccion,
        rol: normalizeRole(sample.rol),
      });

      // eslint-disable-next-line no-await-in-loop
      await user.save();
      // eslint-disable-next-line no-console
      console.log(`Usuario demo creado: ${sample.email} / ${sample.password}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('Proceso de carga de usuarios demo finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error creando usuarios demo', error);
      process.exit(1);
    });
}

module.exports = {
  seedUsers,
};
