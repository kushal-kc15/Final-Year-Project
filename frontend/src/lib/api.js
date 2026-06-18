import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
  // A hung request (backend down, CORS, dropped socket) should never
  // pin a page on its loading state. 10s is generous for this app.
  timeout: 10000,
});

let accessToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  try {
    const stored = JSON.parse(localStorage.getItem('bk.auth.v1') || 'null');
    const orgId = stored?.organization?.id;
    if (orgId) config.headers['X-Organization-Id'] = String(orgId);
  } catch {
    // Ignore malformed local auth state; the auth context will clear it.
  }
  return config;
});

let onUnauthorized = null;
export const setOnUnauthorized = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
