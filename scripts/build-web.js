import { build } from 'esbuild';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeMarkup } from '../web/src/routes.js';
import { publicWebConfig } from './lib/public-web-config.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export async function buildWeb({ env = process.env, outdir = join(projectRoot, 'dist'), development = false } = {}) {
  const config = publicWebConfig(env, { development });
  const output = resolve(outdir);
  await mkdir(join(output, 'assets'), { recursive: true });
  await build({ entryPoints: [join(projectRoot, 'web/src/main.js')], outdir: join(output, 'assets'), splitting: true, chunkNames: 'chunks/[name]-[hash]', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'linked' });
  await build({ entryPoints: [join(projectRoot, 'web/src/theme-bootstrap.js')], outfile: join(output, 'assets/theme-bootstrap.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true });
  const styles = await Promise.all(['shared/tokens.css', 'web/styles/site.css'].map(file => readFile(join(projectRoot, file), 'utf8')));
  await writeFile(join(output, 'assets/site.css'), styles.join('\n'));
  for (const name of ['bricolage-regular.ttf', 'bricolage-bold.ttf', 'FONT-LICENSE.txt']) await copyFile(join(projectRoot, 'assets/fonts', name), join(output, 'assets', name));
  await mkdir(join(output, 'assets/studio'), {recursive:true});
  // Explicit delivery list excludes large source masters and authoring evidence.
  for (const name of ['reader.png','reader.json','background-light.png','background-dark.png','poster-light.png','poster-dark.png','furniture.png','foreground.png','foreground-dark.png']) {
    await copyFile(join(projectRoot, 'web/assets/studio', name), join(output, 'assets/studio', name));
  }
  await writeFile(join(output, 'assets/config.json'), `${JSON.stringify(config, null, 2)}\n`);
  const html = await readFile(join(projectRoot, 'web/index.html'), 'utf8');
  for (const route of ['', 'sign-in', 'sign-up', 'welcome', 'account', 'privacy', 'help']) {
    await mkdir(join(output, route), { recursive: true });
    const content = ['', 'privacy', 'help'].includes(route) ? routeMarkup(route || 'home', config) : null;
    const rendered = content ? html.replace(/(<main id="app"[^>]*>)[\s\S]*?<\/main>/, '$1' + content + '</main>') : html;
    await writeFile(join(output, route, 'index.html'), rendered);
  }
  await writeFile(join(output, '404.html'), html);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--development')) throw new Error('Usage: node scripts/build-web.js [--development]');
  await buildWeb({ development: args.includes('--development') });
  console.log('Built Scribr website in dist with public configuration only.');
}
