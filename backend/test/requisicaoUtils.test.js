const test = require('node:test');
const assert = require('node:assert/strict');
const { idMongoValido, obterCampo, normalizarTipoConta } = require('../src/utils/requisicaoUtils');

test('idMongoValido aceita somente ObjectId hexadecimal completo', () => {
  assert.equal(idMongoValido('507f1f77bcf86cd799439011'), true);
  assert.equal(idMongoValido('id-invalido'), false);
  assert.equal(idMongoValido('507f1f77bcf86cd79943901'), false);
  assert.equal(idMongoValido(null), false);
});

test('obterCampo preserva valores falsos enviados pelo cliente', () => {
  assert.equal(obterCampo({ ativo: false }, ['ativo'], true), false);
  assert.equal(obterCampo({ quantidade: 0 }, ['quantidade'], 10), 0);
});

test('normalizarTipoConta rejeita tipos desconhecidos', () => {
  assert.equal(normalizarTipoConta(' freelancer '), 'Freelancer');
  assert.equal(normalizarTipoConta('CONTRATANTE'), 'Contratante');
  assert.equal(normalizarTipoConta('administrador'), '');
});
