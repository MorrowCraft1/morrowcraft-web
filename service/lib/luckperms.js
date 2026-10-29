import mysql from 'mysql2/promise';
import { env, safeIdent } from './config.js';

/** One connection pool per database. BloomHost gives every database its own login, so each can have its own settings:
 *  ZLB_DB_HOST / ZLB_DB_USER / ZLB_DB_PASS  and  LP_DB_HOST / LP_DB_USER / LP_DB_PASS
 *  Anything not set falls back to the shared DB_HOST / DB_PORT / DB_USER / DB_PASS. */
export function makePool(prefix, database) {
  return mysql.createPool({
    host: env(`${prefix}_DB_HOST`, env('DB_HOST', 'localhost')),
    port: Number(env(`${prefix}_DB_PORT`, env('DB_PORT', '3306'))),
    user: env(`${prefix}_DB_USER`, env('DB_USER')),
    password: env(`${prefix}_DB_PASS`, env('DB_PASS')),
    database,
    connectionLimit: 2,
    connectTimeout: 10000
  });
}

/**
 * Staff roster from LuckPerms. A player counts as a rank when they have the
 * permission "group.<name>" set directly (not expired). Each player is listed
 * once, under the highest rank in site.config.js (top of the list = highest).
 * Returns { groupKey: [{ u: uuid, n: name }] }
 */
export async function fetchStaff(site, pool) {
  const prefix = safeIdent(env('LP_TABLE_PREFIX', 'luckperms_'), 'LP_TABLE_PREFIX');
  const order = site.staff.ranks.map(r => r.key);
  const perms = order.map(k => 'group.' + k);
  const now = Math.floor(Date.now() / 1000);

  const [rows] = await pool.query(
    `SELECT p.uuid AS uuid, p.username AS username, up.permission AS permission
       FROM ${prefix}user_permissions up
       JOIN ${prefix}players p ON p.uuid = up.uuid
      WHERE up.permission IN (?) AND up.value = 1 AND (up.expiry = 0 OR up.expiry > ?)`,
    [perms, now]
  );

  const best = new Map(); // uuid -> { rankIndex, username }
  for (const r of rows) {
    const idx = order.indexOf(String(r.permission).slice('group.'.length));
    if (idx < 0) continue;
    const cur = best.get(r.uuid);
    if (!cur || idx < cur.rankIndex) best.set(r.uuid, { rankIndex: idx, username: r.username });
  }

  const out = Object.fromEntries(order.map(k => [k, []]));
  for (const [uuid, v] of best) out[order[v.rankIndex]].push({ u: uuid, n: v.username });
  return out;
}

/** LuckPerms stores usernames in lower case. zLeaderboard keeps the real capitalisation, so borrow it. */
export async function fixNames(staff, zlbPool) {
  const uuids = Object.values(staff).flat().map(p => p.u);
  if (!uuids.length) return staff;
  const table = safeIdent(env('ZLB_TABLE', 'zleaderboard_stats'), 'ZLB_TABLE');
  try {
    const [rows] = await zlbPool.query(`SELECT DISTINCT uuid, username FROM ${table} WHERE uuid IN (?)`, [uuids]);
    const names = new Map(rows.map(r => [r.uuid, r.username]));
    for (const list of Object.values(staff)) {
      for (const p of list) p.n = names.get(p.u) || p.n;
    }
  } catch { /* names stay lower case, which is fine */ }
  for (const list of Object.values(staff)) list.sort((a, b) => a.n.localeCompare(b.n, 'en', { sensitivity: 'base' }));
  return staff;
}
