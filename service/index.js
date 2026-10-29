/* MorrowCraft data service.
   Reads LuckPerms (staff), zLeaderboard (stats) and Discord (news/updates/events),
   then publishes small JSON files the website reads.

     node index.js          run forever, refreshing every INTERVAL_MINUTES
     node index.js --once   refresh one time and exit (handy for testing or cron)
*/
import { loadEnv, loadSite, env } from './lib/config.js';
import { makePool, fetchStaff, fixNames } from './lib/luckperms.js';
import { fetchLeaderboard } from './lib/leaderboard.js';
import { fetchFeed } from './lib/discord.js';
import { addSummaries } from './lib/summarise.js';
import { publish } from './lib/publish.js';

loadEnv();

async function refresh() {
  const site = loadSite();
  const now = new Date().toISOString();
  const files = {};
  const sources = {};   // what worked, for data/status.json (counts and codes only, never secrets)
  console.log(`[${now}] refreshing…`);

  // --- staff + leaderboard (database) ---
  let lpPool, zlbPool;
  try {
    zlbPool = makePool('ZLB', env('ZLB_DB_NAME', 'zleaderboard'));
    lpPool = makePool('LP', env('LP_DB_NAME', 'luckperms'));
    try {
      const staff = await fixNames(await fetchStaff(site, lpPool), zlbPool);
      files['staff.json'] = { updated: now, ranks: staff };
      sources.staff = { ok: true, count: Object.values(staff).flat().length };
      console.log(`  staff: ${sources.staff.count} people`);
    } catch (e) { sources.staff = { ok: false, code: e.code || 'error' }; console.warn('  staff failed:', e.message); }
    try {
      const categories = await fetchLeaderboard(site, zlbPool);
      files['leaderboard.json'] = { updated: now, categories };
      sources.leaderboard = { ok: true, count: Object.keys(categories).length };
      console.log(`  leaderboard: ${sources.leaderboard.count} categories`);
    } catch (e) { sources.leaderboard = { ok: false, code: e.code || 'error' }; console.warn('  leaderboard failed:', e.message); }
  } finally {
    await Promise.allSettled([lpPool && lpPool.end(), zlbPool && zlbPool.end()]);
  }

  // --- Discord feeds ---
  const token = env('DISCORD_BOT_TOKEN');
  if (!token) {
    console.warn('  discord skipped: DISCORD_BOT_TOKEN is empty');
  } else {
    for (const [key, feed] of Object.entries(site.discord.feeds)) {
      try {
        const got = await fetchFeed(feed.channelId, feed.limit || 8, token);
        let items = got.items;
        sources[key] = { ok: true, count: items.length, discordReturned: got.raw, messageTypes: got.types, channelType: got.channelType };
        if (site.discord.aiSummaries && site.discord.aiSummaries.enabled) {
          items = await addSummaries(items, site.discord.aiSummaries.minLength || 280);
        }
        files[`${key}.json`] = { updated: now, items };
        console.log(`  ${key}: ${items.length} posts`);
      } catch (e) { sources[key] = { ok: false, error: String(e.message).slice(0, 60).replace(/ for \/channels.*/, '') }; console.warn(`  ${key} failed:`, e.message); }
    }
  }

  files['status.json'] = { updated: now, sources };

  // Only publish what succeeded, so one broken source never wipes the others.
  if (Object.keys(files).length) await publish(files);
  else console.warn('  nothing to publish');
}

const once = process.argv.includes('--once');
const minutes = Math.max(5, Number(env('INTERVAL_MINUTES', '15')) || 15);

async function safeRefresh() {
  try { await refresh(); } catch (e) { console.error('Refresh failed:', e.message); }
}

await safeRefresh();
if (!once) {
  console.log(`Running. Next refresh every ${minutes} minutes. Press Ctrl+C to stop.`);
  setInterval(safeRefresh, minutes * 60 * 1000);
}
