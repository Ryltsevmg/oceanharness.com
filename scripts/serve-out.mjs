/**
 * Serve the static export for local review.
 *
 * `next build` writes `out/`; GitHub Pages serves those files with directory indexes, so this server resolves a
 * directory to its `index.html` and nothing else. It is a review tool, not a deployment target: no rewrites, no
 * compression, no cache headers.
 *
 * Usage: node scripts/serve-out.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../out', import.meta.url)));
const PORT = Number(process.argv[2] ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = resolve(join(ROOT, path));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    response.writeHead(403).end();
    return;
  }
  const candidates = extname(target) ? [target] : [join(target, 'index.html'), target];
  for (const file of candidates) {
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      response.end(body);
      return;
    } catch {
      // Try the next candidate; a missing file answers 404 below.
    }
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}/`));
