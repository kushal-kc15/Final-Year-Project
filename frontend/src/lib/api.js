import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  timeout: 10000, // 10s – generous for this app
});

let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;

// Request interceptor – adds auth token and organization header.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // Add organization ID from stored auth state.
  try {
    const stored = JSON.parse(localStorage.getItem('bk.auth.v1') || 'null');
    const orgId = stored?.organization?.id;
    const explicitOrgHeader =
      config.headers?.['X-Organization-Id'] ||
      config.headers?.['X-Organization-ID'] ||
      config.headers?.['x-organization-id'] ||
      (typeof config.headers?.get === 'function' &&
        (config.headers.get('X-Organization-Id') || config.headers.get('X-Organization-ID')));
    if (orgId && !explicitOrgHeader) {
      config.headers['X-Organization-Id'] = String(orgId);
    }
  } catch {
    // Ignore malformed local auth state; the auth context will clear it.
  }

  return config;
});

let onUnauthorized = null;
export const setOnUnauthorized = (fn) => { onUnauthorized = fn; };

// Response interceptor – handles 401 errors.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      if (onUnauthorized) {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
