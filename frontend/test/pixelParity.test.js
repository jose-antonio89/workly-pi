import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { result } = createRequire(import.meta.url)('./helpers/pixel-comparison.cjs');

test('pixel comparison accepts exactly 0.5 percent and fails above it', () => {
  assert.equal(result(50, 10000).pass, true);
  assert.equal(result(51, 10000).pass, false);
});
test('pixel comparison never hides runtime errors behind a matching screenshot', () => {
  assert.equal(result(0, 10000, ['Unrecorded API fixture']).pass, false);
  assert.throws(() => result(0, 0), /Invalid pixel/);
  assert.throws(() => result(101, 100), /Invalid pixel/);
});
