/**
 * Dev-only helper: logs the current browser origin so devs can copy it
 * straight into the OAuth client's "Authorized JavaScript origins" list.
 * No-op in production.
 */

const DEV_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:3000',
]);

let warned = false;

export function warnIfOriginNotWhitelisted() {
  if (!import.meta.env.DEV) return;
  if (warned) return;
  if (typeof window === 'undefined') return;
  warned = true;

  const origin = window.location.origin;
  if (DEV_ORIGINS.has(origin)) return;

  // eslint-disable-next-line no-console
  console.info(
    `%c[Google OAuth]%c Origin not in known-dev list: %c${origin}`,
    'color:#c2410c;font-weight:600',
    'color:inherit',
    'color:#0f766e;font-weight:600'
  );
  // eslint-disable-next-line no-console
  console.info(
    'Add it to "Authorized JavaScript origins" on your OAuth client:\n' +
      '  https://console.cloud.google.com/apis/credentials'
  );
}