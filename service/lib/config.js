import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const serviceDir = path.resolve(here, '..');
export const repoDir = path.resolve(serviceDir, '..');

/** Reads site.yml (the one file you edit) so group names, stat keys and channel IDs live in one place.
 *  Uses the same js-yaml copy the website loads, so there is nothing extra to install. */
export function loadSite() {
  const jsyaml = createRequire(import.meta.url)(path.join(repoDir, 'assets', 'vendor', 'js-yaml.min.js'));
  const file = path.join(repoDir, 'site.yml');
  let site;
  try { site = jsyaml.safeLoad(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new Error(`site.yml has a mistake near line ${(e.mark && e.mark.line + 1) || '?'}: ${e.reason || e.message}`); }
  if (!site || typeof site !== 'object') throw new Error('site.yml is empty');
  return site;
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
