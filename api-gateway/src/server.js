const createApp = require('./app');
const { app: appConfig } = require('./config/env');

const app = createApp();

app.listen(appConfig.port, () => {
  console.log(`API Gateway escuchando en el puerto ${appConfig.port}`);
});
