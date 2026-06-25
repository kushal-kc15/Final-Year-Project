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

const normalizeMemberships = (memberships) => {
  if (!Array.isArray(memberships)) return [];
  return memberships
    .map((membership) => {
      const organization =
        membership.organization && typeof membership.organization === 'object'
          ? membership.organization
          : {
              id: membership.organization_id ?? membership.organization,
              name: membership.organization_name ?? membership.name ?? 'Workspace',
            };
      if (!organization?.id) return null;
      return {
        ...membership,
        organization,
        organization_id: membership.organization_id ?? organization.id,
        organization_name: membership.organization_name ?? organization.name,
        role: membership.role ?? null,
      };
    })
    .filter(Boolean);
};

const roleForOrganization = (memberships, organization) => {
  if (!organization?.id) return null;
  return memberships.find((membership) => String(membership.organization_id) === String(organization.id))?.role ?? null;
};

const organizationFromOnlyMembership = (memberships) =>
  memberships.length === 1 ? memberships[0].organization : null;

const normalizeAuthResponse = (data) => {
  if (!data) return null;
  const memberships = normalizeMemberships(responseValue(data, 'memberships', []));
  const organization = responseValue(data, 'active_organization') ?? organizationFromOnlyMembership(memberships);
  return {
    user: data.user ?? null,
    organization,
    memberships,
    token: data.access ?? data.token ?? null,
    role: responseValue(data, 'role', roleForOrganization(memberships, organization) ?? data.user?.role ?? null),
  };
};

const normalizeMeResponse = (data, token) => {
  if (!data) return null;
  const memberships = normalizeMemberships(responseValue(data, 'memberships', []));
  const organization = Object.prototype.hasOwnProperty.call(data, 'active_organization')
    ? data.active_organization ?? organizationFromOnlyMembership(memberships)
    : responseValue(data, 'organization');
  return {
    user: data,
    organization,
    memberships,
    token,
    role: responseValue(data, 'role', roleForOrganization(memberships, organization)),
  };
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = readStored();
    if (stored?.token) setAccessToken(stored.token);
    return {
      user: stored?.user ?? null,
      organization: stored?.organization ?? null,
      memberships: normalizeMemberships(stored?.memberships ?? []),
      token: stored?.token ?? null,
      role: stored?.role ?? null,
      currency: stored?.currency ?? 'NPR',
      loading: true,
    };
  });

  const applyAuth = useCallback((payload) => {
    if (!payload) {
      setAccessToken(null);
      setState((s) => ({ ...s, user: null, organization: null, memberships: [], token: null, role: null, loading: false }));
      writeStored(null);
      return;
    }
    let next;
    setState((current) => {
      const user = Object.prototype.hasOwnProperty.call(payload, 'user') ? payload.user : current.user;
      const payloadOrganization = Object.prototype.hasOwnProperty.call(payload, 'organization')
        ? payload.organization
        : Object.prototype.hasOwnProperty.call(payload, 'active_organization')
          ? payload.active_organization
          : current.organization;
      const memberships = Object.prototype.hasOwnProperty.call(payload, 'memberships')
        ? normalizeMemberships(payload.memberships)
        : current.memberships;
      const organization = payloadOrganization ?? organizationFromOnlyMembership(memberships);
      const token = Object.prototype.hasOwnProperty.call(payload, 'token') ? payload.token : current.token;
      const role = Object.prototype.hasOwnProperty.call(payload, 'role') ? payload.role : current.role;
      const currency = Object.prototype.hasOwnProperty.call(payload, 'currency') ? payload.currency : current.currency;

      if (token) setAccessToken(token);
      next = {
        user,
        organization,
        memberships,
        token,
        role: role ?? roleForOrganization(memberships, organization) ?? user?.role ?? null,
        currency: currency ?? 'NPR',
        loading: false,
      };
      writeStored({ user, organization, memberships, token, role: next.role, currency: next.currency });
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
      const role = roleForOrganization(s.memberships, organization) ?? s.role;
      const next = { ...s, organization, role };
      writeStored({ user: s.user, organization, memberships: s.memberships, token: s.token, role, currency: s.currency });
      return next;
    });
  }, []);

  const setRole = useCallback((role) => {
    setState((s) => {
      const next = { ...s, role };
      writeStored({ user: s.user, organization: s.organization, memberships: s.memberships, token: s.token, role, currency: s.currency });
      return next;
    });
  }, []);

  const switchOrganization = useCallback(async (organizationId) => {
    const res = await api.post(`/organizations/${organizationId}/switch/`);
    const current = readStored();
    const next = {
      organization: responseValue(res.data, 'active_organization'),
      memberships: responseValue(res.data, 'memberships', []),
      role: responseValue(res.data, 'role'),
      token: current?.token ?? state.token,
    };
    applyAuth(next);
    return res.data;
  }, [applyAuth, state.token]);

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
      switchOrganization,
      applyAuth,
    }),
    [state, login, register, logout, googleLogin, sendTwoFactorCode, verifyTwoFactorCode, resendVerification, refreshSession, setOrganization, setRole, switchOrganization, applyAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
