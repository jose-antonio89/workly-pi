import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { routeDefinitions, aliasDestination } from '../src/routes/routeDefinitions.js';

test('each of the 17 routes has a unique native path, alias and existing React page', async () => {
  assert.equal(routeDefinitions.length, 17);
  assert.equal(new Set(routeDefinitions.map((route) => route.path)).size, 17);
  assert.equal(new Set(routeDefinitions.map((route) => route.alias)).size, 17);
  for (const route of routeDefinitions) {
    await access(new URL(`../src/pages/${route.pageFile}`, import.meta.url));
  }
});

test('protected destinations match the approved flow inventory', () => {
  assert.deepEqual(
    routeDefinitions
      .filter((route) => route.protected)
      .map((route) => route.path)
      .sort(),
    [
      '/anuncio',
      '/contratar-servico',
      '/contrato-chat',
      '/contratos',
      '/editar-servico',
      '/favoritos',
      '/mensagens',
      '/negociar-servico',
      '/perfil'
    ].sort()
  );
});

test('URL compatibility preserves query aliases, encoded values and profile hash', () => {
  assert.equal(
    aliasDestination('/pages/perfil.html?notificacoes=contratos&contrato=a%2Fb#services'),
    '/perfil?notificacoes=contratos&contrato=a%2Fb#services'
  );
  assert.equal(aliasDestination('/pages/unknown.html'), null);
  assert.equal(aliasDestination('/todos-servicos'), null);
});
