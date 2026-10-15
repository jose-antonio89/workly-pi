import { apiRequest } from './apiClient.js';
import { formatCurrency } from './catalogService.js';

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
export function createContract(payload) {
  return apiRequest('/api/contratos', json(payload));
}
export async function myContracts() {
  return (await apiRequest('/api/contratos/meus')).dados || [];
}
export function contractAction(id, action) {
  return apiRequest(`/api/contratos/${id}/${action}`, { method: 'POST' });
}
export function reviewContract(payload) {
  return apiRequest('/api/avaliacoes', json(payload));
}
export const finalStatuses = ['concluido', 'cancelado', 'encerrado'];
export function contractStatus(status = '') {
  return (
    {
      pendente: 'Aguardando início',
      proposta_pendente: 'Proposta pendente',
      proposta_aceita: 'Proposta aceita',
      em_andamento: 'Em andamento',
      entregue: 'Aguardando confirmação do cliente',
      concluido: 'Entrega concluída',
      cancelado: 'Cancelado',
      encerrado: 'Concluído'
    }[status] || String(status).replace('_', ' ')
  );
}
export function contractActions(c) {
  if (finalStatuses.includes(c.status)) return [];
  if (c.papel === 'freelancer') {
    return (
      {
        proposta_pendente: [
          ['aceitar', 'Aceitar proposta'],
          ['recusar', 'Recusar']
        ],
        pendente: [
          ['aceitar', 'Aceitar/Iniciar'],
          ['cancelar', 'Cancelar']
        ],
        proposta_aceita: [
          ['iniciar', 'Iniciar trabalho'],
          ['entregar', 'Finalizar entrega'],
          ['cancelar', 'Cancelar']
        ],
        em_andamento: [
          ['entregar', 'Finalizar entrega'],
          ['cancelar', 'Cancelar']
        ]
      }[c.status] || []
    );
  }
  if (c.papel === 'cliente' && c.status === 'entregue')
    return [['confirmar', 'Confirmar recebimento']];
  return ['pendente', 'proposta_pendente', 'proposta_aceita'].includes(c.status)
    ? [['cancelar', 'Cancelar contratação']]
    : [];
}
export function contractPrice(c) {
  if (c.tipoContratacao === 'combinar' && !c.preco && !c.precoProposto && !c.preco_proposto)
    return ['fa-comments-dollar', 'Valor a combinar'];
  if (c.precoProposto || c.preco_proposto)
    return [
      'fa-hand-holding-dollar',
      `Proposta: ${formatCurrency(c.precoProposto || c.preco_proposto)}`
    ];
  return ['fa-money-bill-wave', formatCurrency(c.preco || 0)];
}
export function canReview(c) {
  return c.papel === 'cliente' && c.status === 'concluido' && !c.jaAvaliado && !c.ja_avaliado;
}
export function contractFeedback(c) {
  if (c.papel === 'cliente' && (c.status === 'encerrado' || c.jaAvaliado || c.ja_avaliado))
    return ['fa-circle-check', 'Avaliação enviada. Contrato encerrado.', true];
  if (c.papel === 'freelancer' && c.status === 'encerrado')
    return ['fa-circle-check', 'Serviço avaliado pelo contratante.', true];
  if (c.status === 'entregue')
    return [
      'fa-clock',
      c.papel === 'cliente'
        ? 'Confira o serviço e confirme o recebimento.'
        : 'Entrega enviada. Aguardando confirmação do cliente.',
      false
    ];
  if (c.papel === 'cliente' && c.status === 'concluido')
    return ['fa-star', 'Contrato concluído. Você já pode avaliar o serviço.', false];
  if (c.papel === 'cliente' && c.status === 'proposta_pendente')
    return ['fa-clock', 'Aguardando resposta do freelancer.', false];
  return null;
}
