// Server HTTP statis ringan untuk menjalankan app/ secara lokal pada Node 22+ tanpa instalasi paket.
// Jalankan dengan `node serve.ts` (default port 8080, atau `--port <angka>`).

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function parsePort(argv: string[]): number {
  const flagIdx = argv.indexOf('--port');
  if (flagIdx === -1) return 8080;
  const candidate = Number(argv[flagIdx + 1]);
  return Number.isInteger(candidate) && candidate > 0 && candidate < 65536 ? candidate : 8080;
}

const listenPort = parsePort(process.argv.slice(2));

const server = createServer((req, res) => {
  const parsed = new URL(req.url ?? '/', 'http://127.0.0.1');
  let reqPath: string;
  try {
    reqPath = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Permintaan tidak valid');
    return;
  }

  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }

  const targetFile = resolve(join(APP_ROOT, normalize(reqPath)));
  if (targetFile !== APP_ROOT && !targetFile.startsWith(APP_ROOT + sep)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }).end('Akses ditolak');
    return;
  }

  let fileSize = 0;
  try {
    const info = statSync(targetFile);
    if (!info.isFile()) throw new Error('Bukan berkas reguler');
    fileSize = info.size;
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Berkas tidak ditemukan');
    return;
  }

  const mime = CONTENT_TYPES[extname(targetFile).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, {
    'content-type': mime,
    'content-length': fileSize,
    'cache-control': 'no-store',
  });
  createReadStream(targetFile).pipe(res);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`Dompet Keluarga tersedia di http://localhost:${listenPort}`);
});
