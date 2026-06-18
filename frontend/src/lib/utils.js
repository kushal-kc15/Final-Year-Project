import clsx from 'clsx';

export const cn = (...args) => clsx(...args);

/** Safely read a value from an object via dot path. */
export const dig = (obj, path, fallback = null) => {
  if (!obj || !path) return fallback;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  return cur ?? fallback;
};

export const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';

/** Stable hue from a string — for avatars, category chips. */
export const hueFromString = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const debounce = (fn, ms = 200) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
