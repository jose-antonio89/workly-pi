const Notificacao = require('../models/Notificacao');

// textos de cada tipo de notificação
// centralizado aqui para não espalhar strings pelo código de negócio
const TEMPLATES = {
  contrato_novo: (nomeServico) => ({
    titulo: 'Nova contratação recebida',
    mensagem: `Você recebeu uma nova contratação para "${nomeServico}".`
  }),
  proposta_nova: (nomeServico) => ({
    titulo: 'Nova proposta recebida',
    mensagem: `Você recebeu uma proposta para "${nomeServico}". Acesse seus contratos para responder.`
  }),
  proposta_aceita: (nomeServico) => ({
    titulo: 'Proposta aceita!',
    mensagem: `Sua proposta para "${nomeServico}" foi aceita pelo freelancer.`
  }),
  proposta_recusada: (nomeServico) => ({
    titulo: 'Proposta recusada',
    mensagem: `Sua proposta para "${nomeServico}" foi recusada.`
  }),
  trabalho_iniciado: (nomeServico) => ({
    titulo: 'Trabalho iniciado',
    mensagem: `O freelancer iniciou o trabalho em "${nomeServico}".`
  }),
  entrega_realizada: (nomeServico) => ({
    titulo: 'Entrega realizada!',
    mensagem: `O freelancer marcou "${nomeServico}" como entregue. Confira o serviço e confirme o recebimento.`
  }),
  contrato_cancelado: (nomeServico, quemCancelou) => ({
    titulo: 'Contrato cancelado',
    mensagem: `${quemCancelou} cancelou o contrato de "${nomeServico}".`
  }),
  avaliacao_recebida: (nomeCliente, nota) => ({
    titulo: 'Você recebeu uma avaliação!',
    mensagem: `${nomeCliente} avaliou seu serviço com nota ${nota}.`
  }),
  mensagem_nova: (nomeRemetente, nomeServico) => ({
    titulo: `Mensagem de ${nomeRemetente}`,
    mensagem: `Nova mensagem no contrato de "${nomeServico}".`
  })
};

/**
 * Cria uma notificação no banco de forma segura.
 * Nunca lança exceção — se falhar, apenas loga. Notificação é funcionalidade
 * auxiliar e nunca deve impedir a ação principal de completar.
 */

// função central pra criar notificação.
// assim os controllers não precisam montar título/mensagem toda hora.
async function criarNotificacao({
  destinatario,
  tipo,
  titulo,
  mensagem,
  referenciaId = null,
  tipoReferencia = null
}) {
  try {
    await Notificacao.create({
      destinatario,
      tipo,
      titulo,
      mensagem,
      referenciaId,
      tipoReferencia
    });
  } catch (err) {
    console.error('[notificacaoUtils] Falha ao criar notificação:', err.message);
  }
}

// helpers por evento — chamados nos controllers de contrato e avaliação.

async function notificarContratoNovo(freelancerId, contratoId, nomeServico, tipoContratacao) {
  const ehProposta = tipoContratacao !== 'fixo';
  const tipo = ehProposta ? 'proposta_nova' : 'contrato_novo';
  const template = ehProposta
    ? TEMPLATES.proposta_nova(nomeServico)
    : TEMPLATES.contrato_novo(nomeServico);
  await criarNotificacao({
    destinatario: freelancerId,
    tipo,
    ...template,
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarPropostaAceita(clienteId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: clienteId,
    tipo: 'proposta_aceita',
    ...TEMPLATES.proposta_aceita(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarPropostaRecusada(clienteId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: clienteId,
    tipo: 'proposta_recusada',
    ...TEMPLATES.proposta_recusada(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarTrabalhoIniciado(clienteId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: clienteId,
    tipo: 'trabalho_iniciado',
    ...TEMPLATES.trabalho_iniciado(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarEntregaRealizada(clienteId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: clienteId,
    tipo: 'entrega_realizada',
    ...TEMPLATES.entrega_realizada(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarContratoCancelado(destinatarioId, contratoId, nomeServico, quemCancelou) {
  await criarNotificacao({
    destinatario: destinatarioId,
    tipo: 'contrato_cancelado',
    ...TEMPLATES.contrato_cancelado(nomeServico, quemCancelou),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarAvaliacaoRecebida(freelancerId, avaliacaoId, nomeCliente, nota) {
  await criarNotificacao({
    destinatario: freelancerId,
    tipo: 'avaliacao_recebida',
    ...TEMPLATES.avaliacao_recebida(nomeCliente, nota),
    referenciaId: avaliacaoId,
    tipoReferencia: 'avaliacao'
  });
}

async function notificarMensagemNova(destinatarioId, mensagemId, nomeRemetente, nomeServico) {
  await criarNotificacao({
    destinatario: destinatarioId,
    tipo: 'mensagem_nova',
    ...TEMPLATES.mensagem_nova(nomeRemetente, nomeServico),
    referenciaId: mensagemId,
    tipoReferencia: 'mensagem'
  });
}

module.exports = {
  TEMPLATES,
  notificarContratoNovo,
  notificarPropostaAceita,
  notificarPropostaRecusada,
  notificarTrabalhoIniciado,
  notificarEntregaRealizada,
  notificarContratoCancelado,
  notificarAvaliacaoRecebida,
  notificarMensagemNova
};
