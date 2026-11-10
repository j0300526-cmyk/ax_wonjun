import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveDermSkus } from './source-data.mjs';
import { dermSkus } from '../modules/observations.js';

const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);
if (JSON.stringify(await deriveDermSkus()) !== JSON.stringify(dermSkus)) {
  throw new Error('가상 데이터룸과 화면의 재고·발주 입력이 다릅니다.');
}
const assets = [
  'styles.css', 'app.js',
  'modules/data.js', 'modules/observations.js', 'modules/domain.js', 'modules/state.js',
  'modules/actions.js', 'modules/events.js', 'modules/copilot.js', 'modules/icons.js',
  'modules/render.js', 'modules/view/dom.js', 'modules/view/decision.js',
  'modules/view/overview.js', 'modules/view/history.js', 'modules/view/task-grid.js'
];
const files = [
  ...assets.map(file => ({ source: file, target: file })),
  { source: 'node_modules/gridjs/dist/gridjs.umd.js', target: 'vendor/gridjs.umd.js' },
  { source: 'node_modules/gridjs/dist/theme/mermaid.min.css', target: 'vendor/gridjs.css' }
];
const contents = await Promise.all(files.map(file => readFile(new URL(file.source, root))));
const fingerprint = createHash('sha256')
  .update(contents.reduce((all, content) => Buffer.concat([all, content]), Buffer.alloc(0)))
  .digest('hex')
  .slice(0, 12);
const assetRoot = `assets/${fingerprint}`;

await rm(output, { recursive: true, force: true });
for (const file of files) {
  const destination = new URL(`../dist/${assetRoot}/${file.target}`, import.meta.url);
  await mkdir(dirname(fileURLToPath(destination)), { recursive: true });
  await cp(new URL(file.source, root), destination);
}

const html = await readFile(new URL('index.html', root), 'utf8');
const builtHtml = html
  .replace('href="vendor/gridjs.css"', `href="${assetRoot}/vendor/gridjs.css"`)
  .replace('href="styles.css"', `href="${assetRoot}/styles.css"`)
  .replace('src="vendor/gridjs.umd.js"', `src="${assetRoot}/vendor/gridjs.umd.js"`)
  .replace('src="app.js"', `src="${assetRoot}/app.js"`);
if (builtHtml === html || !builtHtml.includes(`src="${assetRoot}/app.js"`) || !builtHtml.includes(`src="${assetRoot}/vendor/gridjs.umd.js"`)) {
  throw new Error('정적 자산 경로를 갱신하지 못했습니다.');
}
await writeFile(new URL('../dist/index.html', import.meta.url), builtHtml);
console.log(`정적 사이트 빌드 완료: ${assetRoot}`);
