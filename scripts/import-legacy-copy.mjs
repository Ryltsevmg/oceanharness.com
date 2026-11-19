/**
 * One-off importer for the legacy copy.
 *
 * Reads every `ui('…')` literal from `app/` and `src/`, resolves its translation through the published hash catalogs
 * in `i18n/*.json`, and writes `src/i18n/ui/<locale>.json` keyed by the Russian source string. Run it after adding a
 * literal; it reports the literals the legacy catalogs do not carry so they can be translated by hand.
 *
 * Delete this script together with `i18n/` once the catalogs are no longer needed: the JSON files it writes are the
 * source of truth from then on.
 *
 * Usage: node scripts/import-legacy-copy.mjs [--write]
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'zh', 'ja', 'es', 'fr', 'de', 'pt', 'ko'];
const LITERAL = /ui\((['"])(.+?)\1\)/gs;

/** The published message id: whitespace collapsed and trimmed, then the first 12 hex digits of SHA-256. */
function messageId(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 12);
}

async function sourceFiles(dir, found = []) {
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await sourceFiles(path, found);
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(path);
  }
  return found;
}

const catalogs = {};
for (const locale of LOCALES) catalogs[locale] = JSON.parse(await readFile(join(ROOT, 'i18n', `${locale}.json`), 'utf8'));
const source = JSON.parse(await readFile(join(ROOT, 'i18n', 'source.json'), 'utf8'));

const literals = new Map();
for (const file of [...(await sourceFiles('app')), ...(await sourceFiles('src'))]) {
  if (file.startsWith('src/i18n')) continue;
  for (const match of (await readFile(join(ROOT, file), 'utf8')).matchAll(LITERAL)) {
    const text = match[2].replaceAll("\\'", "'").replaceAll('\\"', '"');
    if (!literals.has(text)) literals.set(text, new Set());
    literals.get(text).add(file);
  }
}

const missing = [];
const tables = Object.fromEntries(LOCALES.map(locale => [locale, {}]));
for (const [text, files] of literals) {
  const key = messageId(text);
  if (!(key in source)) {
    missing.push({ text, file: [...files][0] });
    continue;
  }
  for (const locale of LOCALES) {
    const translated = catalogs[locale][key];
    if (!translated) missing.push({ text, file: [...files][0], locale });
    else tables[locale][text] = translated;
  }
}

if (missing.length > 0) {
  console.error(`${missing.length} literal(s) have no legacy translation:`);
  for (const item of missing) console.error(`  ${item.locale ?? 'ru'}: ${item.text.slice(0, 70)} (${item.file})`);
}

if (process.argv.includes('--write')) {
  await mkdir(join(ROOT, 'src', 'i18n', 'ui'), { recursive: true });
  for (const locale of LOCALES) {
    const table = Object.fromEntries(Object.entries(tables[locale]).sort(([a], [b]) => a.localeCompare(b, 'ru')));
    await writeFile(join(ROOT, 'src', 'i18n', 'ui', `${locale}.json`), `${JSON.stringify(table, null, 2)}\n`, 'utf8');
    console.log(`${locale}: ${Object.keys(table).length} strings`);
  }
}

console.log(`${literals.size} literal(s) scanned, ${missing.length} unresolved`);
