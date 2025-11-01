const { userServiceClient } = require('../utils/httpClient');

async function registerUser(payload) {
  const response = await userServiceClient.post('/auth/register', payload);
  return response.data;
}

async function loginUser(payload) {
  const response = await userServiceClient.post('/auth/login', payload);
  return response.data;
}

async function getProfile(token) {
  const response = await userServiceClient.get('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

async function updateProfile(token, payload) {
  const response = await userServiceClient.put('/users/me', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

async function listUsers(token) {
  const response = await userServiceClient.get('/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  listUsers,
};
