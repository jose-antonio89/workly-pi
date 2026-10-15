import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activeChatStatuses,
  contractId,
  otherUser,
  publicProfileUrl,
  ownMessage,
  conversationPreviews,
  messageSummaries,
  contractMessages,
  sendContractMessage
} from '../src/services/messageService.js';
import { myFavorites } from '../src/services/favoriteService.js';
import { aliasDestination } from '../src/routes/routeDefinitions.js';
test('conversation identity, active statuses and fallback previews preserve official aliases', () => {
  assert.deepEqual(activeChatStatuses, [
    'pendente',
    'proposta_pendente',
    'proposta_aceita',
    'em_andamento',
    'entregue'
  ]);
  const c = {
    id_contrato: 'c',
    papel: 'cliente',
    freelancer: { idUsuario: 'u', nome: 'QA' },
    mensagem: 'Proposta'
  };
  assert.equal(contractId(c), 'c');
  assert.equal(otherUser(c).nome, 'QA');
  assert.equal(publicProfileUrl({ id_usuario: 'u' }), '/perfil-publico?id=u');
  assert.equal(ownMessage({ remetente: { id_usuario: 'u' } }, { idUsuario: 'u' }), true);
  assert.deepEqual(conversationPreviews([c], [], {}).c, {
    text: 'Proposta',
    mine: false,
    date: '',
    unread: 0
  });
  const preview = conversationPreviews(
    [c],
    [
      {
        contrato_id: 'c',
        nao_lidas: 3,
        ultimaMensagem: { texto: 'QA', remetente: { idUsuario: 'u' } }
      }
    ],
    { idUsuario: 'u' }
  ).c;
  assert.equal(preview.unread, 3);
  assert.equal(preview.mine, true);
  assert.equal(
    conversationPreviews([{ idContrato: 'a' }], [], {}, true).a.text,
    'Não foi possível carregar a última mensagem.'
  );
});
test('social endpoints preserve read effects, payload and backend failure', async (t) => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null }
  });
  t.after(() =>
    old ? Object.defineProperty(globalThis, 'localStorage', old) : delete globalThis.localStorage
  );
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    calls.push([url, opts]);
    return Response.json({ dados: [] });
  });
  await myFavorites();
  await messageSummaries();
  await contractMessages('c');
  await sendContractMessage('c', 'QA');
  assert.deepEqual(
    calls.map(([url, opts]) => [url, opts.method || 'GET']),
    [
      ['/api/favoritos', 'GET'],
      ['/api/mensagens/resumo', 'GET'],
      ['/api/mensagens/contrato/c', 'GET'],
      ['/api/mensagens', 'POST']
    ]
  );
  assert.deepEqual(JSON.parse(calls[3][1].body), { contratoId: 'c', texto: 'QA' });
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json(
      { mensagem: 'Você não faz parte deste contrato ou ele não existe.' },
      { status: 403 }
    )
  );
  await assert.rejects(
    contractMessages('c'),
    (error) =>
      error.status === 403 &&
      error.message === 'Você não faz parte deste contrato ou ele não existe.'
  );
  assert.equal(
    aliasDestination('/pages/mensagens.html?id=c&notificacoes=mensagens#x'),
    '/mensagens?id=c&notificacoes=mensagens#x'
  );
});
