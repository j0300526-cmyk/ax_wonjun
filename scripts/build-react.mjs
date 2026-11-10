import { build } from 'esbuild';
import { readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outfile: 'dist/assets/app.js',
  format: 'esm',
  target: ['es2022'],
  jsx: 'automatic',
  minify: true,
  legalComments: 'eof',
  logLevel: 'info'
});
const html = (await readFile('index.html', 'utf8'))
  .replace('<script type="module" src="/src/main.jsx"></script>', '<link rel="stylesheet" href="/assets/app.css"><script type="module" src="/assets/app.js"></script>');
await writeFile('dist/index.html', html);
