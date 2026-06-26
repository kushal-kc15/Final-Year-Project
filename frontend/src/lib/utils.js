import clsx from 'clsx';

export const cn = (...args) => clsx(...args);

/**
 * Safely read a value from an object via dot path.
 * @param {Object} obj - The object to traverse.
 * @param {string} path - Dot-separated path (e.g., 'user.profile.name').
 * @param {*} fallback - Value to return if path is not found.
 * @returns {*}
 */
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

/**
 * Returns initials from a full name.
 * @param {string} name - Full name.
 * @returns {string} Up to 2 uppercase initials.
 */
export const initials = (name = '') =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * Stable hue from a string – for avatars, category chips.
 * @param {string} s - Input string.
 * @returns {number} Hue value between 0 and 359.
 */
export const hueFromString = (s = '') => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
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