/**
 * Refresh the checked download snapshot the build renders from.
 *
 * Reads the GitHub Releases API and writes `public/downloads/releases.json`; the page itself is rebuilt from that
 * file, so nothing here touches HTML. With `GITHUB_TOKEN` set the request is authenticated and the rate limit stops
 * being the failure mode.
 *
 * Usage: node scripts/update-downloads.mjs
 */
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchLatestDownloads, parseSnapshot } from '../src/content/downloads.ts';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const downloads = await fetchLatestDownloads(fetch, { headers, signal: AbortSignal.timeout(30_000) });
const snapshot = parseSnapshot({ checkedAt: new Date().toISOString(), downloads });

await writeFile(join(ROOT, 'public/downloads/releases.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Saved ${snapshot.downloads.length} of 5 targets to public/downloads/releases.json`);
