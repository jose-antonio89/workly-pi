import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('legacy width limits use inclusive media queries rather than strict Tailwind max variants', async () => {
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
      if (entry.isDirectory()) await visit(file);
      else if (/\.(jsx|js)$/.test(entry.name))
        assert.doesNotMatch(await readFile(file, 'utf8'), /max-\[\d+px\]:/, file.pathname);
    }
  }
  await visit(new URL('../src/', import.meta.url));
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const widths = [
    ...css.matchAll(/@custom-variant legacy-max-(\d+) \(@media \(max-width: (\d+)px\)\);/g)
  ];
  assert.ok(widths.length > 20);
  for (let index = 0; index < widths.length; index++) {
    assert.equal(widths[index][1], widths[index][2]);
    if (index)
      assert.ok(
        Number(widths[index - 1][1]) > Number(widths[index][1]),
        'Narrower variants must come last'
      );
  }
});
