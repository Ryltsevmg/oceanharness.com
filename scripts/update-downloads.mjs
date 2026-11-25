/**
 * Refresh the checked download snapshot the build renders from.
 *
 * Reads the GitHub Releases API and writes `public/downloads/releases.json`; the page itself is rebuilt from that
 * file, so nothing here touches HTML. With `GITHUB_TOKEN` set the request is authenticated and the rate limit stops
 * being the failure mode.
 *
 * A refresh that finds the same installers writes nothing: the saved check time names the release the list was
 * last confirmed for, and a scheduled run does not commit an identical snapshot.
 *
 * Usage: node scripts/update-downloads.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchLatestDownloads, parseSnapshot, sameDownloads } from '../src/content/downloads.ts';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SNAPSHOT = join(ROOT, 'public/downloads/releases.json');
const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const downloads = await fetchLatestDownloads(fetch, { headers, signal: AbortSignal.timeout(30_000) });
const saved = await readSaved(SNAPSHOT);

if (saved !== undefined && sameDownloads(saved.downloads, downloads)) {
  console.log(`Kept ${downloads.length} of 5 targets: the saved snapshot already lists them`);
} else {
  const snapshot = parseSnapshot({ checkedAt: new Date().toISOString(), downloads });
  await writeFile(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Saved ${snapshot.downloads.length} of 5 targets to public/downloads/releases.json`);
}

/**
 * Read the snapshot this run may replace.
 *
 * @param path absolute path of the saved snapshot.
 * @returns the validated snapshot, or undefined when the file is missing or unreadable.
 */
async function readSaved(path) {
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (_missing) {
    // A first run has nothing to compare against, so the fetched list is always written.
    return undefined;
  }
  try {
    return parseSnapshot(JSON.parse(raw));
  } catch (_invalid) {
    // An unreadable snapshot must not stop the refresh; the fetched list replaces it.
    return undefined;
  }
}
