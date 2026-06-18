#!/usr/bin/env node
/**
 * tools/check-oauth.mjs
 *
 * Quick sanity check for the Google Sign-In configuration:
 *   1. Reads VITE_GOOGLE_CLIENT_ID from .env
 *   2. Reads the Vite dev-server port from vite.config.js
 *   3. Computes the exact origin(s) the dev server will use
 *   4. Prints a direct link to the OAuth client config in Cloud Console
 *   5. Cross-checks against the public OAuth 2.0 discovery endpoint so you
 *      can confirm the client ID is at least well-formed and accepted by
 *      Google's authorization server.
 *
 * Usage:
 *   node tools/check-oauth.mjs
 *   node tools/check-oauth.mjs --port 5173
 *
 * It does NOT modify anything; it just reports.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const c = (color, s) => `${ANSI[color]}${s}${ANSI.reset}`;
const ok = (s) => c('green', `✓ ${s}`);
const warn = (s) => c('yellow', `! ${s}`);
const err = (s) => c('red', `✗ ${s}`);

const argvPort = Number(
  (process.argv.find((a) => a.startsWith('--port=')) ?? '').slice('--port='.length),
) || null;

function readEnv() {
  return readFile(resolve(ROOT, '.env'), 'utf8')
    .then((txt) => {
      const out = {};
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
      return out;
    })
    .catch(() => ({}));
}

async function readVitePort() {
  try {
    const txt = await readFile(resolve(ROOT, 'vite.config.js'), 'utf8');
    const m = txt.match(/port:\s*(\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

function clientIdLooksValid(id) {
  return typeof id === 'string'
    && /^[0-9]+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(id);
}

async function probeDiscovery() {
  // This is the same endpoint Google itself uses to validate issuer config.
  // It doesn't reveal client secret, but a 404 here would mean the
  // authorization server is unreachable (very unusual).
  try {
    const res = await fetch(
      'https://accounts.google.com/.well-known/openid-configuration',
      { method: 'GET' },
    );
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}

(async () => {
  console.log(c('bold', '\nGoogle Sign-In configuration check\n'));

  const env = await readEnv();
  const vitePort = await readVitePort();
  const port = argvPort ?? vitePort ?? 5173;
  const clientId = env.VITE_GOOGLE_CLIENT_ID;

  // 1. Client ID
  if (!clientId) {
    console.log(err(`VITE_GOOGLE_CLIENT_ID is missing from .env`));
    console.log(`  Add a line like:  VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com\n`);
  } else if (!clientIdLooksValid(clientId)) {
    console.log(warn(`VITE_GOOGLE_CLIENT_ID looks malformed: ${clientId}`));
    console.log(`  Expected format:  1234567890-abc...xyz.apps.googleusercontent.com\n`);
  } else {
    console.log(ok(`VITE_GOOGLE_CLIENT_ID set: ${c('dim', clientId)}`));
  }

  // 2. Vite port
  if (vitePort) {
    console.log(ok(`Vite dev port from vite.config.js: ${vitePort}`));
  } else {
    console.log(warn(`Could not detect Vite port; using --port or default 5173`));
  }

  // 3. Origins to whitelist
  const origins = [
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ];
  console.log(c('bold', '\nOrigins to whitelist in Cloud Console →'));
  for (const o of origins) console.log(`  ${c('cyan', o)}`);

  // 4. Direct link to the OAuth client
  if (clientIdLooksValid(clientId)) {
    const url = `https://console.cloud.google.com/apis/credentials/oauthclient/${clientId}`;
    console.log(c('bold', '\nDirect link to edit this client →'));
    console.log(`  ${c('blue', url)}`);
  }

  // 5. Network probe
  console.log('');
  const probe = await probeDiscovery();
  if (probe.ok) {
    console.log(ok(`Google discovery endpoint reachable (HTTP ${probe.status})`));
  } else {
    console.log(err(`Google discovery endpoint unreachable (HTTP ${probe.status}${probe.error ? `: ${probe.error}` : ''})`));
  }

  // 6. Checklist
  console.log(c('bold', '\nCommon pitfalls checklist →'));
  console.log('  1. Origin above is in "Authorized JavaScript origins"');
  console.log('  2. App type is "Web application" (not Android/iOS/Desktop)');
  console.log(`  3. Your email (${c('cyan', 'kckushal164@gmail.com')}) is added as a Test user if the consent screen is still in "Testing" mode`);
  console.log('  4. You waited 5–10 minutes after saving the client config');
  console.log('  5. You hard-refreshed (Ctrl+Shift+R) and cleared site cookies');
  console.log('  6. You are NOT using an http:// origin in production (must be https://)\n');
})();
