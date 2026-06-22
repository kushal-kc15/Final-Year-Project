import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken, setOnUnauthorized } from '../lib/api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'bk.auth.v1';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (val) => {
  if (val) localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  else localStorage.removeItem(STORAGE_KEY);
};

const responseValue = (data, key, fallback = null) =>
  Object.prototype.hasOwnProperty.call(data ?? {}, key) ? data[key] : fallback;

/**
 * Translate a backend auth response into the shape our context stores.
 * Backend returns `{ access, refresh, user, active_organization, role, ... }`
 * but the context historically stores it as `{ user, organization, token, role, currency }`.
 */
const normalizeAuthResponse = (data) => {
  if (!data) return null;
  return {
    user: data.user ?? null,
    organization: responseValue(data, 'active_organization'),
    token: data.access ?? data.token ?? null,
    role: responseValue(data, 'role', data.user?.role ?? null),
  };
};

const normalizeMeResponse = (data, token) => {
  if (!data) return null;
  const organization = Object.prototype.hasOwnProperty.call(data, 'active_organization')
    ? data.active_organization
    : responseValue(data, 'organization');
  return {
    user: data,
    organization,
    token,
    role: responseValue(data, 'role'),
  };
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = readStored();
    if (stored?.token) setAccessToken(stored.token);
    return {
      user: stored?.user ?? null,
      organization: stored?.organization ?? null,
      token: stored?.token ?? null,
      role: stored?.role ?? null,
      currency: stored?.currency ?? 'NPR',
      loading: true,
    };
  });

  const applyAuth = useCallback((payload) => {
    if (!payload) {
      setAccessToken(null);
      setState((s) => ({ ...s, user: null, organization: null, token: null, role: null, loading: false }));
      writeStored(null);
      return;
    }
    let next;
    setState((current) => {
      const user = Object.prototype.hasOwnProperty.call(payload, 'user') ? payload.user : current.user;
      const organization = Object.prototype.hasOwnProperty.call(payload, 'organization')
        ? payload.organization
        : current.organization;
      const token = Object.prototype.hasOwnProperty.call(payload, 'token') ? payload.token : current.token;
      const role = Object.prototype.hasOwnProperty.call(payload, 'role') ? payload.role : current.role;
      const currency = Object.prototype.hasOwnProperty.call(payload, 'currency') ? payload.currency : current.currency;

      if (token) setAccessToken(token);
      next = {
        user,
        organization,
        token,
        role: role ?? user?.role ?? null,
        currency: currency ?? 'NPR',
        loading: false,
      };
      writeStored({ user, organization, token, role: next.role, currency: next.currency });
      return next;
    });
    return next;
  }, []);

  // Hydrate session on mount.
  useEffect(() => {
    let cancelled = false;
    const stored = readStored();
    if (!stored?.token) {
      setState((s) => ({ ...s, loading: false }));
      return undefined;
    }
    api.get('/auth/me/')
      .then((res) => {
        if (cancelled) return;
        const stored2 = readStored() || {};
        const normalized = normalizeMeResponse(res.data, stored.token);
        applyAuth({
          ...normalized,
          currency: stored2.currency ?? 'NPR',
        });
      })
      .catch(() => {
        if (cancelled) return;
        applyAuth(null);
      });
    return () => { cancelled = true; };
  }, [applyAuth]);

  // Wire 401s.
  useEffect(() => {
    setOnUnauthorized(() => applyAuth(null));
  }, [applyAuth]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    const data = res.data;
    // The backend may signal a 2FA challenge instead of issuing tokens.
    if (data?.requires_2fa) {
      return data; // caller handles the 2FA branch
    }
    const auth = normalizeAuthResponse(data);
    applyAuth(auth);
    if (auth?.token) {
      const me = await api.get('/auth/me/');
      applyAuth(normalizeMeResponse(me.data, auth.token));
    }
    return data;
  }, [applyAuth]);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register/', payload);
    const normalized = normalizeAuthResponse(res.data);
    if (normalized?.token) applyAuth(normalized);
    return res.data;
  }, [applyAuth]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout/'); } catch { /* ignore */ }
    applyAuth(null);
  }, [applyAuth]);

  const googleLogin = useCallback(async (credential) => {
    const res = await api.post('/auth/google/', { credential });
    const data = res.data;
    if (data?.requires_2fa) return data;
    const auth = normalizeAuthResponse(data);
    applyAuth(auth);
    if (auth?.token) {
      const me = await api.get('/auth/me/');
      applyAuth(normalizeMeResponse(me.data, auth.token));
    }
    return data;
  }, [applyAuth]);

  const sendTwoFactorCode = useCallback(async ({ email, password }) => {
    const res = await api.post('/auth/send-2fa-code/', { email, password });
    return res.data;
  }, []);

  const verifyTwoFactorCode = useCallback(async ({ email, otpCode, rememberMe = false }) => {
    const res = await api.post('/auth/verify-2fa-code/', {
      email,
      otp_code: otpCode,
      remember_me: rememberMe,
    });
    const auth = normalizeAuthResponse(res.data);
    applyAuth(auth);
    if (auth?.token) {
      const me = await api.get('/auth/me/');
      applyAuth(normalizeMeResponse(me.data, auth.token));
    }
    return res.data;
  }, [applyAuth]);

  const resendVerification = useCallback(async (email) => {
    const res = await api.post('/auth/resend-verification/', { email });
    return res.data;
  }, []);

  const refreshSession = useCallback(async () => {
    const current = readStored();
    if (!current?.token) return null;
    const res = await api.get('/auth/me/');
    const next = normalizeMeResponse(res.data, current.token);
    applyAuth({
      ...next,
      currency: current.currency ?? 'NPR',
    });
    return next;
  }, [applyAuth]);

  const setOrganization = useCallback((organization) => {
    setState((s) => {
      const next = { ...s, organization };
      writeStored({ user: s.user, organization, token: s.token, role: s.role, currency: s.currency });
      return next;
    });
  }, []);

  const setRole = useCallback((role) => {
    setState((s) => {
      const next = { ...s, role };
      writeStored({ user: s.user, organization: s.organization, token: s.token, role, currency: s.currency });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      googleLogin,
      sendTwoFactorCode,
      verifyTwoFactorCode,
      resendVerification,
      refreshSession,
      setOrganization,
      setRole,
      applyAuth,
    }),
    [state, login, register, logout, googleLogin, sendTwoFactorCode, verifyTwoFactorCode, resendVerification, refreshSession, setOrganization, setRole, applyAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
