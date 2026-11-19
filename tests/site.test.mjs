/**
 * Checks over the built export.
 *
 * Runs against `out/` after `next build`: the published contract is what a crawler and a browser receive, so the
 * assertions read the emitted HTML rather than the source. A missing `out/` fails the run instead of skipping.
 */
import { strict as assert } from 'node:assert';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { HTML_LANG, LOCALES, PAGES, localizedPath, localizedUrl } from '../src/i18n/locales.ts';


const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');

function fileFor(path) {
  return join(OUT, path === '/' ? 'index.html' : `${path.replace(/^\//, '').replace(/\/$/, '')}/index.html`);
}

function read(path) {
  const file = fileFor(path);
  assert.ok(existsSync(file), `missing built page ${path} (${file})`);
  return readFileSync(file, 'utf8');
}

function attribute(html, pattern) {
  return html.match(pattern)?.[1] ?? null;
}

function languageMenu(html) {
  return html.slice(html.indexOf('<details class="language-picker"'), html.indexOf('</details>'));
}

test('every page is built for every locale plus the legacy English policy', () => {
  assert.ok(existsSync(OUT), 'run `next build` before `node --test tests/`');
  for (const page of PAGES) {
    for (const locale of LOCALES) assert.ok(existsSync(fileFor(localizedPath(page.key, locale))), `${page.key} ${locale}`);
  }
  assert.ok(existsSync(fileFor('/plugins/browser-control/privacy/')), 'legacy English policy address');
  assert.equal(existsSync(join(OUT, 'CNAME')), true, 'CNAME for the custom domain');
  assert.equal(existsSync(join(OUT, 'robots.txt')), true, 'robots.txt');
  assert.equal(existsSync(join(OUT, 'sitemap.xml')), true, 'sitemap.xml');
});

test('each page declares its own language, canonical and description', () => {
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      const path = localizedPath(page.key, locale);
      const html = read(path);
      assert.equal(attribute(html, /<html lang="([^"]+)"/), HTML_LANG[locale], `lang of ${path}`);
      assert.equal(attribute(html, /<link rel="canonical" href="([^"]+)"/), `https://oceanharness.com${path}`, `canonical of ${path}`);
      assert.match(html, /<meta name="description" content="[^"]+"/, `description of ${path}`);
      assert.match(html, /<meta name="theme-color" content="#0b111c"/, `theme color of ${path}`);
      assert.match(html, /<meta property="og:image" content="https:\/\/oceanharness\.com\/assets\/ocean-social\.jpg"/, `og image of ${path}`);
      assert.match(html, /<meta name="twitter:card" content="summary_large_image"/, `twitter card of ${path}`);
    }
  }
});

test('the legacy policy address serves English and canonicalizes to the English route', () => {
  const html = read('/plugins/browser-control/privacy/');
  assert.equal(attribute(html, /<html lang="([^"]+)"/), 'en');
  assert.equal(attribute(html, /<link rel="canonical" href="([^"]+)"/), 'https://oceanharness.com/en/plugins/browser-control/privacy/');
});

test('alternates cover all nine locales and point at distinct addresses', () => {
  for (const page of PAGES) {
    const html = read(localizedPath(page.key, 'ru'));
    const alternates = [...html.matchAll(/<link rel="alternate" hrefLang="([^"]+)" href="([^"]+)"/g)];
    const map = new Map(alternates.map(([, code, url]) => [code, url]));
    for (const locale of LOCALES) {
      assert.equal(map.get(HTML_LANG[locale]), localizedUrl(page.key, locale), `${page.key} ${locale} alternate`);
    }
    assert.equal(map.get('x-default'), localizedUrl(page.key, 'ru'), `${page.key} x-default`);
    // `x-default` repeats the Russian address, so nine URLs back the ten entries.
    assert.equal(new Set(map.values()).size, 9, `${page.key} alternate URLs are unique`);
  }
});

test('translated pages carry no Russian text outside the language menu', () => {
  for (const page of PAGES) {
    for (const locale of LOCALES.filter(code => code !== 'ru')) {
      const path = localizedPath(page.key, locale);
      const html = read(path);
      const stripped = html.replace(/<details class="language-picker"[\s\S]*?<\/details>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
      const body = stripped.slice(stripped.indexOf('<body'));
      const text = body.replace(/<[^>]*>/g, ' ');
      const hits = text.match(/[А-Яа-яЁё][^<]{0,60}/g) ?? [];
      assert.deepEqual(hits, [], `untranslated copy in ${path}: ${hits.slice(0, 3).join(' | ')}`);
    }
  }
});

test('the language menu offers all nine locales of the current page', () => {
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      const path = localizedPath(page.key, locale);
      const menu = languageMenu(read(path));
      const links = [...menu.matchAll(/<a href="([^"]+)" lang="([^"]+)" hrefLang="([^"]+)"( aria-current="page")?>/g)];
      assert.equal(links.length, 9, `menu links on ${path}`);
      assert.deepEqual(links.map(([, , code]) => code), LOCALES.map(code => HTML_LANG[code]), `menu order on ${path}`);
      const targets = links.map(([, href]) => href);
      assert.deepEqual(targets, LOCALES.map(code => localizedPath(page.key, code)), `menu targets on ${path}`);
      assert.equal(links.filter(([, , , , current]) => current).length, 1, `one current entry on ${path}`);
      assert.equal(links.findIndex(([, , , , current]) => current), LOCALES.indexOf(locale), `current is the page locale on ${path}`);
    }
  }
});

test('every internal link and asset resolves to a built file', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.push(path);
    }
  };
  walk(OUT);
  const onDisk = new Set(files.map(path => '/' + path.slice(OUT.length + 1).split('\\').join('/')));
  for (const page of PAGES) {
    for (const locale of LOCALES) {
      const path = localizedPath(page.key, locale);
      for (const html of [read(path)]) {
        for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*?)"/g)) {
          const target = href.split('#')[0];
          if (!target) continue;
          const candidates = [target, `${target}index.html`, `${target.replace(/\/$/, '')}/index.html`];
          assert.ok(candidates.some(candidate => onDisk.has(candidate)), `${path} links to missing ${target}`);
        }
      }
    }
  }
});

test('the sitemap lists every published address once', () => {
  const xml = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url.replace('https://oceanharness.com', ''));
  const expected = [];
  for (const page of PAGES) {
    for (const locale of LOCALES) expected.push(localizedPath(page.key, locale));
    if (page.privacyLegacy) expected.push(page.path);
  }
  assert.deepEqual(new Set(urls).size, urls.length, 'sitemap has duplicates');
  assert.deepEqual(urls.slice().sort(), expected.slice().sort(), 'sitemap coverage');
});
