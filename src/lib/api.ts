import axios from 'axios';

const api = axios.create({
  // Vercel usará NEXT_PUBLIC_API_URL (Render). 
  // Tu PC usará localhost:5218 automáticamente al no encontrar la variable.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5218/api',
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