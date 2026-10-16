const Notificacao = require('../models/Notificacao');
const Usuario = require('../models/Usuario');

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
  proposta_valor: (nomeServico, ehContraproposta) => ({
    titulo: ehContraproposta ? 'Contraproposta recebida' : 'Nova proposta de valor',
    mensagem: ehContraproposta
      ? `O freelancer enviou uma contraproposta para "${nomeServico}". Aprove ou responda em seus contratos.`
      : `O cliente enviou uma proposta de valor para "${nomeServico}". Acesse seus contratos para responder.`
  }),
  valor_aprovado: (nomeServico) => ({
    titulo: 'Valor aprovado',
    mensagem: `O cliente aprovou o valor de "${nomeServico}". O acordo está fechado.`
  }),
  entrega_confirmada: (nomeServico) => ({
    titulo: 'Entrega confirmada',
    mensagem: `O cliente confirmou o recebimento de "${nomeServico}". O contrato foi concluído.`
  }),
  ajuste_solicitado: (nomeServico) => ({
    titulo: 'Ajuste solicitado',
    mensagem: `O cliente pediu ajustes na entrega de "${nomeServico}". Veja a justificativa em seus contratos.`
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

// REGRA DE PREFERÊNCIAS (único lugar onde ela é definida):
// - tipos essenciais são sempre enviados, mesmo com preferências desligadas. São os avisos de transação do
//   contrato (aceite, acordo de valor, início, entrega, confirmação, ajuste, recusa, cancelamento) e a avaliação
//   recebida: quem participa de um contrato precisa saber quando ele muda. Segurança e conta entram nesta lista
//   quando ganharem notificações próprias.
// - os demais tipos só são enviados se a preferência correspondente do destinatário estiver ligada.
//   Hoje só "notificacoesPropostas" (Novas propostas e mensagens) tem correspondência clara.
// - "notificacoesEmail" e "notificacoesMarketing" não controlam nada: não há envio de e-mail nem marketing.
// Todo tipo aceito pelo model Notificacao precisa estar em exatamente uma das duas listas (verificado em teste).
const TIPOS_ESSENCIAIS = Object.freeze([
  'proposta_aceita',
  'proposta_recusada',
  'proposta_valor',
  'valor_aprovado',
  'trabalho_iniciado',
  'entrega_realizada',
  'entrega_confirmada',
  'ajuste_solicitado',
  'contrato_cancelado',
  'avaliacao_recebida'
]);
const PREFERENCIA_POR_TIPO = Object.freeze({
  contrato_novo: 'notificacoesPropostas',
  proposta_nova: 'notificacoesPropostas',
  mensagem_nova: 'notificacoesPropostas'
});

// confere a preferência no momento do envio; preferência ausente vale como ligada (padrão do model).
async function destinatarioAceita(destinatario, tipo) {
  if (TIPOS_ESSENCIAIS.includes(tipo)) return true;
  const preferencia = PREFERENCIA_POR_TIPO[tipo];
  if (!preferencia) return true;
  const usuario = await Usuario.findById(destinatario).select(preferencia).lean();
  return Boolean(usuario) && usuario[preferencia] !== false;
}

/**
 * Cria uma notificação no banco de forma segura.
 * Nunca lança exceção — se falhar, apenas loga. Notificação é funcionalidade
 * auxiliar e nunca deve impedir a ação principal de completar.
 * Os controllers só chamam isto depois de gravar a ação que gerou o aviso.
 * Devolve a notificação criada, ou null se foi suprimida pela preferência ou falhou.
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
    if (!(await destinatarioAceita(destinatario, tipo))) return null;
    return await Notificacao.create({
      destinatario,
      tipo,
      titulo,
      mensagem,
      referenciaId,
      tipoReferencia
    });
  } catch (err) {
    console.error('[notificacaoUtils] Falha ao criar notificação:', err.message);
    return null;
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

async function notificarPropostaValor(destinatarioId, contratoId, nomeServico, ehContraproposta) {
  await criarNotificacao({
    destinatario: destinatarioId,
    tipo: 'proposta_valor',
    ...TEMPLATES.proposta_valor(nomeServico, ehContraproposta),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarValorAprovado(freelancerId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: freelancerId,
    tipo: 'valor_aprovado',
    ...TEMPLATES.valor_aprovado(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarEntregaConfirmada(freelancerId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: freelancerId,
    tipo: 'entrega_confirmada',
    ...TEMPLATES.entrega_confirmada(nomeServico),
    referenciaId: contratoId,
    tipoReferencia: 'contrato'
  });
}

async function notificarAjusteSolicitado(freelancerId, contratoId, nomeServico) {
  await criarNotificacao({
    destinatario: freelancerId,
    tipo: 'ajuste_solicitado',
    ...TEMPLATES.ajuste_solicitado(nomeServico),
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
  TIPOS_ESSENCIAIS,
  PREFERENCIA_POR_TIPO,
  destinatarioAceita,
  criarNotificacao,
  notificarContratoNovo,
  notificarPropostaAceita,
  notificarPropostaRecusada,
  notificarTrabalhoIniciado,
  notificarEntregaRealizada,
  notificarContratoCancelado,
  notificarPropostaValor,
  notificarValorAprovado,
  notificarEntregaConfirmada,
  notificarAjusteSolicitado,
  notificarAvaliacaoRecebida,
  notificarMensagemNova
};
