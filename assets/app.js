/* MorrowCraft site. Everything on the page is built from site.yml (the one file you edit)
   plus the JSON files in data/ that the data service keeps fresh. */
(() => {
  'use strict';

  /* Loads site.yml, then starts the site. A mistake in the file shows a plain message with the line number. */
  function fail(msg) {
    const box = document.createElement('div');
    box.style.cssText = 'max-width:640px;margin:12vh auto;padding:24px;background:#121c42;color:#e9edf9;border:2px solid #e90c09;border-radius:12px;font:16px/1.5 system-ui,sans-serif';
    box.innerHTML = '<h2 style="margin:0 0 8px">The website content has a mistake</h2><p style="margin:0 0 12px">Open <b>site.yml</b> on GitHub and fix the spot below. Compare with the lines around it.</p><pre style="white-space:pre-wrap;background:#080d22;padding:12px;border-radius:8px;margin:0"></pre>';
    box.querySelector('pre').textContent = msg;
    document.body.replaceChildren(box);
  }
  fetch('/site.yml', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('site.yml could not be loaded (' + r.status + ').'); return r.text(); })
    .then(txt => {
      let cfg;
      try { cfg = window.jsyaml.safeLoad(txt); }
      catch (e) { throw new Error('site.yml, line ' + ((e.mark && e.mark.line) + 1 || '?') + ': ' + (e.reason || e.message)); }
      if (!cfg || typeof cfg !== 'object') throw new Error('site.yml is empty.');
      main(cfg);
    })
    .catch(e => fail(e.message || String(e)));

  function main(S) {

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
      .replace(/\{\{e:(\d+)\}\}/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png?size=48" alt="" width="20" height="20" loading="lazy">')
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
      if ((m = line.match(/^-#\s+(.*)$/))) {          // Discord "subtext" line
        list = null;
        const n = h('p', { class: 'sub' }); n.innerHTML = inlineDiscord(m[1]); root.append(n);
        continue;
      }
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

  /* ---------------- pages and addresses ----------------
     Home is "/", every other tab is "/<id>" (for example /join). */
  const ids = S.tabs.map(t => t.id);
  const pathOf = t => t.path || (t.id === ids[0] ? '/' : '/' + t.id);
  const normPath = p => (p.replace(/\/+$/, '') || '/');
  const tabAt = p => S.tabs.find(t => pathOf(t) === p);
  function go(id) {
    const t = S.tabs.find(x => x.id === id);
    if (!t) return;
    if (normPath(location.pathname) !== pathOf(t) || location.hash) history.pushState({}, '', pathOf(t));
    show(id);
  }
  const tabLink = (t, cls, kids) => h('a', {
    class: cls, href: pathOf(t), 'data-id': t.id,
    onclick: e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); go(t.id); }
  }, kids);

  /* ---------------- header + footer ---------------- */
  function buildHeader() {
    const ind = h('span', { class: 'tab-ind', 'aria-hidden': 'true' });
    const tabs = h('nav', { class: 'tabs', id: 'tabs', 'aria-label': 'Pages' }, ind, S.tabs.map(t => tabLink(t, 'tab', t.label)));
    const menu = h('button', {
      class: 'menu-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'tabs',
      onclick: e => e.currentTarget.setAttribute('aria-expanded', String(tabs.classList.toggle('open')))
    }, 'Menu');
    $('#site-header').append(h('div', { class: 'bar' },
      tabLink(S.tabs[0], 'brand', h('img', { src: S.logo, alt: S.name, width: 34, height: 34 })),
      tabs,
      h('div', { class: 'bar-cta' },
        h('a', { class: 'pill-btn pill-green', href: S.links.store, target: '_blank', rel: 'noopener' }, 'Store'),
        h('a', { class: 'pill-btn pill-dark', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Discord')),
      menu));
  }

  /* Slides the underline under the current tab. */
  function moveIndicator() {
    const ind = $('.tab-ind'), cur = $('#tabs .tab[aria-current="page"]');
    if (!ind || !cur || getComputedStyle(ind).display === 'none') return;
    ind.style.width = cur.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + cur.offsetLeft + 'px)';
    ind.style.opacity = '1';
  }
  addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

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
        h('div', { class: 'support' }, h('span', { class: 'label' }, 'Support'),
          h('a', { class: 'mail', href: 'mailto:' + L.email }, L.email), copyBtn(L.email, 'email', 'Copy email')))));
  }

  /* ---------------- views ---------------- */
  const builders = {};

  /* Live status (tries mcstatus.io, then mcsrvstat.us) */
  function buildStatus() {
    const pill = h('span', { class: 'pill' }, 'Checking');

    function paint(s) {
      document.dispatchEvent(new CustomEvent('mc:status', { detail: s }));
      pill.title = '';
      if (!s) { pill.className = 'pill'; pill.textContent = 'Status unavailable'; return; }
      if (!s.online) { pill.className = 'pill off'; pill.textContent = 'Offline'; return; }
      pill.className = 'pill on';
      pill.textContent = 'Online · ' + (s.players ?? 0) + '/' + (s.max ?? '?');
      pill.title = [s.version, s.motd].filter(Boolean).join(' · ');
    }

    async function refresh() {
      const host = encodeURIComponent(S.server.javaHost);
      try {
        const r = await fetchJSON('https://api.mcstatus.io/v2/status/java/' + host);
        return paint({
          online: r.online, players: r.players && r.players.online, max: r.players && r.players.max,
          version: r.version && r.version.name_clean, motd: r.motd && r.motd.clean
        });
      } catch { /* try the second service */ }
      try {
        const r = await fetchJSON('https://api.mcsrvstat.us/3/' + host);
        return paint({
          online: r.online, players: r.players && r.players.online, max: r.players && r.players.max,
          version: r.version, motd: r.motd && r.motd.clean && r.motd.clean.join(' ')
        });
      } catch { paint(null); }
    }
    refresh();
    setInterval(refresh, (S.server.statusRefreshSeconds || 60) * 1000);
    return pill;
  }

  /* Live player count and a one-click copy box under the intro. */
  function heroLive() {
    const dot = h('i', { class: 'live-dot' });
    const txt = h('span', {}, 'Checking server…');
    const pill = h('div', { class: 'live-pill' }, dot, txt);
    document.addEventListener('mc:status', e => {
      const s = e.detail;
      pill.dataset.state = !s ? 'unknown' : s.online ? 'on' : 'off';
      txt.textContent = !s ? 'Status unavailable' : s.online ? (s.players ?? 0) + ' / ' + (s.max ?? '?') + ' players online' : 'Server offline';
    });
    const ip = h('div', { class: 'hero-ip' },
      h('span', { class: 'v' }, S.server.javaHost),
      copyBtn(S.server.javaHost, 'server address', 'Copy IP'));
    return h('div', { class: 'hero-live' }, pill, ip);
  }

  /* One quiet line inside the Discord tile: members online and who is in voice. */
  function discordLive() {
    const W = (S.discord && S.discord.widget) || {};
    const line = h('div', { class: 'dw-line' });
    if (!W.guildId) return line;
    fetchJSON('https://discord.com/api/guilds/' + encodeURIComponent(W.guildId) + '/widget.json').then(r => {
      const members = r.members || [];
      const voice = members.filter(m => m.channel_id).length;
      line.append(h('i', { class: 'live-dot' }), (r.presence_count ?? members.length) + ' online' + (voice ? ' · ' + voice + ' in voice' : ''));
    }).catch(() => {});
    return line;
  }

  /* Discord join box. Reads Discord's public widget (online members and who is in voice). */
  function buildDiscord() {
    const W = (S.discord && S.discord.widget) || {};
    const count = h('div', { class: 'dw-count' }, '–');
    const sub = h('div', { class: 'dw-sub' }, 'Loading…');
    const faces = h('div', { class: 'dw-faces' });
    const join = h('a', { class: 'btn btn-green', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Join the Discord');
    const card = h('div', { class: 'card dw' },
      h('div', { class: 'panel-head' }, h('span', { class: 'label' }, 'Discord'), h('span', { class: 'pill on' }, 'Live')),
      h('div', { class: 'dw-main' }, count, h('div', {}, h('b', {}, 'members online'), sub)),
      faces, join);
    if (!W.guildId) { card.hidden = true; return card; }
    fetchJSON('https://discord.com/api/guilds/' + encodeURIComponent(W.guildId) + '/widget.json').then(r => {
      const members = r.members || [];
      count.textContent = String(r.presence_count ?? members.length);
      const voice = members.filter(m => m.channel_id).length;
      const chans = (r.channels || []).length;
      sub.textContent = voice ? voice + ' in voice chat now' : (chans ? chans + ' voice channels, all quiet' : 'Come say hi');
      faces.replaceChildren(...members.slice(0, 8).map(m => h('img', { src: m.avatar_url, alt: '', title: m.username, width: 32, height: 32, loading: 'lazy' })));
      if (r.instant_invite) join.href = r.instant_invite;
    }).catch(() => {
      count.textContent = '';
      sub.textContent = 'Chat, tickets, applications and announcements.';
      card.classList.add('dw-off');
    });
    return card;
  }

  builders.home = () => {
    const v = $('#view-home');
    const [a, b] = S.name.replace(/(.)([A-Z])/, '$1\u0000$2').split('\u0000');
    const addr = (cls, k, host, port) => h('div', { class: 'addr-row ' + cls },
      h('span', { class: 'label k' }, k),
      h('span', { class: 'v' }, host, port ? h('span', { class: 'port' }, 'port ' + port) : null),
      copyBtn(host, k + ' address'));
    v.append(
      h('section', { class: 'hero' },
        h('div', { class: 'logo-frame' }, h('img', { src: S.logo, alt: S.name + ' logo', width: 200, height: 200 })),
        h('h1', { class: 'wordmark' }, h('span', { class: 'wm wm-a' }, a), b ? h('span', { class: 'wm wm-b' }, b) : null),
        h('p', { class: 'intro' }, S.intro),
        h('div', { class: 'hero-actions' },
          h('button', { class: 'btn btn-green', type: 'button', onclick: () => go('join') }, 'How to join'),
          h('a', { class: 'btn btn-green', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Join the Discord'))),
      h('div', { class: 'connect' },
        h('div', { class: 'connect-main' },
          h('span', { class: 'label' }, 'Server address'),
          h('span', { class: 'ip' }, S.server.javaHost),
          copyBtn(S.server.javaHost, 'server address', 'Copy')),
        h('div', { class: 'connect-meta' },
          buildStatus(),
          h('span', {}, 'Java ' + S.server.version),
          h('span', {}, 'Bedrock port ' + S.server.bedrockPort))),
      h('div', { class: 'tiles' }, S.tiles.map(t => h('div', { class: 'card tile ' + t.tone },
        h('h2', { class: 'display' }, t.title),
        h('p', {}, t.text),
        t.link === 'discord' ? discordLive() : null,
        h('a', { class: 'btn btn-green', href: S.links[t.link], target: '_blank', rel: 'noopener' }, t.cta)))),
      h('h2', { class: 'display section-title' }, 'Features'),
      h('div', { class: 'feat-grid' }, S.features.map(f =>
        h('article', { class: 'card feat' },
          f.image ? h('img', { src: f.image, alt: '', loading: 'lazy' }) : null,
          h('div', { class: 'feat-body' }, h('h3', {}, f.title), mdEl('p', f.text))))));
  };

  builders.join = () => {
    const v = $('#view-join');
    const panel = h('div', { class: 'card join-panel' });
    v.append(viewHead('How to join', 'Pick your platform. It takes about a minute.'));
    const steps = list => h('ol', { class: 'steps' }, (list || []).map(s => h('li', {}, mdEl('div', tpl(s)))));
    const tabs = subTabs(S.join.map(j => ({ id: j.id, label: j.label })), id => {
      const j = S.join.find(x => x.id === id);
      panel.replaceChildren(
        h('div', { class: 'join-steps' },
          j.sections
            ? j.sections.map(sec => h('div', { class: 'join-sec' }, h('h3', {}, sec.heading), steps(sec.steps)))
            : steps(j.steps),
          j.links && j.links.length
            ? h('div', { class: 'join-links' }, j.links.map(l => h('a', { class: 'btn btn-green', href: l.url, target: '_blank', rel: 'noopener' }, l.label)))
            : null),
        h('div', { class: 'copy-list' }, (j.copy || []).map(c => {
          const val = tpl(c.value);
          return h('div', { class: 'copy-box' },
            h('div', { style: 'flex:1;min-width:0' }, h('span', { class: 'label l' }, c.label), h('span', { class: 'v' }, val)),
            copyBtn(val, c.label.toLowerCase()));
        })));
    }, 'Platform');
    v.append(tabs.el, panel);
    const wanted = location.hash.slice(1);
    tabs.pick(S.join.some(j => j.id === wanted) ? wanted : S.join[0].id);
  };

  function postEl(it) {
    const card = h('article', { class: 'card post' });
    const a = it.author || {};
    card.append(h('div', { class: 'post-top' },
      a.avatar ? h('img', { class: 'avatar', src: a.avatar, alt: '', width: 34, height: 34, loading: 'lazy' })
        : h('div', { class: 'avatar' }, (a.name || '?').slice(0, 1).toUpperCase()),
      h('span', { class: 'who' }, h('small', { class: 'by' }, 'Posted by '), a.name || 'MorrowCraft'),
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
    const state = { cat: cats[0].key, q: '', shown: 15 };
    const input = h('input', { type: 'search', id: 'lb-search', placeholder: 'Search a player…', autocomplete: 'off', 'aria-label': 'Search a player' });
    const profile = h('div', {});
    const tableWrap = h('div', {});
    const tabs = subTabs(cats.map(c => ({ id: c.key, label: c.label })), key => { state.cat = key; state.shown = 15; render(); }, 'Categories');

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

      const all = (data.categories[cat.key] || []).map((r, i) => ({ r, rank: i + 1 }))
        .filter(x => !q || String(x.r.n).toLowerCase().includes(q)).slice(0, 100);
      const podium = !q && all.length >= 3 ? all.slice(0, 3) : [];
      const rest = all.slice(podium.length);
      const rows = rest.slice(0, state.shown);
      const table = h('table', {},
        h('thead', {}, h('tr', {}, h('th', {}, 'Rank'), h('th', {}, 'Player'), h('th', { class: 'val' }, cat.label))),
        h('tbody', {}, rows.length ? rows.map(({ r, rank }) =>
          h('tr', { class: q ? 'hit' : '' },
            h('td', { class: 'rank' }, '#' + rank),
            h('td', {}, h('div', { class: 'pl' }, head(r.u, r.n), r.n)),
            h('td', { class: 'val' }, fmt(cat, r)))) : (podium.length ? [] : h('tr', {}, h('td', { colspan: 3, class: 'empty' }, 'Nobody ranked here yet.')))));
      const more = rest.length > rows.length
        ? h('button', { class: 'btn btn-green more', type: 'button', onclick: () => { state.shown += 15; render(); } }, 'Show more (' + (rest.length - rows.length) + ' left)') : null;
      const pod = podium.length ? h('div', { class: 'podium' }, [podium[1], podium[0], podium[2]].map(({ r, rank }) =>
        h('div', { class: 'pod p' + rank },
          h('div', { class: 'pod-rank' }, '#' + rank),
          head(r.u, r.n, rank === 1 ? 72 : 56),
          h('b', {}, r.n),
          h('span', {}, fmt(cat, r)),
          h('i', {})))) : null;
      tableWrap.replaceChildren(...[pod, rows.length ? h('div', { class: 'table-wrap' }, table) : null, more].filter(Boolean));
    }

    input.addEventListener('input', () => { state.q = input.value; state.shown = 15; render(); });
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
      h('a', { class: 'btn btn-green', href: S.links.applications, target: '_blank', rel: 'noopener' }, 'Apply on Discord')));
    const people = r => {
      let m = data.ranks[r.key] || [];
      if (r.only) { const ok = r.only.map(x => x.toLowerCase()); m = m.filter(p => ok.includes(String(p.n).toLowerCase())); }
      return m;
    };
    const cardFor = key => {
      const r = S.staff.ranks.find(x => x.key === key);
      if (!r) return null;
      const m = people(r);
      return h('article', { class: 'rank-card' + (m.length ? '' : ' open'), style: '--c:' + r.color },
        h('header', {}, h('h4', {}, r.label), m.length ? h('span', { class: 'count' }, String(m.length)) : null),
        m.length
          ? h('ul', {}, m.map(p => h('li', {}, head(p.u, p.n, 40), h('b', {}, p.n))))
          : h('div', { class: 'slot' }, 'Nobody has this rank'));
    };
    const ownerCard = key => {
      const r = S.staff.ranks.find(x => x.key === key);
      const m = r ? people(r) : [];
      return h('div', { class: 'owner-hero' }, m.length
        ? m.map(p => h('div', { class: 'owner-person' },
            h('img', { class: 'owner-skin', alt: '', width: 120, height: 120, src: 'https://mc-heads.net/body/' + encodeURIComponent(p.u || p.n) + '/200',
              onerror: ev => { ev.target.replaceWith(head(p.u, p.n, 96)); } }),
            h('div', {}, h('small', {}, r.label), h('b', {}, p.n))))
        : h('span', { class: 'tbd' }, 'TBD'));
    };
    for (const sec of S.staff.sections) {
      const owner = sec.style === 'owner';
      out.push(h('section', { class: 'tier' + (owner ? ' owner-tier' : '') },
        h('h2', { class: 'display' }, sec.title),
        owner ? (sec.ranks || []).map(ownerCard)
        : sec.groups
          ? h('div', { class: 'groups' }, sec.groups.map(g => h('div', { class: 'group' },
              h('h3', { class: 'group-title' }, g.title), h('div', { class: 'rank-grid' }, g.ranks.map(cardFor)))))
          : h('div', { class: 'rank-grid' }, (sec.ranks || []).map(cardFor))));
    }
    body.replaceChildren(...out.filter(Boolean));
  };

  builders.ranks = () => {
    const v = $('#view-ranks');
    const R = S.ranks || { tiers: [], groups: [] };
    v.append(viewHead('Ranks', R.intro));
    let active = null;
    const cells = [];
    const mark = val => {
      const t = String(val).trim().toLowerCase();
      if (t === 'yes') return h('span', { class: 'tick yes', 'aria-label': 'Yes' }, '✓');
      if (t === 'no') return h('span', { class: 'tick no', 'aria-label': 'No' }, '–');
      return mdEl('span', String(val));
    };
    const setActive = i => {
      active = active === i ? null : i;
      cells.forEach(c => c.el.classList.toggle('on', c.col === active));
    };
    const head = h('tr', {}, h('th', { class: 'feat-col' }, 'Perk'), R.tiers.map((t, i) => {
      const th = h('th', { scope: 'col' }, h('button', { type: 'button', 'aria-pressed': 'false', onclick: e => {
        setActive(i);
        head.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(active === j)));
      } }, t.label));
      cells.push({ el: th, col: i });
      return th;
    }));
    const body = h('tbody', {});
    for (const g of R.groups) {
      body.append(h('tr', { class: 'grp' }, h('th', { colspan: R.tiers.length + 1 }, g.title)));
      for (const row of g.rows) {
        body.append(h('tr', {}, h('th', { scope: 'row', class: 'feat-col' }, row.label),
          R.tiers.map((_, i) => { const td = h('td', {}, mark((row.values || [])[i] ?? '–')); cells.push({ el: td, col: i }); return td; })));
      }
    }
    v.append(h('div', { class: 'card table-wrap matrix' }, h('table', {}, h('thead', {}, head), body)));
  };

  builders.wiki = () => {
    const v = $('#view-wiki');
    const W = S.wiki || { entries: [] };
    v.append(viewHead('Wiki', W.intro),
      h('div', { class: 'acc' }, W.entries.map((e, i) =>
        h('details', { open: i === 0 },
          h('summary', {}, h('span', {}, h('span', { class: 't' }, e.title), e.sub ? h('span', { class: 's' }, e.sub) : null)),
          h('div', { class: 'body' }, (e.body || []).map(t => mdEl('p', tpl(t))))))));
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
        h('p', {}, 'Still stuck? Open a ticket in our Discord, or email ', h('a', { href: 'mailto:' + S.links.email }, S.links.email), '.'),
        h('a', { class: 'btn btn-green', href: S.links.discord, target: '_blank', rel: 'noopener' }, 'Open the Discord')));
  };

  /* ---------------- router ---------------- */
  const loaded = {};
  function show(id) {
    const tab = S.tabs.find(t => t.id === id) || S.tabs[0];
    id = tab.id;
    S.tabs.forEach(t => { $('#view-' + t.id).hidden = t.id !== id; });
    document.querySelectorAll('#tabs .tab').forEach(a => {
      if (a.dataset.id === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#tabs').classList.remove('open');
    const mb = $('.menu-btn'); if (mb) mb.setAttribute('aria-expanded', 'false');
    if (!loaded[id]) { loaded[id] = true; if (builders[id]) builders[id](); }
    document.title = S.name + ' | ' + tab.label;
    moveIndicator();
    window.scrollTo(0, 0);
  }

  /* Works out which tab the address bar points at. Old "/#join" style links are moved to "/join". */
  function idFromLocation() {
    const hash = location.hash.slice(1);
    if (ids.includes(hash)) {
      history.replaceState({}, '', pathOf(S.tabs.find(t => t.id === hash)));
      return hash;
    }
    const t = tabAt(normPath(location.pathname));
    if (t) return t.id;
    history.replaceState({}, '', pathOf(S.tabs[0]));
    return ids[0];
  }

  buildHeader();
  buildFooter();
  const app = $('#app');
  S.tabs.forEach(t => app.append(h('section', {
    class: 'view wrap', id: 'view-' + t.id, hidden: true
  })));
  addEventListener('popstate', () => show(idFromLocation()));
  show(idFromLocation());
  }
})();
