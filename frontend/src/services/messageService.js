import { apiRequest } from './apiClient.js';
export const activeChatStatuses = [
  'pendente',
  'proposta_pendente',
  'proposta_aceita',
  'em_andamento',
  'entregue'
];
export function contractId(c) {
  return String(c.idContrato || c.id_contrato || c._id || '');
}
export function otherUser(c) {
  return (c.papel === 'cliente' ? c.freelancer : c.cliente) || {};
}
export function publicProfileUrl(user = {}) {
  const id = user.idUsuario || user.id_usuario || user._id || user.id;
  return id ? `/perfil-publico?id=${encodeURIComponent(id)}` : '#';
}
export function ownMessage(message, user = {}) {
  return (
    String(message.remetente?.idUsuario || message.remetente?.id_usuario || '') ===
    String(user.idUsuario || user.id_usuario || '')
  );
}
export async function messageSummaries() {
  return (await apiRequest('/api/mensagens/resumo')).dados || [];
}
export async function contractMessages(id, options = {}) {
  return (await apiRequest(`/api/mensagens/contrato/${id}`, options)).dados || [];
}
export function sendContractMessage(id, texto) {
  return apiRequest('/api/mensagens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contratoId: id, texto })
  });
}
export function conversationPreviews(contracts, summaries, user = {}, failed = false) {
  const byId = new Map(
    summaries.map((item) => [String(item.contratoId || item.contrato_id), item])
  );
  return Object.fromEntries(
    contracts.map((c) => {
      const summary = byId.get(contractId(c)),
        last = summary?.ultimaMensagem;
      return [
        contractId(c),
        last
          ? {
              text: last.texto || '',
              mine: ownMessage(last, user),
              date: last.createdAt
                ? new Date(last.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '',
              unread: Number(summary.naoLidas || summary.nao_lidas || 0)
            }
          : {
              text:
                c.mensagem ||
                (failed
                  ? 'Não foi possível carregar a última mensagem.'
                  : 'Nenhuma mensagem ainda.'),
              mine: false,
              date: '',
              unread: 0
            }
      ];
    })
  );
}
