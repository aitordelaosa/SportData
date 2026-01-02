const axios = require('axios');
const { services } = require('../config/env');

const userServiceClient = axios.create({
  baseURL: services.user,
  timeout: 8000,
});

const productServiceClient = axios.create({
  baseURL: services.product,
  timeout: 8000,
});

const orderServiceClient = axios.create({
  baseURL: services.order,
  timeout: 8000,
});

module.exports = {
  userServiceClient,
  productServiceClient,
  orderServiceClient,
};
