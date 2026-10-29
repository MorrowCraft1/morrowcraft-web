import fs from 'node:fs';
import path from 'node:path';
import { repoDir, env } from './config.js';

const strip = obj => JSON.stringify({ ...obj, updated: undefined });

/** Writes the JSON files next to the website (../data). */
function toFiles(files) {
  const dir = path.join(repoDir, 'data');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, obj] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(obj));
  }
  console.log(`  wrote ${Object.keys(files).length} file(s) to ${dir}`);
}

/** Commits the JSON files to a branch of the GitHub repo. Skips files whose data did not change. */
async function toGitHub(files) {
  const repo = env('GITHUB_REPO');
  const branch = env('GITHUB_BRANCH', 'data');
  const token = env('GITHUB_TOKEN');
  if (!repo || !token) throw new Error('PUBLISH_MODE=github needs GITHUB_REPO and GITHUB_TOKEN in .env');
  const api = 'https://api.github.com/repos/' + repo;
  const headers = {
    Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'morrowcraft-data-service'
  };
  const gh = async (url, opts = {}) => fetch(api + url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });

  // Make sure the data branch exists (created from the default branch the first time).
  if ((await gh(`/git/ref/heads/${branch}`)).status === 404) {
    const info = await (await gh('')).json();
    const base = await (await gh(`/git/ref/heads/${info.default_branch}`)).json();
    const made = await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: base.object.sha }) });
    if (!made.ok) throw new Error(`Could not create branch ${branch}: ${made.status}`);
    console.log(`  created branch ${branch}`);
  }

  let changed = 0;
  for (const [name, obj] of Object.entries(files)) {
    const pathInRepo = `data/${name}`;
    const cur = await gh(`/contents/${pathInRepo}?ref=${branch}`);
    let sha;
    if (cur.ok) {
      const body = await cur.json();
      sha = body.sha;
      try {
        const old = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
        if (strip(old) === strip(obj)) continue; // nothing new, avoid a pointless commit
      } catch { /* overwrite */ }
    }
    const put = await gh(`/contents/${pathInRepo}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `data: update ${name}`, branch, sha,
        content: Buffer.from(JSON.stringify(obj)).toString('base64')
      })
    });
    if (!put.ok) throw new Error(`GitHub refused ${name}: ${put.status} ${await put.text()}`);
    changed++;
  }
  console.log(`  GitHub: ${changed} file(s) updated on branch ${branch}`);
}

export async function publish(files) {
  const mode = env('PUBLISH_MODE', 'files');
  if (mode === 'github') return toGitHub(files);
  return toFiles(files);
}
