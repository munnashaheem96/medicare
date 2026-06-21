// src/api/client.js
// Axios instance with base URL and JWT auto-attach

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('medi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (token expired or missing)
// DO NOT call window.location.reload() — it causes an infinite refresh loop.
// Instead, dispatch a custom event that AppContext listens to.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medi_token');
      localStorage.removeItem('medi_user');
      // Fire event so AppContext can update user state without page reload
      window.dispatchEvent(new Event('meditrack:session-expired'));
    }
    return Promise.reject(error);
  }
);

export default client;
