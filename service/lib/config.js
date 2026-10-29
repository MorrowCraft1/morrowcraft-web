import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serviceDir = path.resolve(here, '..');
export const repoDir = path.resolve(serviceDir, '..');

/** Reads site.config.js (the one file you edit) so group names, stat keys and channel IDs live in one place. */
export function loadSite() {
  const file = path.join(repoDir, 'site.config.js');
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { timeout: 1000 });
  if (!sandbox.window.SITE) throw new Error('site.config.js did not define window.SITE');
  return sandbox.window.SITE;
}

/** Minimal .env loader (no extra dependency). Real environment variables win. */
export function loadEnv() {
  const file = path.join(serviceDir, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const val = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

export const env = (name, fallback = '') => (process.env[name] ?? fallback);

/** Table names are put into SQL text, so only allow plain identifier characters. */
export function safeIdent(value, label) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`${label} may only contain letters, numbers and underscores`);
  return value;
}
