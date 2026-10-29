# MorrowCraft website: setup guide

The site has two parts:

1. **The website** (`index.html`, `assets/`, `site.config.js`). Plain files. Edit `site.config.js` to change anything: text, links, colours, tabs, rules, FAQ, staff ranks, leaderboard stats, Discord channels.
2. **The data service** (`service/`). A small Node.js program that reads LuckPerms, your leaderboard database and Discord, then writes JSON files into `data/`. The website shows whatever is in those files. Until the service runs, the site shows clearly labelled sample data.

Live server status needs nothing extra. The browser asks a public status service (mcstatus.io, then mcsrvstat.us as a backup) about `play.morrowcraft.net`.

---

## 1. Hosting on morrowcraft.net (Cloudflare)

Your domain is on Cloudflare, so the simplest setup is **Cloudflare Pages** connected to this GitHub repo. It works with a private repo and is free.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick `morrowcraft-web`.
2. Build settings: framework **None**, build command empty, output directory `/` (the repo root).
3. Under **Custom domains**, add `morrowcraft.net` and `www.morrowcraft.net`.
4. If the site is already deployed this way, you do not need to change anything. Cloudflare Pages also builds every branch as a **preview**, so the `new-site` branch gets its own preview link you can check before it goes live.

The data service commits fresh JSON files to the repo, and Cloudflare redeploys the site when that happens. The service skips a commit when nothing changed, so you only get a redeploy when something is new (a new post, a rank change, a leaderboard shift). With a 15 minute interval the leaderboard will change most runs. If you want fewer deploys, raise `INTERVAL_MINUTES` in `.env` (30 or 60 is fine).

`data.base` in `site.config.js` stays at `./data/`.

Alternative: if you would rather not redeploy on every data update, keep the data on a `data` branch of a public repo and set `data.base` to `https://raw.githubusercontent.com/MorrowCraft1/morrowcraft-web/data/data/`. That only works if the repo is public.

## 2. Move LuckPerms into MySQL/MariaDB (one time)

LuckPerms currently uses its default H2 file, which cannot be read safely while the server runs. Your leaderboard plugin already uses MySQL, so put LuckPerms in the same database server.

1. On the server, run `/lp export lp-backup` to save everything to a file.
2. Create an empty database for LuckPerms (BloomHost: panel → **Databases**).
3. Stop the server. In `plugins/LuckPerms/config.yml` set `storage-method: MariaDB` (or `MySQL`), then fill in the `data:` section (`address`, `database`, `username`, `password`). Keep `table-prefix: 'luckperms_'`.
4. Start the server and run `/lp import lp-backup`.
5. Check with `/lp user <you> info` that your groups are still there. Keep the old H2 file as a backup.

Do this at a quiet time. If you use more than one server on the same network, LuckPerms also has a `server` name setting; keep it the same as now.

## 3. Check your Discord bot

The bot you already have needs:

- It must be in your Discord server.
- **View Channel** and **Read Message History** on the news, updates and events channels.
- The **Message Content Intent** switched on (Discord developer portal → your application → **Bot**). Without it, Discord returns empty message text.

Never paste the bot token into chat, into `site.config.js` or into the repo. It only goes in `service/.env`.

## 4. Run the data service

It needs Node.js 20 or newer and an always-on place to run.

- **Where?** It must be able to reach your MySQL database. The easiest place is the same machine as the Minecraft server. I do not know what BloomHost allows, so ask their support whether you can run a Node.js program (some hosts sell "bot hosting" for this) and whether the MySQL database accepts connections from outside. If not, a small VPS or a PC that stays on works, as long as the database allows remote connections from it.

```
cd service
npm install
cp .env.example .env      # then fill in .env
npm run once              # test: refreshes one time and prints what worked
npm start                 # keeps running, refreshing every INTERVAL_MINUTES
```

`npm run once` prints one line per source (staff, leaderboard, news, updates, events). If one fails, the message says why, and the other sources still publish.

Create a database user that can only **read** (`SELECT`) the LuckPerms and leaderboard databases, and use that in `.env`.

To keep it running after you close the terminal, use a process manager such as `pm2` (`pm2 start index.js --name morrowcraft-data`).

### GitHub token

GitHub → Settings → Developer settings → Fine-grained tokens → generate a token for **only** `morrowcraft-web` with **Contents: Read and write**. Put it in `.env` as `GITHUB_TOKEN`.

### AI summaries (optional)

Add `ANTHROPIC_API_KEY` to `.env`. Messages longer than `minLength` (set in `site.config.js`) get a one or two sentence summary on the News tab, with the full message one click away. Each message is summarised once, so the cost is tiny. Leave the key empty to turn it off.

## 5. Where to change things

| To change | Edit in `site.config.js` |
|---|---|
| Server address, port, version | `server` |
| Store, Discord, voice chat, applications link, email | `links` |
| Brand colours | `colors` |
| Tab names and order | `tabs` |
| Staff ranks, order, colours, which block they appear in | `staff.ranks` |
| Leaderboard categories | `leaderboard.categories` (`key` must match zLeaderboard's category key) |
| Discord channels | `discord.feeds` |
| Rules, FAQ, features, join steps | `rules`, `faq`, `features`, `join` |

Notes on the staff roster:

- A player is listed once, under their highest rank. Ranks are read from **direct** group membership (`/lp user <name> parent add admin`), not inherited groups.
- Your Owner is whoever is in the LuckPerms group `owner`.
- The group `develepor` is spelled the way it is in LuckPerms. The website shows it as "Developer". If you rename the group, update the `key` too.
- The **Apply on Discord** button uses `links.applications`. Replace it with the direct link to your applications channel (right-click the channel in Discord → Copy Link).

## 6. Security checklist

- `service/.env` is git-ignored. Never commit it or send it to anyone.
- If a token is ever exposed, reset it: Discord developer portal (bot token), GitHub (token), your database user's password.
- The website only ever receives the finished JSON files. It never sees any password.
