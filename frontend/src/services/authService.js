import api from './api';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);

    // ✅ Store tokens correctly
    if (response.data.access) {
      localStorage.setItem(TOKEN_KEY, response.data.access);
      localStorage.setItem(REFRESH_KEY, response.data.refresh);
    }

    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  // ✅ Correct authentication check
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;