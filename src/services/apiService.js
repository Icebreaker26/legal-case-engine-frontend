import axios from 'axios';

const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la sesión ha expirado (401 o 403), redirigir al login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiService;
