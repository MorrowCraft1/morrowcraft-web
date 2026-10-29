/* MorrowCraft site. Everything on the page is built from site.config.js
   plus the JSON files in data/ that the data service keeps fresh. */
(() => {
  'use strict';
  const S = window.SITE;
  if (!S) { document.body.textContent = 'site.config.js failed to load.'; return; }

  /* ---------------- helpers ---------------- */
  const $ = (sel, root = document) => root.querySelector(sel);

  function h(tag, props, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === false || v == null) continue;
      if (k === 'class') n.className = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) {
      if (c == null || c === false) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = ms => new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  /* Tiny, safe formatter: escape everything first, then allow `code`, **bold**, links. */
  function md(src) {
    return esc(src == null ? '' : src)
      .replace(/\{\{t:(\d+)\}\}/g, (m, t) => esc(fmtDate(Number(t) * 1000)))
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
      .replace(/\n/g, '<br>');
  }
  /* Discord-style text: headings, bullets, **bold**, __underline__, *italic*, ~~strike~~, ||spoilers||. */
  function inlineDiscord(line) {
    return md(line)
      .replace(/\|\|([^|]+)\|\|/g, '$1')
      .replace(/__([^_\n]+)__/g, '<u>$1</u>')
      .replace(/~~([^~\n]+)~~/g, '<s>$1</s>')
      .replace(/(^|[\s(>])\*([^*\n]+)\*(?=[\s).,!?<]|$)/g, '$1<em>$2</em>')
      .replace(/(^|[\s(>])_([^_\n]+)_(?=[\s).,!?<]|$)/g, '$1<em>$2</em>');
  }
  function discordEl(src, cls) {
    const root = h('div', { class: 'dm ' + (cls || '') });
    let list = null;
    for (const raw of String(src || '').split('\n')) {
      const line = raw.trimEnd();
      let m;
      if ((m = line.match(/^\s*[*-]\s+(.*)$/))) {
        if (!list) { list = h('ul', {}); root.append(list); }
        const li = h('li', {}); li.innerHTML = inlineDiscord(m[1]); list.append(li);
        continue;
      }
      list = null;
      if (!line.trim()) continue;
      const hd = line.match(/^(#{1,3})\s+(.*)$/);
      const n = h(hd ? 'h4' : 'p', {});
      n.innerHTML = inlineDiscord(hd ? hd[2] : line);
      root.append(n);
    }
    return root;
  }
  /* A short preview that ends on a whole line, so formatting is never cut in half. */
  function previewOf(text, max = 300) {
    const out = [];
    let len = 0;
    for (const line of text.split('\n')) {
      if (len > 0 && len + line.length > max) break;
      out.push(line); len += line.length + 1;
    }
    return out.join('\n').trim();
  }
  const mdEl = (tag, src, cls) => { const n = h(tag, { class: cls }); n.innerHTML = md(src); return n; };
  const tpl = s => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in S.server ? String(S.server[k]) : m));

  function timeAgo(iso) {
    const t = new Date(iso).getTime();
    if (!t) return '';
    const sec = Math.round((t - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    for (const [unit, s] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
      if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), unit);
    }
    return 'just now';
  }

  async function fetchJSON(url, ms = 6000) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } finally { clearTimeout(timer); }
  }
  const getData = file =>
    fetchJSON(S.data.base + file + '?v=' + Math.floor(Date.now() / 60000)).catch(() => null);

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }
  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied ' + (what || text));
    } catch {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
      toast(ok ? 'Copied ' + (what || text) : 'Press Ctrl+C to copy');
    }
  }
  const copyBtn = (text, what, label = 'Copy') =>
    h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => copy(text, what) }, label);

  const FALLBACK_HEAD = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Crect width='8' height='8' fill='%23152048'/%3E%3Crect x='2' y='2' width='4' height='4' fill='%239aa5c8'/%3E%3C/svg%3E";
  function head(id, name, size = 32) {
    const img = h('img', {
      class: 'head', width: size, height: size, alt: '', loading: 'lazy',
      src: 'https://mc-heads.net/avatar/' + encodeURIComponent(id || name) + '/' + size * 2
    });
    img.addEventListener('error', () => { img.src = FALLBACK_HEAD; }, { once: true });
    return img;
  }

  const sampleNotice = d => d && d.sample
    ? h('p', { class: 'notice' }, 'Showing sample data. Real data appears here once the data service is running (see SETUP.md).')
    : null;
  const updatedLabel = d => d && d.updated ? h('span', { class: 'updated' }, 'Updated ' + timeAgo(d.updated)) : null;

  function viewHead(title, sub, extra) {
    return h('div', { class: 'view-head' },
      h('div', {}, h('h1', { class: 'display' }, title), sub ? h('p', {}, sub) : null),
      extra || null);
  }
  function subTabs(items, onPick, label) {
    const wrap = h('div', { class: 'subtabs', role: 'tablist', 'aria-label': label });
    const btns = items.map(it => h('button', {
      class: 'chip', role: 'tab', type: 'button', 'aria-selected': 'false',
      onclick: () => pick(it.id)
    }, it.label));
    function pick(id) {
      items.forEach((it, i) => btns[i].setAttribute('aria-selected', String(it.id === id)));
      onPick(id);
    }
    wrap.append(...btns);
    return { el: wrap, pick };
  }

  /* ---------------- theme ---------------- */
  for (const [k, v] of Object.entries(S.colors || {})) {
    document.documentElement.style.setProperty('--' + k.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase(), v);
  }

  /* ---------------- header + footer ---------------- */
  const ids = S.tabs.map(t => t.id);
  const go = id => { if (location.hash === '#' + id) show(id); else location.hash = id; };

  function buildHeader() {
    const tabs = h('div', { class: 'tabs', id: 'tabs', role: 'tablist', 'aria-label': 'Pages' },
      S.tabs.map(t => h('button', {
        class: 'tab', role: 'tab', type: 'button', id: 'tab-' + t.id,
        'aria-controls': 'view-' + t.id, 'aria-selected': 'false', onclick: () => go(t.id)
      }, t.label)));
    const menu = h('button', {
      class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'tabs',
      onclick: e => e.currentTarget.setAttribute('aria-expanded', String(tabs.classList.toggle('open')))
    }, 'Menu');
    $('#site-header').append(h('div', { class: 'wrap bar-in' },
      h('a', { class: 'brand', href: '#' + ids[0] }, h('img', { src: S.logo, alt: '', width: 44, height: 44 }), h('span', {}, S.name)),
      tabs,
      h('div', { class: 'bar-cta' },
        h('a', { class: 'btn btn-green btn-sm', href: S.links.store, target: '_blank', rel: 'noopener' }, 'Store'),
        h('a', { class: 'btn btn-ghost btn-sm', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Discord')),
      menu));
  }

  function buildFooter() {
    const L = S.links;
    const nav = [['Store', L.store], ['Discord', L.discord], ['Voice chat', L.voice], ['Staff applications', L.applications]]
      .map(([t, u]) => h('a', { href: u, target: '_blank', rel: 'noopener' }, t));
    $('#site-footer').append(h('div', { class: 'wrap foot' },
      h('div', {},
        h('div', { class: 'display', style: 'font-size:1.8rem' }, S.name),
        h('p', {}, S.footer.storeNote),
        h('p', {}, S.footer.note)),
      h('div', {},
        h('nav', {}, nav),
        h('p', {}, 'Support: ', h('span', { class: 'mail' }, L.email), ' ', copyBtn(L.email, 'email', 'Copy email')))));
  }

  /* ---------------- views ---------------- */
  const builders = {};

  /* Live status (tries mcstatus.io, then mcsrvstat.us) */
  function buildStatus() {
    const pill = h('span', { class: 'pill' }, 'Checking');
    const count = h('div', { class: 'status-count' }, '–');
    const meta = h('div', { class: 'status-meta' }, '');
    const heads = h('div', { class: 'heads' });
    const card = h('div', { class: 'card status' },
      h('div', { class: 'status-top' }, h('span', { class: 'label' }, 'Live server status'), pill),
      count, meta, heads);

    function paint(s) {
      heads.replaceChildren();
      if (!s) {
        pill.className = 'pill'; pill.textContent = 'Status unavailable';
        count.textContent = '–'; meta.textContent = 'Could not reach the status service.';
        return;
      }
      if (!s.online) {
        pill.className = 'pill off'; pill.textContent = 'Offline';
        count.textContent = '–'; meta.textContent = 'The server is not responding right now.';
        return;
      }
      pill.className = 'pill on'; pill.textContent = 'Online';
      count.replaceChildren(String(s.players ?? 0), h('small', {}, ' / ' + (s.max ?? '?') + ' players'));
      meta.textContent = [s.version, s.motd].filter(Boolean).join(' · ');
      (s.list || []).slice(0, 14).forEach(p => {
        const img = head(p.uuid, p.name);
        img.title = p.name;
        heads.append(img);
      });
    }

    async function refresh() {
      const host = encodeURIComponent(S.server.javaHost);
      try {
        const r = await fetchJSON('https://api.mcstatus.io/v2/status/java/' + host);
        return paint({
          online: r.online, players: r.players && r.players.online, max: r.players && r.players.max,
          version: r.version && r.version.name_clean, motd: r.motd && r.motd.clean,
          list: ((r.players && r.players.list) || []).map(p => ({ name: p.name_clean || p.name_raw, uuid: p.uuid }))
        });
      } catch { /* try the second service */ }
      try {
        const r = await fetchJSON('https://api.mcsrvstat.us/3/' + host);
        return paint({
          online: r.online, players: r.players && r.players.online, max: r.players && r.players.max,
          version: r.version, motd: r.motd && r.motd.clean && r.motd.clean.join(' '),
          list: ((r.players && r.players.list) || []).map(p => ({ name: p.name, uuid: p.uuid }))
        });
      } catch { paint(null); }
    }
    refresh();
    setInterval(refresh, (S.server.statusRefreshSeconds || 60) * 1000);
    return card;
  }

  builders.home = () => {
    const v = $('#view-home');
    const [a, b] = S.name.replace(/(.)([A-Z])/, '$1\u0000$2').split('\u0000');
    const addr = (cls, k, host, port) => h('div', { class: 'addr-row ' + cls },
      h('span', { class: 'label k' }, k),
      h('span', { class: 'v' }, host, port ? h('span', { class: 'label', style: 'margin-left:10px' }, 'port ' + port) : null),
      copyBtn(host, k + ' address'));
    v.append(
      h('div', { class: 'hero' },
        h('div', {},
          h('div', { class: 'eyebrow label' }, S.tagline),
          h('h1', { class: 'display' }, h('span', {}, a), b ? h('span', {}, b) : null),
          h('p', { class: 'intro' }, S.intro),
          h('div', { class: 'addr' },
            addr('java', 'Java', S.server.javaHost),
            addr('bedrock', 'Bedrock', S.server.bedrockHost, S.server.bedrockPort)),
          h('p', { class: 'label', style: 'margin:12px 0 0' }, 'Java version ' + S.server.version),
          h('div', { class: 'hero-actions' },
            h('button', { class: 'btn btn-green', type: 'button', onclick: () => go('join') }, 'How to join'),
            h('a', { class: 'btn btn-red', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Join the Discord'))),
        h('div', { class: 'hero-art' },
          h('img', { class: 'logo', src: S.logo, alt: S.name + ' logo', width: 340, height: 340 }),
          buildStatus())),
      h('div', { class: 'tiles' }, S.tiles.map(t => h('div', { class: 'card tile ' + t.tone },
        h('h2', { class: 'display' }, t.title),
        h('p', {}, t.text),
        h('a', { class: 'btn ' + (t.tone === 'red' ? 'btn-red' : 'btn-green'), href: S.links[t.link], target: '_blank', rel: 'noopener' }, t.cta)))),
      h('div', { class: 'features' },
        h('h2', { class: 'display' }, 'What you get'),
        h('div', { class: 'feat-grid' }, S.features.map(f =>
          h('div', { class: 'feat' }, h('h3', {}, f.title), mdEl('p', f.text))))));
  };

  builders.join = () => {
    const v = $('#view-join');
    const panel = h('div', { class: 'card join-panel' });
    v.append(viewHead('How to join', 'Pick your platform. It takes about a minute.'));
    const tabs = subTabs(S.join.map(j => ({ id: j.id, label: j.label })), id => {
      const j = S.join.find(x => x.id === id);
      panel.replaceChildren(
        h('ol', { class: 'steps' }, j.steps.map(s => mdEl('li', tpl(s)))),
        h('div', { class: 'copy-list' }, j.copy.map(c => {
          const val = tpl(c.value);
          return h('div', { class: 'copy-box' },
            h('div', { style: 'flex:1;min-width:0' }, h('span', { class: 'label l' }, c.label), h('span', { class: 'v' }, val)),
            copyBtn(val, c.label.toLowerCase()));
        })));
    }, 'Platform');
    v.append(tabs.el, panel);
    tabs.pick(S.join[0].id);
  };

  function postEl(it) {
    const card = h('article', { class: 'card post' });
    const a = it.author || {};
    card.append(h('div', { class: 'post-top' },
      a.avatar ? h('img', { class: 'avatar', src: a.avatar, alt: '', width: 34, height: 34, loading: 'lazy' })
        : h('div', { class: 'avatar' }, (a.name || '?').slice(0, 1).toUpperCase()),
      h('span', { class: 'who' }, a.name || 'MorrowCraft'),
      h('span', { class: 'when', title: it.ts ? fmtDate(new Date(it.ts).getTime()) : '' }, it.ts ? timeAgo(it.ts) : '')));
    const text = it.text || '';
    if (it.summary) {
      card.append(h('span', { class: 'ai' }, 'Summary'), mdEl('p', it.summary));
      if (text) card.append(h('details', {}, h('summary', {}, 'Read the full message'), discordEl(text)));
    } else if (text.length > 360) {
      const pv = previewOf(text);
      card.append(discordEl(pv), h('details', {}, h('summary', {}, 'Read the full message'), discordEl(text)));
    } else if (text) {
      card.append(discordEl(text));
    }
    if (it.image) card.append(h('img', { class: 'pic', src: it.image, alt: '', loading: 'lazy' }));
    if (it.url) card.append(h('a', { class: 'open', href: it.url, target: '_blank', rel: 'noopener' }, 'Open in Discord'));
    return card;
  }

  builders.news = () => {
    const v = $('#view-news');
    const feeds = S.discord.feeds;
    const keys = Object.keys(feeds);
    const panel = h('div', { class: 'feed' });
    v.append(viewHead('News & events', 'Straight from our Discord announcements, updates and events channels.'));
    const tabs = subTabs(keys.map(k => ({ id: k, label: feeds[k].label })), async key => {
      panel.replaceChildren(h('p', { class: 'empty' }, 'Loading…'));
      const d = await getData(key + '.json');
      panel.replaceChildren();
      if (!d || !d.items) { panel.append(h('p', { class: 'empty card' }, 'Could not load ' + feeds[key].label.toLowerCase() + ' right now.')); return; }
      if (d.sample) panel.append(sampleNotice(d));
      if (!d.items.length) panel.append(h('p', { class: 'empty card' }, 'Nothing posted yet.'));
      d.items.forEach(it => panel.append(postEl(it)));
    }, 'Feeds');
    v.append(tabs.el, panel);
    tabs.pick(keys[0]);
  };

  builders.leaderboard = async () => {
    const v = $('#view-leaderboard');
    const cats = S.leaderboard.categories;
    v.append(viewHead('Leaderboard', 'Top players on the server. Search any name to see every rank they hold.'));
    const body = h('div', {}, h('p', { class: 'empty' }, 'Loading…'));
    v.append(body);
    const data = await getData('leaderboard.json');
    if (!data || !data.categories) { body.replaceChildren(h('p', { class: 'empty card' }, 'The leaderboard is not available right now.')); return; }

    const players = new Map();
    cats.forEach(c => (data.categories[c.key] || []).forEach((r, i) => {
      const id = r.u || String(r.n).toLowerCase();
      const p = players.get(id) || { u: r.u, n: r.n, stats: {} };
      p.stats[c.key] = { rank: i + 1, v: r.v, d: r.d };
      players.set(id, p);
    }));

    const fmt = (c, r) => (c.useDisplay && r.d) ? r.d : Number(r.v).toLocaleString();
    const state = { cat: cats[0].key, q: '' };
    const input = h('input', { type: 'search', id: 'lb-search', placeholder: 'Search a player…', autocomplete: 'off', 'aria-label': 'Search a player' });
    const profile = h('div', {});
    const tableWrap = h('div', { class: 'table-wrap' });
    const tabs = subTabs(cats.map(c => ({ id: c.key, label: c.label })), key => { state.cat = key; render(); }, 'Categories');

    function render() {
      const q = state.q.trim().toLowerCase();
      const cat = cats.find(c => c.key === state.cat);

      profile.replaceChildren();
      if (q) {
        const found = [...players.values()].filter(p => String(p.n).toLowerCase().includes(q));
        found.sort((x, y) => (String(x.n).toLowerCase() === q ? -1 : 0) - (String(y.n).toLowerCase() === q ? -1 : 0)
          || (String(x.n).toLowerCase().startsWith(q) ? -1 : 0) - (String(y.n).toLowerCase().startsWith(q) ? -1 : 0));
        const best = found[0];
        if (best) {
          profile.append(h('div', { class: 'card profile' },
            h('div', { class: 'profile-top' }, head(best.u, best.n, 48), h('h3', {}, best.n)),
            h('div', { class: 'ranks' }, cats.filter(c => best.stats[c.key]).map(c => {
              const s = best.stats[c.key];
              return h('div', { class: 'rk' }, h('b', {}, '#' + s.rank), h('span', {}, c.label + ' · ' + fmt(c, s)));
            })),
            found.length > 1 ? h('p', { class: 'updated', style: 'margin:12px 0 0' }, 'Also matching: ',
              found.slice(1, 7).map(p => h('button', { class: 'chip', style: 'margin:0 6px 4px 0;padding:6px 10px', type: 'button', onclick: () => { input.value = p.n; state.q = p.n; render(); } }, p.n))) : null));
        } else {
          profile.append(h('p', { class: 'empty card', style: 'margin-bottom:16px' }, 'No player found for "' + state.q.trim() + '" in the top ' + S.leaderboard.limit + '.'));
        }
      }

      const rows = (data.categories[cat.key] || []).map((r, i) => ({ r, rank: i + 1 }))
        .filter(x => !q || String(x.r.n).toLowerCase().includes(q)).slice(0, 100);
      const table = h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Rank'), h('th', {}, 'Player'), h('th', { class: 'val' }, cat.label))),
        h('tbody', {}, rows.length ? rows.map(({ r, rank }) =>
          h('tr', { class: (rank <= 3 ? 'top' + rank : '') + (q ? ' hit' : '') },
            h('td', { class: 'rank' }, '#' + rank),
            h('td', {}, h('div', { class: 'pl' }, head(r.u, r.n), r.n)),
            h('td', { class: 'val' }, fmt(cat, r)))) : h('tr', {}, h('td', { colspan: 3, class: 'empty' }, 'Nobody ranked here yet.'))));
      tableWrap.replaceChildren(table);
    }

    input.addEventListener('input', () => { state.q = input.value; render(); });
    body.replaceChildren(...[
      sampleNotice(data),
      h('div', { class: 'lb-tools' }, h('div', { class: 'search' }, input), updatedLabel(data)),
      tabs.el, profile, tableWrap].filter(Boolean));
    tabs.pick(state.cat);
  };

  builders.staff = async () => {
    const v = $('#view-staff');
    v.append(viewHead('The team', 'The people who keep MorrowCraft running. This list updates by itself from our permissions.'));
    const body = h('div', {}, h('p', { class: 'empty' }, 'Loading…'));
    v.append(body);
    const data = await getData('staff.json');
    if (!data || !data.ranks) { body.replaceChildren(h('p', { class: 'empty card' }, 'The staff list is not available right now.')); return; }

    const out = [sampleNotice(data)];
    out.push(h('div', { class: 'card apply', style: 'margin-bottom:30px' },
      h('p', {}, S.staff.applyText),
      h('a', { class: 'btn btn-red', href: S.links.applications, target: '_blank', rel: 'noopener' }, 'Apply on Discord')));
    let any = false;
    for (const tier of ['owner', 'high', 'team']) {
      const rows = S.staff.ranks.filter(r => r.tier === tier)
        .map(r => ({ r, m: data.ranks[r.key] || [] })).filter(x => x.m.length);
      if (!rows.length) continue;
      any = true;
      out.push(h('section', { class: 'tier' + (tier === 'owner' ? ' owner-card' : '') },
        h('h2', { class: 'display' }, S.staff.tierTitles[tier]),
        rows.map(({ r, m }) => h('div', { class: 'rank-row' },
          h('div', { class: 'rank-name', style: '--c:' + r.color }, h('i'), r.label, h('small', {}, '· ' + m.length)),
          h('div', { class: 'members' }, m.map(p => h('div', { class: 'member' }, head(p.u, p.n), h('b', {}, p.n))))))));
    }
    if (!any) out.push(h('p', { class: 'empty card' }, 'No staff found yet.'));
    out.push(updatedLabel(data));
    body.replaceChildren(...out.filter(Boolean));
  };

  builders.rules = () => {
    const v = $('#view-rules');
    const R = S.rules;
    v.append(
      viewHead('Server rules', R.intro),
      h('div', { class: 'callouts' },
        h('div', { class: 'callout' }, R.warning),
        h('div', { class: 'callout info' }, R.report)),
      h('div', { class: 'acc' }, R.sections.map((sec, i) =>
        h('details', { open: i === 0 },
          h('summary', {}, h('span', {}, h('span', { class: 't' }, sec.title), sec.sub ? h('span', { class: 's' }, sec.sub) : null)),
          h('div', { class: 'body' }, h('ul', { class: 'rule-list' }, sec.items.map(it => {
            if (it.heading) {
              const li = h('li', { class: 'hd' });
              li.append(h('div', { class: 'rule-head ' + (it.tone || '') }, it.heading, it.text ? h('small', {}, it.text) : null));
              return li;
            }
            const li = h('li', { class: (sec.numbered ? 'num ' : '') + (it.tone || '') });
            li.append(h('div', {}, h('b', {}, it.title), ' ', mdEl('span', it.text)));
            return li;
          })))))));
  };

  builders.faq = () => {
    const v = $('#view-faq');
    v.append(
      viewHead('FAQ', 'Quick answers to the questions we get most.'),
      h('div', { class: 'acc' }, S.faq.map((f, i) =>
        h('details', { open: i === 0 },
          h('summary', {}, h('span', {}, f.q)),
          h('div', { class: 'body' }, mdEl('p', tpl(f.a)))))),
      h('div', { class: 'card apply', style: 'margin-top:24px' },
        h('p', {}, 'Still stuck? Open a ticket in our Discord and a staff member will help.'),
        h('a', { class: 'btn btn-green', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Open the Discord')));
  };

  /* ---------------- router ---------------- */
  const loaded = {};
  function show(id) {
    if (!ids.includes(id)) id = ids[0];
    const tab = S.tabs.find(t => t.id === id);
    S.tabs.forEach(t => {
      $('#view-' + t.id).hidden = t.id !== id;
      $('#tab-' + t.id).setAttribute('aria-selected', String(t.id === id));
    });
    $('#tabs').classList.remove('open');
    if (!loaded[id]) { loaded[id] = true; if (builders[id]) builders[id](); }
    document.title = id === ids[0] ? S.name + ' | Cross-Play Minecraft SMP' : tab.label + ' | ' + S.name;
    window.scrollTo(0, 0);
  }

  buildHeader();
  buildFooter();
  const app = $('#app');
  S.tabs.forEach(t => app.append(h('section', {
    class: 'view wrap', id: 'view-' + t.id, role: 'tabpanel', 'aria-labelledby': 'tab-' + t.id, hidden: true
  })));
  addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();
