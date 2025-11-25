const { productServiceClient } = require('../utils/httpClient');

async function listProducts(params = {}) {
  const response = await productServiceClient.get('/products', { params });
  return response.data;
}

async function getProduct(id) {
  const response = await productServiceClient.get(`/products/${id}`);
  return response.data;
}

async function createProduct(payload) {
  const response = await productServiceClient.post('/products', payload);
  return response.data;
}

async function updateProduct(id, payload) {
  const response = await productServiceClient.put(`/products/${id}`, payload);
  return response.data;
}

async function softDeleteProduct(id) {
  const response = await productServiceClient.delete(`/products/${id}`);
  return response.data;
}

async function updateStock(id, payload) {
  const response = await productServiceClient.patch(`/products/${id}/stock`, payload);
  return response.data;
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  softDeleteProduct,
  updateStock,
};
