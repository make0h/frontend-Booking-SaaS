import axios from 'axios';

// URL limpia apuntando a la IP de tu compu
const api = axios.create({
  baseURL: 'http://192.168.1.8:5218/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;