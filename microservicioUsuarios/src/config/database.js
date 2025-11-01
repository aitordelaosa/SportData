const mongoose = require('mongoose');
const { mongo, app } = require('./env');

mongoose.connection.on('connected', () => {
  if (app.env !== 'test') {
    console.log('Conectado a MongoDB');
  }
});

mongoose.connection.on('error', (error) => {
  console.error('Error en la conexión a MongoDB', error);
});

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  return mongoose.connect(mongo.uri, {
    autoIndex: app.env !== 'production',
  });
}

module.exports = {
  connectDatabase,
};
