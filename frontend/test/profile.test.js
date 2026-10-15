import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readProfile,
  profilePayload,
  updateProfile,
  updateAccountType,
  updatePassword,
  uploadPhoto,
  deleteAccount
} from '../src/services/profileService.js';
import {
  mergeDashboardWithFallback,
  formatContractStatus
} from '../src/services/profileDashboard.js';
import { aliasDestination } from '../src/routes/routeDefinitions.js';

test('profile response preserves public twelve-review summary and official aliases', () => {
  const result = profilePayload({
    dados: {
      user: { id_usuario: 'u', tipo_conta: 'Freelancer' },
      services: [{ id_servico: 's' }],
      reviews: Array(12).fill({ notaFreelancer: 5 }),
      reviewSummary: { total: 12, mediaFreelancer: 4.5 }
    }
  });
  assert.equal(result.user.idUsuario, 'u');
  assert.equal(result.services[0].idServico, 's');
  assert.equal(result.reviewSummary.total, 12);
});
test('profile services use official endpoints, bearer, partial fields and crop upload name', async (t) => {
  const values = new Map([['token', 'qa']]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }
  });
  t.after(() =>
    previous
      ? Object.defineProperty(globalThis, 'localStorage', previous)
      : delete globalThis.localStorage
  );
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push([url, options]);
    return Response.json({
      user: { nome: 'QA', tipoConta: 'Freelancer', doisFatores: true },
      services: []
    });
  });
  await readProfile('u');
  assert.equal(values.has('user'), false);
  await readProfile();
  assert.equal(JSON.parse(values.get('user')).doisFatores, true);
  await updateProfile({ doisFatores: false });
  await updateAccountType({ tipoConta: 'Contratante', areaAtuacao: '' });
  await updatePassword({ senhaAtual: 'a', novaSenha: 'b', confirmarSenha: 'b' });
  await uploadPhoto(new Blob(['qa'], { type: 'image/webp' }));
  await deleteAccount();
  assert.deepEqual(
    requests.map(([url, options]) => [url, options.method || 'GET']),
    [
      ['/api/usuarios/publico/u', 'GET'],
      ['/api/usuarios/perfil', 'GET'],
      ['/api/usuarios/perfil', 'PUT'],
      ['/api/usuarios/tipo-conta', 'PATCH'],
      ['/api/usuarios/perfil/senha', 'PUT'],
      ['/api/usuarios/perfil/foto', 'POST'],
      ['/api/usuarios/perfil', 'DELETE']
    ]
  );
  assert.equal(requests[2][1].body, '{"doisFatores":false}');
  assert.equal(requests[5][1].body.get('nova_foto').name, 'foto-perfil.webp');
  for (const [, options] of requests) assert.equal(options.headers.Authorization, 'Bearer qa');
  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ mensagem: 'Senha atual incorreta.' }, { status: 401 })
  );
  await assert.rejects(
    updatePassword({}),
    (error) => error.status === 401 && error.message === 'Senha atual incorreta.'
  );
  assert.equal(values.get('token'), 'qa');
});
test('dashboard fallback preserves confirmed-value statuses and uses useful official dashboard', () => {
  const leads = [
    {
      tipoContratacao: 'combinar',
      status: 'proposta_pendente',
      precoProposto: 100,
      createdAt: new Date().toISOString()
    },
    { tipoContratacao: 'fixo', status: 'pendente', preco: 50, createdAt: new Date().toISOString() }
  ];
  assert.equal(mergeDashboardWithFallback({}, [], [], leads).summary.valorTotal, 50);
  const backend = { summary: { valorTotal: 123 }, recentActivities: [{ titulo: 'API' }] };
  assert.equal(mergeDashboardWithFallback(backend, [], [], leads).summary.valorTotal, 123);
  assert.equal(formatContractStatus('encerrado'), 'Concluído');
});
test('profile URL aliases preserve id/hash without intercepting unknown documents', () => {
  assert.equal(aliasDestination('/pages/perfil-publico.html?id=abc#x'), '/perfil-publico?id=abc#x');
  assert.equal(aliasDestination('/pages/perfil.html#services'), '/perfil#services');
  assert.equal(aliasDestination('/pages/perfil.html.extra'), null);
});
