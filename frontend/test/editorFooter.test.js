import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('editor routes opt into the existing compact catalog footer geometry', async () => {
  const shell = await readFile(
    new URL('../src/components/catalog/CatalogShell.jsx', import.meta.url),
    'utf8'
  );
  const footer = await readFile(
    new URL('../src/components/auth/AuthFooter.jsx', import.meta.url),
    'utf8'
  );
  assert.match(
    shell,
    /compact=\{\['\/anuncio', '\/editar-servico'\]\.includes\(location\.pathname\)\}/
  );
  assert.match(footer, /detail \|\| about \|\| compact \? '' : 'mb-\[30px\]'/);
  assert.match(footer, /catalog && \(detail \|\| about \|\| compact\) \? '' : 'pb-2\.5'/);
});
