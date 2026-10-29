import { env, safeIdent } from './config.js';

/**
 * Reads zLeaderboard's own table (uuid, username, stat_name, stat_value, display_value)
 * and returns the top N per category as { statKey: [{ u, n, v, d }] }.
 */
export async function fetchLeaderboard(site, pool) {
  const table = safeIdent(env('ZLB_TABLE', 'zleaderboard_stats'), 'ZLB_TABLE');
  const limit = Math.max(10, Math.min(1000, Number(site.leaderboard.limit) || 200));
  const out = {};
  for (const cat of site.leaderboard.categories) {
    const [rows] = await pool.query(
      `SELECT uuid, username, stat_value, display_value
         FROM ${table}
        WHERE stat_name = ? AND stat_value > 0
        ORDER BY stat_value DESC
        LIMIT ?`,
      [cat.key, limit]
    );
    out[cat.key] = rows.map(r => ({ u: r.uuid, n: r.username, v: Number(r.stat_value), d: r.display_value }));
  }
  return out;
}
