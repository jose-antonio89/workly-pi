import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { differences } = createRequire(import.meta.url)('./helpers/layout-comparison.cjs');

test('visual parity accepts two pixels but flags any larger geometry delta', () => {
  assert.equal(differences({ x: 20 }, { x: 22 })[0].divergent, false);
  assert.equal(differences({ x: 20 }, { x: 22.01 })[0].divergent, true);
  assert.equal(differences({ fontSize: '16px' }, { fontSize: '19px' })[0].divergent, true);
});

test('visual parity normalizes equivalent circle radii and radial zero origins', () => {
  const a = {
    width: 96,
    height: 96,
    borderRadius: '50%',
    backgroundImage: 'radial-gradient(circle at 10% 0%, transparent)'
  };
  const b = {
    ...a,
    borderRadius: '999px',
    backgroundImage: 'radial-gradient(circle at 10% 0px, transparent)'
  };
  assert.equal(
    differences(a, b).some((value) => value.divergent),
    false
  );
});

test('relaxed geometric tolerance accepts eight pixels but rejects a larger delta', () => {
  assert.equal(differences({ height: 100 }, { height: 108 }, 8)[0].divergent, false);
  assert.equal(differences({ height: 100 }, { height: 108.01 }, 8)[0].divergent, true);
});
