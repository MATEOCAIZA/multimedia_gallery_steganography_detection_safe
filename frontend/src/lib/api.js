import axios from 'axios';

// En desarrollo usa localhost, en producción usa la variable de Vite para Render
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN' // INDISPENSABLE para enviar el JSESSIONID del login
});

// Interceptor para añadir el token CSRF manualmente si Axios no lo detecta solo
api.interceptors.request.use(config => {
  const token = document.cookie.split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

export const apiUrl = (path) => `${API_BASE_URL}${path}`;