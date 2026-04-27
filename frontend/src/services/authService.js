import api from './api';

const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  // Login user (email-based)
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

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email/', { token });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/request-password-reset/', { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password/', {
      token,
      new_password: newPassword
    });
    return response.data;
  },

  // Check password strength
  checkPasswordStrength: async (password) => {
    const response = await api.post('/auth/check-password-strength/', { password });
    return response.data;
  },
};

export default authService;