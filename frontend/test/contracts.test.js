import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canReview,
  contractActions,
  contractPrice,
  contractStatus,
  contractFeedback,
  createContract,
  myContracts,
  contractAction,
  reviewContract
} from '../src/services/contractService.js';
import { aliasDestination } from '../src/routes/routeDefinitions.js';

test('contract actions require client confirmation before review', () => {
  assert.deepEqual(contractActions({ papel: 'cliente', status: 'em_andamento' }), []);
  assert.deepEqual(contractActions({ papel: 'freelancer', status: 'pendente' }), [
    ['aceitar', 'Aceitar/Iniciar'],
    ['cancelar', 'Cancelar']
  ]);
  assert.deepEqual(
    contractActions({ papel: 'freelancer', status: 'proposta_aceita' }).map((item) => item[0]),
    ['iniciar', 'entregar', 'cancelar']
  );
  for (const status of ['concluido', 'cancelado', 'encerrado'])
    for (const papel of ['cliente', 'freelancer'])
      assert.deepEqual(contractActions({ papel, status }), []);
  assert.deepEqual(contractActions({ papel: 'cliente', status: 'entregue' }), [
    ['confirmar', 'Confirmar recebimento']
  ]);
  assert.deepEqual(contractActions({ papel: 'freelancer', status: 'entregue' }), []);
  assert.equal(canReview({ papel: 'cliente', status: 'entregue' }), false);
  assert.equal(contractStatus('entregue'), 'Aguardando confirmação do cliente');
  assert.equal(contractStatus('concluido'), 'Entrega concluída');
  assert.equal(contractStatus('encerrado'), 'Concluído');
});
test('review availability, feedback and price aliases match legacy', () => {
  assert.equal(canReview({ papel: 'cliente', status: 'concluido' }), true);
  assert.equal(canReview({ papel: 'cliente', status: 'concluido', ja_avaliado: true }), false);
  assert.equal(canReview({ papel: 'freelancer', status: 'concluido' }), false);
  assert.equal(contractPrice({ tipoContratacao: 'combinar' })[1], 'Valor a combinar');
  assert.equal(contractPrice({ preco_proposto: 25 })[1], 'Proposta: R$ 25,00');
  assert.equal(
    contractFeedback({ papel: 'freelancer', status: 'encerrado' })[1],
    'Serviço avaliado pelo contratante.'
  );
});
test('contract API keeps raw review/proposal field types, POST actions and backend errors', async (t) => {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null }
  });
  t.after(() =>
    old ? Object.defineProperty(globalThis, 'localStorage', old) : delete globalThis.localStorage
  );
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url, options]);
    return Response.json({ dados: [] });
  });
  await myContracts();
  await createContract({ servicoId: 's', precoProposto: '', mensagem: 'QA' });
  await contractAction('c', 'entregar');
  await reviewContract({ contratoId: 'c', notaServico: '5', notaFreelancer: '4', comentario: '' });
  assert.deepEqual(
    calls.map(([url, opts]) => [url, opts.method || 'GET']),
    [
      ['/api/contratos/meus', 'GET'],
      ['/api/contratos', 'POST'],
      ['/api/contratos/c/entregar', 'POST'],
      ['/api/avaliacoes', 'POST']
    ]
  );
  assert.equal(JSON.parse(calls[1][1].body).precoProposto, '');
  assert.equal(JSON.parse(calls[3][1].body).notaServico, '5');
  assert.equal(calls[2][1].body, undefined);
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json(
      { mensagem: 'Você já possui uma contratação ativa para este serviço.' },
      { status: 409 }
    )
  );
  await assert.rejects(
    createContract({}),
    (error) =>
      error.status === 409 &&
      error.message === 'Você já possui uma contratação ativa para este serviço.'
  );
  assert.equal(
    aliasDestination('/pages/contratos.html?notificacoes=contratos&contrato=c#x'),
    '/contratos?notificacoes=contratos&contrato=c#x'
  );
});
