const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const path = require('node:path');
const controllerPath = path.resolve(__dirname, '../src/controllers/usuarioController.js');
const realRequire = createRequire(controllerPath);
async function dashboard(contracts) {
  const query = (items) => ({ populate() { return this; }, sort() { return this; }, limit() { return this; }, then(resolve, reject) { return Promise.resolve(items).then(resolve, reject); } });
  const sandbox = { module: { exports: {} }, exports: {}, require(name) {
    if (name === '../models/Contrato') return { find: () => query(contracts) };
    if (['../models/Avaliacao', '../models/Favorito', '../models/Servico'].includes(name)) return { find: () => query([]) };
    return realRequire(name);
  }};
  vm.runInNewContext(fs.readFileSync(controllerPath, 'utf8') + '\nmodule.exports.dashboard = montarDashboardPerfil;', sandbox);
  return sandbox.module.exports.dashboard({}, { _id: 'me', tipoConta: 'Freelancer' }, 0);
}
function contract(status, seller = 'other', amount = 959) {
  return { status, freelancer: seller, cliente: seller === 'me' ? 'other' : 'me', tipoContratacao: 'fixo', preco: amount, createdAt: new Date(), updatedAt: new Date(), servico: { nome: 'Serviço', categoria: { nome: 'Design' } } };
}
test('a freelancer buying a pending service has neither revenue nor completed expenses', async () => {
  const result = await dashboard([contract('pendente')]);
  assert.equal(result.summary.valorTotal, 0);
  assert.equal(result.summary.gastosTotal, 0);
  assert.equal(result.revenueDistribution.empty, true);
  assert.equal(result.recentActivities[0].titulo, 'Contratação criada');
});
test('completed purchases remain expenses even for freelancer accounts', async () => {
  const result = await dashboard([contract('concluido')]);
  assert.equal(result.summary.valorTotal, 0);
  assert.equal(result.summary.gastosTotal, 959);
  assert.equal(result.revenueDistribution.empty, true);
  assert.equal(result.monthlyPerformance.expenseData.reduce((a, b) => a + b, 0), 959);
});
test('only completed sales count as revenue; delivered, pending and cancelled sales do not', async () => {
  const result = await dashboard(['concluido', 'pendente', 'entregue', 'em_andamento', 'cancelado'].map(status => contract(status, 'me', 100)));
  assert.equal(result.summary.valorTotal, 100);
  assert.equal(result.summary.gastosTotal, 0);
  assert.equal(result.revenueDistribution.data[0], 100);
});
