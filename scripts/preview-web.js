import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.ttf': 'font/ttf', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
const within = (root, file) => { const path = relative(root, file); return !isAbsolute(path) && path !== '..' && !path.startsWith('../') && !path.startsWith('..\\'); };

export async function createWebPreview({ root = defaultRoot, port = 8791 } = {}) {
  const output = await realpath(resolve(root));
  try { await stat(join(output, 'index.html')); await stat(join(output, 'assets/config.json')); } catch { throw new Error('Preview requires website build output. Run npm run build first.'); }
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = code => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(code === 404 ? 'Not found' : 'Invalid request'); };
    if (!['GET', 'HEAD'].includes(req.method)) return fail(405);
    let path;
    try { path = decodeURIComponent(req.url.split('?')[0]); } catch { return fail(400); }
    if (!path.startsWith('/') || path.includes('\\') || path.includes('\0') || path.split('/').some(segment => segment === '..' || segment.startsWith('.'))) return fail(403);
    let file = resolve(output, `.${path}`);
    if (!within(output, file)) return fail(403);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      file = await realpath(file);
      if (!within(output, file)) return fail(403);
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { fail(404); }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolveListen); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolveClose, reject) => { server.close(error => error ? reject(error) : resolveClose()); server.closeIdleConnections(); }) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8791);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
  const preview = await createWebPreview({port});
  console.log(`Scribr website preview: ${preview.url}`);
}
