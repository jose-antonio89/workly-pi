import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
let checked = 0;
async function check(url, from = root) {
  const value = url
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .split(/[?#]/)[0];
  if (!value || /^(data:|https?:|blob:)/.test(value)) return;
  const target = value.startsWith('/') ? path.join(root, value) : path.resolve(from, value);
  assert.ok(target.startsWith(root), `Asset outside build: ${url}`);
  await access(target);
  checked++;
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) await check(match[1]);
async function styles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) await styles(name);
    else if (entry.name.endsWith('.css')) {
      const css = await readFile(name, 'utf8');
      for (const match of css.matchAll(/url\(([^)]+)\)/g)) await check(match[1], dir);
    }
  }
}
await styles(root);
for (const file of [
  'assets/img/logo.png',
  'assets/img/perfis/perfil_padrao.svg',
  'assets/img/servicos/servico_padrao.svg',
  'vendor/manifest.json'
])
  await check('/' + file);
console.log(
  `Build assets verified: ${checked} local references. Live API/browser validation is separate (test:assets:live).`
);
