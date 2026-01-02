const { orderServiceClient } = require('../utils/httpClient');

async function listCart(token) {
  const res = await orderServiceClient.get('/cart', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function addCartItem(token, payload) {
  const res = await orderServiceClient.post('/cart/items', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function updateCartItem(token, productId, payload) {
  const res = await orderServiceClient.patch(`/cart/items/${productId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function deleteCartItem(token, productId) {
  const res = await orderServiceClient.delete(`/cart/items/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function listFavorites(token) {
  const res = await orderServiceClient.get('/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function addFavorite(token, productId) {
  const res = await orderServiceClient.post(`/favorites/${productId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function deleteFavorite(token, productId) {
  const res = await orderServiceClient.delete(`/favorites/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function listOrders(token) {
  const res = await orderServiceClient.get('/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data?.data || res.data;
}

async function checkout(token, payload = {}) {
  const res = await orderServiceClient.post(
    '/orders/checkout',
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data?.data || res.data;
}

module.exports = {
  listCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  listFavorites,
  addFavorite,
  deleteFavorite,
  listOrders,
  checkout,
};
