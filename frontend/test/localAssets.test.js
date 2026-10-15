import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('vendored fonts, icons and charts retain their recorded bytes and licenses', async () => {
  const root = new URL('../public/vendor/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
  assert.ok(manifest.length > 20);
  for (const item of manifest) {
    const bytes = await readFile(new URL(item.file, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, item.file);
  }
  for (const license of ['Poppins-OFL.txt', 'FontAwesome-LICENSE.txt', 'Chart-LICENSE.md'])
    assert.ok(manifest.some((item) => item.file === license));
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /https:\/\/(fonts\.|cdnjs\.)/);
});
