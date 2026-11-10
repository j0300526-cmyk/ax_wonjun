import { build } from 'esbuild';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { relative, sep } from 'node:path';

await rm('dist', { recursive: true, force: true });
const result = await build({
  entryPoints: { app: 'src/main.jsx' },
  bundle: true,
  outdir: 'dist',
  entryNames: 'assets/[name]-[hash]',
  format: 'esm',
  target: ['es2022'],
  jsx: 'automatic',
  minify: true,
  metafile: true,
  legalComments: 'eof',
  logLevel: 'info'
});

const publicPath = output => `/${relative('dist', output).split(sep).join('/')}`;
const outputs = Object.keys(result.metafile.outputs);
const scriptPath = publicPath(outputs.find(output => output.endsWith('.js')));
const stylePath = publicPath(outputs.find(output => output.endsWith('.css')));
const html = (await readFile('index.html', 'utf8'))
  .replace('<script type="module" src="/src/main.jsx"></script>', `<link rel="stylesheet" href="${stylePath}"><script type="module" src="${scriptPath}"></script>`);
await writeFile('dist/index.html', html);
