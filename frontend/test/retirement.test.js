import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';

test('retired source trees contain no legacy documents, styles or scripts', async () => {
  for (const directory of ['pages', 'assets/css', 'assets/js']) {
    const entries = await readdir(new URL(`../${directory}/`, import.meta.url)).catch((error) => {
      assert.equal(error.code, 'ENOENT');
      return [];
    });
    assert.deepEqual(entries, [], directory);
  }
  for (const file of [
    'authBridge.js',
    'catalogBridge.js',
    'profileBridge.js',
    'serviceEditorBridge.js',
    'contractBridge.js',
    'socialBridge.js',
    'src/pages/LegacyPage.jsx'
  ]) {
    await assert.rejects(access(new URL(`../${file}`, import.meta.url)), { code: 'ENOENT' });
  }
  await access(new URL('../index.html', import.meta.url));
  await access(new URL('../src/styles.css', import.meta.url));
  await access(new URL('../assets/img/logo.png', import.meta.url));
});
