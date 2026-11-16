import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fetchLatestDownloads, renderDownloadCards, formatDate } from '../downloads/downloads.js';

const root = new URL('../', import.meta.url);
const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const downloads = await fetchLatestDownloads(fetch, { headers, signal: AbortSignal.timeout(30_000) });
const checkedAt = new Date().toISOString();
const htmlPath = new URL('downloads/index.html', root);
const html = await readFile(htmlPath, 'utf8');
const replaceSection = (source, name, content) => {
  const start = `<!-- ${name}_START -->`;
  const end = `<!-- ${name}_END -->`;
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error(`Missing or duplicate ${name} markers`);
  return source.replace(new RegExp(`${start}[\\s\\S]*?${end}`), `${start}\n${content}\n${end}`);
};
let updated = replaceSection(html, 'DOWNLOAD_CARDS', renderDownloadCards(downloads));
updated = replaceSection(updated, 'DOWNLOAD_STATUS', `      <p data-download-status data-checked-at="${checkedAt}" role="status" aria-live="polite">Загрузки проверены ${formatDate(checkedAt)}.</p>`);
await writeFile(new URL('downloads/releases.json', root), `${JSON.stringify({ checkedAt, downloads }, null, 2)}\n`);
await writeFile(htmlPath, updated);
console.log(`Updated ${downloads.length} available downloads in ${fileURLToPath(htmlPath)}`);
