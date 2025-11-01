const createApp = require('./app');
const { app: appConfig } = require('./config/env');
const { connectDatabase } = require('./config/database');

const app = createApp();

async function startServer() {
  try {
    await connectDatabase();

    app.listen(appConfig.port, () => {
      console.log(`User service escuchando en el puerto ${appConfig.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servicio por un error en la base de datos', error);
    process.exit(1);
  }
}

startServer();
