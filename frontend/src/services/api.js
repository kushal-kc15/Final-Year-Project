import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // Don't add auth header for public endpoints
    const publicEndpoints = [
      '/auth/register/',
      '/auth/login/',
      '/auth/check-password-strength/',
      '/auth/verify-email/',
      '/auth/resend-verification/',
      '/auth/request-password-reset/',
      '/auth/reset-password/',
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url.includes(endpoint)
    );
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

          return api(originalRequest);
        } catch (refreshError) {
          // ✅ Clear tokens but let React Router handle navigation
          // window.location.href caused a full browser reload — never use it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Dispatch a custom event so AuthContext can navigate cleanly
          window.dispatchEvent(new Event('auth:logout'));
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;