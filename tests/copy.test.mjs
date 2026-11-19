/**
 * Copy completeness for the nine locales.
 *
 * Russian text in a component is the lookup key, so a missing translation would publish Russian words on a foreign
 * route. These checks read the source literals and the locale tables, and they fail on the exact string instead of
 * leaving the gap to a screenshot.
 */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'zh', 'ja', 'es', 'fr', 'de', 'pt', 'ko'];
const CYRILLIC = /[А-Яа-яЁё]/;
const LITERAL = /ui\((['"])(.+?)\1\)/gs;

function sourceFiles(dir, found = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, found);
    else if (/\.(ts|tsx)$/.test(entry.name)) found.push(path);
  }
  return found;
}

const catalogs = Object.fromEntries(LOCALES.map(locale => [locale, JSON.parse(readFileSync(join(ROOT, 'src/i18n/ui', `${locale}.json`), 'utf8'))]));

const literals = new Map();
for (const file of [...sourceFiles('app'), ...sourceFiles('src')]) {
  if (file.startsWith(join('src', 'i18n'))) continue;
  for (const [, , text] of readFileSync(join(ROOT, file), 'utf8').matchAll(LITERAL)) {
    const value = text.replaceAll("\\'", "'").replaceAll('\\"', '"');
    if (!literals.has(value)) literals.set(value, file);
  }
}

test('every locale catalog carries the same keys', () => {
  const reference = Object.keys(catalogs.en).sort();
  for (const locale of LOCALES) {
    assert.deepEqual(Object.keys(catalogs[locale]).sort(), reference, `key set of ${locale}`);
  }
});

test('no translation is empty and every placeholder survives', () => {
  for (const locale of LOCALES) {
    for (const [source, value] of Object.entries(catalogs[locale])) {
      assert.equal(typeof value, 'string', `${locale} ${source}`);
      assert.ok(value.trim().length > 0, `empty ${locale} translation of ${source}`);
      assert.deepEqual([...value.matchAll(/\{\w+\}/g)].map(([, token]) => token).sort(),
        [...source.matchAll(/\{\w+\}/g)].map(([, token]) => token).sort(),
        `placeholders of ${locale} ${source}`);
    }
  }
});

test('every Russian literal in the source is translated into all eight locales', () => {
  const missing = [];
  for (const [text, file] of literals) {
    if (!CYRILLIC.test(text)) continue;
    for (const locale of LOCALES) {
      if (!catalogs[locale][text]) missing.push(`${locale}: ${text.slice(0, 60)} (${file})`);
    }
  }
  assert.deepEqual(missing, [], `untranslated literals:\n${missing.join('\n')}`);
});

test('the plugin catalog is complete and points at real guides', async () => {
  const { PLUGINS } = await import('../src/content/plugins.ts');
  const { PAGES } = await import('../src/i18n/locales.ts');
  const { LOCALES: ALL } = await import('../src/i18n/locales.ts');
  const ICONS = ['globe', 'cursor', 'key', 'board', 'grid', 'play', 'palette', 'branch', 'shield-check', 'wrench', 'mic', 'type'];
  const pageKeys = new Set(PAGES.map(item => item.key));
  assert.equal(new Set(PLUGINS.map(plugin => plugin.id)).size, PLUGINS.length, 'plugin ids are unique');
  for (const plugin of PLUGINS) {
    assert.ok(ICONS.includes(plugin.icon), `${plugin.id} icon`);
    if (plugin.guide) assert.ok(pageKeys.has(plugin.guide), `${plugin.id} guide ${plugin.guide}`);
    for (const locale of ALL) {
      assert.ok(plugin.title[locale]?.trim(), `${plugin.id} title ${locale}`);
      assert.ok(plugin.description[locale]?.trim(), `${plugin.id} description ${locale}`);
      // None of the eight translated languages writes in Cyrillic, so a Russian leftover is visible here.
      if (locale !== 'ru') {
        assert.ok(!CYRILLIC.test(plugin.title[locale]), `${plugin.id} title ${locale} stayed Russian`);
        assert.ok(!CYRILLIC.test(plugin.description[locale]), `${plugin.id} description ${locale} stayed Russian`);
      }
    }
  }
});
