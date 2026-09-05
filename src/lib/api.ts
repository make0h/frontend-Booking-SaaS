import axios from 'axios';

// URL limpia apuntando a la IP de tu compu
const api = axios.create({
  baseURL: 'https://bookingsaas-x6pk.onrender.com/api',
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