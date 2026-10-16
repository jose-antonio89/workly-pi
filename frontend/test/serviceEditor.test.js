import test from 'node:test';
import assert from 'node:assert/strict';
import { serviceFormPayload, saveService, removeService } from '../src/services/serviceEditorService.js';
import { createGuides, editGuides } from '../src/services/serviceFormGuides.js';
import { aliasDestination } from '../src/routes/routeDefinitions.js';
test('service FormData preserves original raw fields and separate create/edit checkbox encodings', () => {
  const body = new FormData();
  body.set('genero_id', '2');
  body.set('nome', ' raw title ');
  body.set('valorCombinar', 'on');
  assert.equal(serviceFormPayload(body).get('categoriaId'), '2');
  assert.equal(body.get('nome'), ' raw title ');
  assert.equal(body.get('precoNegociavel'), 'false');
  assert.equal(body.get('valorCombinar'), 'on');
  assert.equal(serviceFormPayload(body, true, false).get('valorCombinar'), 'false');
  assert.equal(serviceFormPayload(body, true, true).get('valorCombinar'), 'true');
  assert.equal(body.has('preco'), false);
});
test('create/edit guides retain all seven official categories and distinct example punctuation', () => {
  assert.equal(Object.keys(createGuides).length, 7);
  assert.equal(Object.keys(editGuides).length, 7);
  assert.equal(
    createGuides['2'].descriptionExample,
    'Criação de página responsiva com formulário, SEO básico e botão de contato.'
  );
  assert.equal(
    editGuides['2'].descriptionPlaceholder,
    'Ex: Criação de página responsiva com formulário, SEO básico e botão de contato.'
  );
});
test('service editor posts/puts multipart with official error message and retains edit URL alias', async (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null }
  });
  t.after(() =>
    previous
      ? Object.defineProperty(globalThis, 'localStorage', previous)
      : delete globalThis.localStorage
  );
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url, options.method, options.body]);
    return Response.json({ dados: { idServico: 'qa' } });
  });
  const data = new FormData();
  data.set('nome', 'QA');
  await saveService(data);
  await saveService(data, 's');
  await removeService('s');
  assert.deepEqual(
    calls.map(([url, method]) => [url, method]),
    [
      ['/api/servicos', 'POST'],
      ['/api/servicos/s', 'PUT'],
      ['/api/servicos/s', 'DELETE']
    ]
  );
  assert.equal(calls[0][2], data);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ mensagem: 'Não é possível remover um serviço com contratos ativos.' }, { status: 400 }));
  await assert.rejects(removeService('s'), (error) => error.status === 400 && /contratos ativos/.test(error.message));
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ mensagem: 'Categoria inválida.' }, { status: 400 })
  );
  await assert.rejects(
    saveService(data),
    (error) => error.message === 'Categoria inválida.' && error.status === 400
  );
  assert.equal(aliasDestination('/pages/editar-servico.html?id=s#x'), '/editar-servico?id=s#x');
});
