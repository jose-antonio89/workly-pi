import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('service editor retains fixed title sizes at desktop, tablet and mobile limits', async () => {
  const source = await readFile(
    new URL('../src/pages/ServiceEditorPage.jsx', import.meta.url),
    'utf8'
  );
  assert.match(
    source,
    /text-\[2\.25rem\].*legacy-max-820:text-\[2rem\].*legacy-max-760:text-\[1\.75rem\]/
  );
  assert.doesNotMatch(source, /fontSize[^\n]*vw|text-\[[^\]]*vw/);
});

test('proposal textarea retains its inline baseline and submit its intended minimum height', async () => {
  const source = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(
    source,
    /#proposal-form textarea\s*\{\s*display: inline-block;\s*vertical-align: baseline;/
  );
  assert.match(source, /#proposal-form button\[type=["']submit["']\]\s*\{\s*min-height: 56px;/);
});

test('editor heading weights follow the effective legacy cascade without changing tracking', async () => {
  const source = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(source, /@utility workly-editor-page\s*\{\s*& h2\s*\{\s*font-weight: 700;/);
});
