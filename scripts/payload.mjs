/**
 * Payload of a page: the HTML plus every script, stylesheet and font it asks for.
 *
 * The static site shipped one 1.5 KB script; the export ships a React runtime. This measures what a first visit
 * actually downloads, so the trade-off of the rewrite is a number instead of an opinion.
 *
 * Usage: node scripts/payload.mjs [origin] [paths…]
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = process.argv[2] ?? 'http://127.0.0.1:4183';
const paths = process.argv.slice(3).filter(p => p.startsWith('/'));
const targets = paths.length > 0 ? paths : ['/', '/plugins/', '/downloads/', '/start/', '/privacy/', '/plugins/browser-control/', '/plugins/computer-use/'];

const kb = bytes => (bytes / 1024).toFixed(1).padStart(7);
const local = origin.startsWith('http://127.0.0.1:4183');

async function load(url) {
  if (local) {
    const rel = url.replace(origin, '').replace(/^\//, '');
    const file = rel.endsWith('.html') || /\.[a-z0-9]+$/i.test(rel) ? rel : `${rel.replace(/\/$/, '')}/index.html`;
    return new Uint8Array(await readFile(join(ROOT, 'out', file || 'index.html')));
  }
  const response = await fetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

const rows = [];
for (const path of targets) {
  const html = new TextDecoder().decode(await load(`${origin}${path}`));
  // Absolute script, stylesheet and font references; page links are not assets.
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"]+\.(?:js|css|woff2))"/g)].map(m => m[1]);
  const seen = new Set(assets);
  let js = 0, css = 0, fonts = 0;
  for (const asset of seen) {
    const bytes = (await load(`${origin}${asset}`)).byteLength;
    if (asset.endsWith('.js')) js += bytes;
    else if (asset.endsWith('.css')) css += bytes;
    else if (asset.endsWith('.woff2')) fonts += bytes;
  }
  rows.push({ path, html: html.length, js, css, fonts, total: html.length + js + css + fonts });
}

console.log(`payload from ${origin}`);
console.log('path                                html      js     css   fonts   total');
for (const row of rows) {
  console.log(`${row.path.padEnd(36)}${kb(row.html)}${kb(row.js)}${kb(row.css)}${kb(row.fonts)}${kb(row.total)}`);
}
const sum = rows.reduce((total, row) => total + row.total, 0);
console.log(`${rows.length} pages, mean ${kb(sum / rows.length)} KB, js mean ${kb(rows.reduce((t, r) => t + r.js, 0) / rows.length)} KB`);
