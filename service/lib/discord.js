const API = 'https://discord.com/api/v10';

async function dget(path, token, retried = false) {
  const res = await fetch(API + path, {
    headers: { Authorization: `Bot ${token}`, 'User-Agent': 'MorrowCraftSite (https://morrowcraft.net, 1.0)' }
  });
  if (res.status === 429 && !retried) {
    const body = await res.json().catch(() => ({}));
    await new Promise(r => setTimeout(r, Math.ceil((body.retry_after || 1) * 1000) + 100));
    return dget(path, token, true);
  }
  if (!res.ok) throw new Error(`Discord ${res.status} for ${path} (check the bot is in the server and can read that channel)`);
  return res.json();
}

/** Turns Discord markup into plain text. Timestamps become {{t:UNIX}} so the website can show the viewer's local time. */
function clean(content, message) {
  const users = new Map((message.mentions || []).map(u => [u.id, u.global_name || u.username]));
  return String(content || '')
    .replace(/<@&\d+>/g, '')                 // role pings mean nothing on a website
    .replace(/@(everyone|here)\b/g, '')
    .replace(/<@!?(\d+)>/g, (m, id) => '@' + (users.get(id) || 'user'))
    .replace(/<#\d+>/g, '#channel')
    .replace(/<a?:\w+:(\d+)>/g, '{{e:$1}}')      // custom emoji, drawn as small images by the website
    .replace(/<t:(\d+)(?::[A-Za-z])?>/g, '{{t:$1}}')
    .replace(/\|\|\s*\|\|/g, '')             // empty spoilers left behind by removed pings
    .replace(/\(\s*\)/g, '')                   // and empty brackets around them
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstImage(m) {
  const att = (m.attachments || []).find(a => (a.content_type || '').startsWith('image/'));
  if (att) return att.url;
  const emb = (m.embeds || []).find(e => (e.image && e.image.url) || (e.thumbnail && e.thumbnail.url));
  return emb ? (emb.image && emb.image.url) || emb.thumbnail.url : null;
}

/** Embeds (what bots post) become text: a heading, the description and any fields. */
function embedText(m) {
  return (m.embeds || []).map(e => {
    const parts = [];
    if (e.title) parts.push('# ' + clean(e.title, m));
    if (e.description) parts.push(clean(e.description, m));
    for (const f of e.fields || []) parts.push(`**${clean(f.name, m)}**\n${clean(f.value, m)}`);
    return parts.join('\n\n');
  }).filter(Boolean).join('\n\n');
}

/** Latest messages from one channel, newest first. Also returns what Discord sent back, for the status file. */
export async function fetchFeed(channelId, limit, token) {
  const [channel, messages] = await Promise.all([
    dget(`/channels/${channelId}`, token),
    dget(`/channels/${channelId}/messages?limit=${Math.min(Math.max(limit, 1), 50)}`, token)
  ]);
  const guild = channel.guild_id;
  // 0 = normal message, 19 = reply, 20 = a bot's slash-command reply
  const items = messages
    .filter(m => [0, 19, 20].includes(m.type))
    .map(m => {
      const text = [clean(m.content, m), embedText(m)].filter(Boolean).join('\n\n');
      const a = m.author || {};
      return {
        id: m.id,
        ts: m.timestamp,
        author: {
          name: (m.member && m.member.nick) || a.global_name || a.username || 'MorrowCraft',
          avatar: a.avatar ? `https://cdn.discordapp.com/avatars/${a.id}/${a.avatar}.png?size=64` : null
        },
        text,
        image: firstImage(m),
        url: guild ? `https://discord.com/channels/${guild}/${channelId}/${m.id}` : null
      };
    })
    .filter(m => m.text || m.image);
  return { items, raw: messages.length, types: [...new Set(messages.map(m => m.type))], channelType: channel.type };
}
