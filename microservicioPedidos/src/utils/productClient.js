const axios = require('axios');

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://product-service:8002';

const client = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  timeout: 8000,
});

async function getProduct(productId) {
  const response = await client.get(`/products/${productId}`);
  return response.data?.data || response.data;
}

module.exports = {
  getProduct,
};
