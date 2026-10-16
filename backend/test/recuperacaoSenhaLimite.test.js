// Etapa 3: limite padrão por IP (20 em 15 minutos), compartilhado pela solicitação e pela redefinição.
// Fica num arquivo próprio para usar o limite padrão, sem o ajuste do outro arquivo de testes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { iniciarAmbiente } = require('./helpers/apiTeste');

let amb;
test.before(async () => {
  delete process.env.RECUPERACAO_SENHA_LIMITE_IP;
  amb = await iniciarAmbiente('recuperacao_limite');
});
test.after(async () => amb?.encerrar());

test('limite por IP vale para solicitar e redefinir', async (t) => {
  if (!amb) return t.skip('MongoDB local indisponível');
  const status = [];
  for (let i = 0; i < 20; i += 1) {
    const rota = i % 2 ? '/api/autenticacao/redefinir-senha' : '/api/autenticacao/recuperar-senha';
    // e-mails diferentes, para o limite por e-mail não interferir
    const resposta = await amb.chamar('POST', rota, undefined, { email: `ip${i}@teste.local`, token: 'x', novaSenha: 'y' });
    status.push(resposta.status);
  }
  assert.ok(status.every((s) => s !== 429), `antes do limite: ${status.join(',')}`);
  for (const rota of ['/api/autenticacao/recuperar-senha', '/api/autenticacao/redefinir-senha']) {
    const bloqueada = await amb.chamar('POST', rota, undefined, { email: 'mais-um@teste.local' });
    assert.equal(bloqueada.status, 429);
    assert.match(bloqueada.dados.mensagem, /Muitas tentativas/);
  }
});
