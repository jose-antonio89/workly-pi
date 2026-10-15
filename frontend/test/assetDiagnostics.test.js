import test from 'node:test';
import assert from 'node:assert/strict';
import { assetStatusError, isAssetRequest } from '../scripts/asset-diagnostics.js';

test('missing backend default avatar fails with an explicit environment diagnostic', () => {
  assert.match(
    assetStatusError('http://localhost:3000/uploads/perfis/perfil_padrao.svg', 404),
    /DEPENDENCIA DE AMBIENTE.*backend\/uploads\/perfis\/perfil_padrao.svg/
  );
  assert.equal(
    assetStatusError('http://localhost:3000/uploads/perfis/perfil_padrao.svg', 200),
    null
  );
});

test('other assets returning 404 are not hidden by image fallbacks', () => {
  assert.match(assetStatusError('http://localhost/assets/missing.png', 404), /Asset retornou 404/);
  for (const type of ['image', 'stylesheet', 'script', 'font', 'media']) {
    assert.equal(isAssetRequest({ resourceType: () => type }), true);
  }
  assert.equal(isAssetRequest({ resourceType: () => 'fetch' }), false);
});
