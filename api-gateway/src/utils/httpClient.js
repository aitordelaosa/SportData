const axios = require('axios');
const { services } = require('../config/env');

const userServiceClient = axios.create({
  baseURL: services.user,
  timeout: 8000,
});

module.exports = {
  userServiceClient,
};
