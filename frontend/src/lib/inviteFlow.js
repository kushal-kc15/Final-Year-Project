const PENDING_INVITE_KEY = 'vm.pendingInviteToken';

export function getInvitePath(token) {
  return `/invite?token=${encodeURIComponent(token)}`;
}

export function getInviteLoginPath(token) {
  return `/login?next=${encodeURIComponent(getInvitePath(token))}`;
}

export function getInviteRegisterPath(token) {
  return `/register?invite=${encodeURIComponent(token)}`;
}

export function readPendingInviteToken() {
  try {
    return sessionStorage.getItem(PENDING_INVITE_KEY) || '';
  } catch {
    return '';
  }
}

export function storePendingInviteToken(token) {
  if (!token) return;
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, token);
  } catch {
    // sessionStorage can be unavailable in private/restricted contexts.
  }
}

export function clearPendingInviteToken() {
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // sessionStorage can be unavailable in private/restricted contexts.
  }
}

export function extractInviteTokenFromPath(path) {
  if (!path) return '';
  try {
    const url = new URL(path, window.location.origin);
    if (url.pathname !== '/invite') return '';
    return url.searchParams.get('token') || '';
  } catch {
    return '';
  }
}

export function getSafeNextPath(next) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '';
  return next;
}
