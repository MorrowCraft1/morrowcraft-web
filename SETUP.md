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

`data.base` in `site.config.js` stays at `/data/`.

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

## 3b. Automatic refresh with GitHub Actions (recommended)

The file `.github/workflows/refresh-data.yml` runs the data service on GitHub every 15 minutes, for free, so nothing has to stay switched on at home. It needs these **secrets**: GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret | Value |
|---|---|
| `DB_HOST` | `fsn-261018.bloom.host` (no port) |
| `ZLB_DB_NAME` | the leaderboard database name |
| `ZLB_DB_USER` | its username |
| `ZLB_DB_PASS` | its password |
| `LP_DB_NAME` | the LuckPerms database name |
| `LP_DB_USER` | its username |
| `LP_DB_PASS` | its password |
| `DISCORD_BOT_TOKEN` | your bot token |
| `ANTHROPIC_API_KEY` | optional, for news summaries |

Then open the **Actions** tab, choose **Refresh website data**, and click **Run workflow** to test it. The log shows one line per source. You do not need to create a GitHub token, because the job uses the one GitHub provides.

The database must allow connections from outside (BloomHost: "Allowed connections from" = `%`). GitHub's servers have changing addresses, so it cannot be limited to one address. Use strong, unique database passwords.

## 4. Run the data service yourself (alternative)

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

## Editing the website (no coding)

Everything you can change is in **`site.config.js`**. To edit it on GitHub: open the repo, click the file, click the **pencil** icon, change the text, then click **Commit changes**. Cloudflare updates the live site within a minute or two.

- **Add an FAQ question:** find `faq: [`. Copy one whole block from `{ q:` to its `},`, paste it under the last one, and change the question (`q`) and answer (`a`). Keep the quote marks and the comma.
- **Add or edit a feature on the Home page:** find `features: [`. Copy one line, paste it under the last one and change `title` and `text`.
- **Add a picture to a feature:** on GitHub open the `assets` folder, then `features` (create it with **Add file, Create new file** and a name like `features/readme.txt` if it does not exist). Click **Add file, Upload files**, upload your image and commit. Then set `image: "/assets/features/yourfile.png"` on that feature.
- **Add a console video link on the Bedrock page:** find the `links: [` line inside the Bedrock entry and add `{ label: "Console video guide", url: "https://..." }`.

Page addresses: Home is `morrowcraft.net`. The others are `morrowcraft.net/join`, `/news`, `/leaderboard`, `/staff`, `/rules` and `/faq`. This relies on Cloudflare Pages treating the site as a single-page app, which it does when the project has **no `404.html` file**. Do not add one.

## 6. Security checklist

- `service/.env` is git-ignored. Never commit it or send it to anyone.
- If a token is ever exposed, reset it: Discord developer portal (bot token), GitHub (token), your database user's password.
- The website only ever receives the finished JSON files. It never sees any password.
