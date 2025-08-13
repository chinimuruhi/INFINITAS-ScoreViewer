// scripts/inject-prerender.mjs
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function findSsrBundle() {
  const candidates = [
    'dist-ssr/prerender.mjs',
    'dist-ssr/prerender.js',
    'dist/server/prerender.mjs',
    'dist/server/prerender.js',
    'dist/prerender.mjs',
    'dist/prerender.js',
  ];
  for (const p of candidates) {
    try { await access(resolve(p)); return pathToFileURL(resolve(p)).href; } catch {}
  }
  throw new Error('SSR bundle not found. Tried: ' + candidates.join(', '));
}

const distHtmlPath = resolve('dist/index.html');
const ssrBundleUrl = await findSsrBundle();
const { render } = await import(ssrBundleUrl);

const { html, head, jsonld } = await render();

let indexHtml = await readFile(distHtmlPath, 'utf8');
indexHtml = indexHtml.replace(/<div id="root"><\/div>/, `<div id="root">${html}</div>`);
indexHtml = indexHtml.replace(/<\/head>/, `  ${head}\n  ${jsonld}\n</head>`);
await writeFile(distHtmlPath, indexHtml, 'utf8');

console.log('✅ Top page pre-rendered into dist/index.html');
