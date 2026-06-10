
const Contrato = require('../models/Contrato');
const Servico = require('../models/Servico');
const Avaliacao = require('../models/Avaliacao');
const { sucesso, erro } = require('../utils/apiResponse');
const { mapContrato } = require('../utils/mapeadoresResposta');
const {
  notificarContratoNovo,
  notificarPropostaAceita,
  notificarPropostaRecusada,
  notificarTrabalhoIniciado,
  notificarEntregaRealizada,
  notificarContratoCancelado
} = require('../utils/notificacaoUtils');

const STATUS_ATIVOS = ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento', 'concluido'];
const STATUS_FINAIS = ['cancelado', 'encerrado'];

function popularContrato(query) {
  const camposUsuario = 'nome fotoPerfil tipoConta areaAtuacao tituloProfissional bio localizacao site linkedin github instagram avaliacaoMedia totalAvaliacoes';
  return query
    .populate({
      path: 'servico',
      populate: [
        { path: 'categoria', select: 'legacyId nome slug' },
        { path: 'freelancer', select: camposUsuario }
      ]
    })
    .populate({ path: 'cliente', select: camposUsuario })
    .populate({ path: 'freelancer', select: camposUsuario });
}

function usuarioDoToken(req) {
  return req.user.id_usuario || req.user.idUsuario;
}

function normalizarValor(raw) {
  if (raw === '' || raw === undefined || raw === null) return null;
  const valor = Number(raw);
  return Number.isFinite(valor) ? valor : NaN;
}

function ehCliente(contrato, userId) {
  return String(contrato.cliente) === String(userId);
}

function ehFreelancer(contrato, userId) {
  return String(contrato.freelancer) === String(userId);
}

// busca nome do serviço para notificação: usa o dado já populado se disponível,
// senão faz uma query leve só com o campo nome.
async function obterNomeServico(contrato) {
  if (contrato?.servico?.nome) return contrato.servico.nome;
  const s = await Servico.findById(contrato.servico).select('nome');
  return s?.nome || 'Serviço';
}

// carrega o contrato e já confere se o usuário logado participa dele.
// isso evita repetir a mesma checagem em aceitar, cancelar, iniciar e entregar.
async function carregarContratoAutorizado(req, res) {
  const userId = usuarioDoToken(req);
  const contrato = await Contrato.findById(req.params.id);
  if (!contrato) {
    erro(res, 404, 'Contrato não encontrado.');
    return null;
  }

  if (!ehCliente(contrato, userId) && !ehFreelancer(contrato, userId)) {
    erro(res, 403, 'Sem permissão para alterar este contrato.');
    return null;
  }

  if (STATUS_FINAIS.includes(contrato.status)) {
    erro(res, 400, 'Este contrato não pode mais ser alterado.');
    return null;
  }

  return { contrato, userId };
}

// depois de mudar o status, sempre salvamos e devolvemos o contrato já populado pro front.
async function salvarERetornar(req, res, contrato, mensagem = 'Contrato atualizado.') {
  await contrato.save();
  const completo = await popularContrato(Contrato.findById(contrato._id));
  return sucesso(res, 200, mensagem, mapContrato(req, completo, usuarioDoToken(req)));
}

// cria uma contratação nova.
// aqui também nasce o fluxo de proposta quando o serviço é valor a combinar.
exports.criar = async (req, res) => {
  try {
    const { servicoId } = req.body;
    const mensagem = String(req.body.mensagem || '').trim();
    const detalhesPedido = String(req.body.detalhesPedido || req.body.detalhes_pedido || '').trim();
    const prazoDesejado = String(req.body.prazoDesejado || req.body.prazo_desejado || '').trim();
    const referencias = String(req.body.referencias || '').trim();
    const precoPropostoRaw = req.body.precoProposto ?? req.body.preco_proposto ?? req.body.valorProposto;
    const precoProposto = normalizarValor(precoPropostoRaw);

    if (!servicoId) return erro(res, 400, 'Serviço não informado.');
    const servico = await Servico.findById(servicoId).populate('freelancer');
    if (!servico) return erro(res, 404, 'Serviço não encontrado.');

    const userId = usuarioDoToken(req);
    if (String(servico.freelancer._id) === String(userId)) return erro(res, 400, 'Você não pode contratar o próprio serviço.');

    const tipoContratacao = servico.valorCombinar ? 'combinar' : 'fixo';

    if (tipoContratacao === 'combinar' && !mensagem) {
      return erro(res, 400, 'Envie uma mensagem para combinar o valor com o freelancer.');
    }

    if (tipoContratacao === 'fixo' && !detalhesPedido) {
      return erro(res, 400, 'Informe os detalhes do serviço antes de concluir a contratação.');
    }

    const existente = await Contrato.findOne({ cliente: userId, servico: servico._id, status: { $in: STATUS_ATIVOS } });
    if (existente) {
      return erro(res, 409, 'Você já possui uma contratação ativa para este serviço.');
    }

    const contrato = await Contrato.create({
      cliente: userId,
      freelancer: servico.freelancer._id,
      servico: servico._id,
      preco: tipoContratacao === 'fixo' ? servico.preco : (precoProposto || null),
      precoProposto: tipoContratacao === 'fixo' ? null : (precoProposto || null),
      mensagem,
      detalhesPedido,
      prazoDesejado,
      referencias,
      tipoContratacao,
      status: tipoContratacao === 'fixo' ? 'pendente' : 'proposta_pendente'
    });

    const completo = await popularContrato(Contrato.findById(contrato._id));
    // notifica o freelancer da nova contratação/proposta em background.
    notificarContratoNovo(servico.freelancer._id, contrato._id, servico.nome, tipoContratacao).catch(() => {});
    return sucesso(res, 201, tipoContratacao === 'fixo' ? 'Contratação criada com sucesso.' : 'Proposta enviada com sucesso.', mapContrato(req, completo, userId));
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao criar contratação.'); }
};

exports.meus = async (req, res) => {
  try {
    const userId = usuarioDoToken(req);
    const contratos = await popularContrato(Contrato.find({ $or: [{ cliente: userId }, { freelancer: userId }] }).sort({ createdAt: -1 })).lean();
    const avaliacoes = await Avaliacao.find({ autor: userId, contrato: { $in: contratos.map(c => c._id) } }).select('contrato').lean();

    const contratosAvaliados = new Set(avaliacoes.map(a => String(a.contrato)));
    return sucesso(res, 200, 'Contratos carregados com sucesso.', contratos.map(c => ({
      ...mapContrato(req, c, userId),
      jaAvaliado: contratosAvaliados.has(String(c._id)),
      ja_avaliado: contratosAvaliados.has(String(c._id))
    })));
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao buscar contratos.'); }
};

// ação do freelancer: aceita proposta ou inicia contrato fixo.
// contrato fixo já vai direto pra em andamento; proposta de valor a combinar passa por proposta_aceita.
exports.aceitar = async (req, res) => {
  try {
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;
    const { contrato, userId } = dados;
    if (!ehFreelancer(contrato, userId)) return erro(res, 403, 'Somente o freelancer pode aceitar a proposta.');
    if (!['proposta_pendente', 'pendente'].includes(contrato.status)) return erro(res, 400, 'Este contrato não está aguardando aceite.');
    contrato.status = contrato.tipoContratacao === 'fixo' ? 'em_andamento' : 'proposta_aceita';
    const nomeServico = await obterNomeServico(contrato);
    // fixo = freelancer aceitou e já vai iniciar; notifica como trabalho iniciado.
    // negociável = proposta aceita, mas ainda não iniciou.
    const notificarAceite = contrato.tipoContratacao === 'fixo' ? notificarTrabalhoIniciado : notificarPropostaAceita;
    notificarAceite(contrato.cliente, contrato._id, nomeServico).catch(() => {});
    return salvarERetornar(req, res, contrato, contrato.tipoContratacao === 'fixo' ? 'Contrato iniciado.' : 'Proposta aceita.');
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao aceitar contrato.'); }
};

exports.recusar = async (req, res) => {
  try {
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;
    const { contrato, userId } = dados;
    if (!ehFreelancer(contrato, userId)) return erro(res, 403, 'Somente o freelancer pode recusar a proposta.');
    if (!['proposta_pendente', 'pendente'].includes(contrato.status)) return erro(res, 400, 'Este contrato não pode ser recusado agora.');
    contrato.status = 'cancelado';
    const nomeServico = await obterNomeServico(contrato);
    notificarPropostaRecusada(contrato.cliente, contrato._id, nomeServico).catch(() => {});
    return salvarERetornar(req, res, contrato, 'Proposta recusada.');
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao recusar contrato.'); }
};

exports.iniciar = async (req, res) => {
  try {
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;
    const { contrato, userId } = dados;
    if (!ehFreelancer(contrato, userId)) return erro(res, 403, 'Somente o freelancer pode iniciar o trabalho.');
    if (!['pendente', 'proposta_aceita'].includes(contrato.status)) return erro(res, 400, 'Este contrato não pode ser iniciado agora.');
    contrato.status = 'em_andamento';
    const nomeServico = await obterNomeServico(contrato);
    notificarTrabalhoIniciado(contrato.cliente, contrato._id, nomeServico).catch(() => {});
    return salvarERetornar(req, res, contrato, 'Trabalho iniciado.');
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao iniciar contrato.'); }
};

exports.entregar = async (req, res) => {
  try {
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;
    const { contrato, userId } = dados;
    if (!ehFreelancer(contrato, userId)) return erro(res, 403, 'Somente o freelancer pode finalizar a entrega.');
    if (!['proposta_aceita', 'em_andamento'].includes(contrato.status)) return erro(res, 400, 'Este contrato não pode ser finalizado agora.');
    contrato.status = 'concluido';
    const nomeServico = await obterNomeServico(contrato);
    notificarEntregaRealizada(contrato.cliente, contrato._id, nomeServico).catch(() => {});
    return salvarERetornar(req, res, contrato, 'Entrega marcada como concluída.');
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao finalizar entrega.'); }
};

exports.cancelar = async (req, res) => {
  try {
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;
    const { contrato, userId } = dados;
    const clientePodeCancelar = ehCliente(contrato, userId) && ['pendente', 'proposta_pendente', 'proposta_aceita'].includes(contrato.status);
    const freelancerPodeCancelar = ehFreelancer(contrato, userId) && ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento'].includes(contrato.status);
    if (!clientePodeCancelar && !freelancerPodeCancelar) return erro(res, 403, 'Este contrato não pode ser cancelado por você neste momento.');
    contrato.status = 'cancelado';
    // notifica a outra parte do cancelamento.
    const nomeServico = await obterNomeServico(contrato);
    const ehCli = ehCliente(contrato, userId);
    const destinatario = ehCli ? contrato.freelancer : contrato.cliente;
    const quemCancelou = ehCli ? 'O contratante' : 'O freelancer';
    notificarContratoCancelado(destinatario, contrato._id, nomeServico, quemCancelou).catch(() => {});
    return salvarERetornar(req, res, contrato, 'Contrato cancelado.');
  } catch (error) { console.error(error); return erro(res, 500, 'Erro ao cancelar contrato.'); }
};

// compatibilidade com o front antigo: transforma patch /status em ações seguras sem recarregar o contrato duas vezes.

// compatibilidade com o front antigo.
// em vez de chamar outra rota por dentro, a regra fica aqui mesmo pra não buscar o contrato duas vezes.
exports.atualizarStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const dados = await carregarContratoAutorizado(req, res);
    if (!dados) return;

    const { contrato, userId } = dados;
    const nomeServico = await obterNomeServico(contrato);

    if (status === 'cancelado') {
      const clientePodeCancelar = ehCliente(contrato, userId) && ['pendente', 'proposta_pendente', 'proposta_aceita'].includes(contrato.status);
      const freelancerPodeCancelar = ehFreelancer(contrato, userId) && ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento'].includes(contrato.status);
      if (!clientePodeCancelar && !freelancerPodeCancelar) {
        return erro(res, 403, 'Este contrato não pode ser cancelado por você neste momento.');
      }
      contrato.status = 'cancelado';
      const ehCli = ehCliente(contrato, userId);
      const destinatario = ehCli ? contrato.freelancer : contrato.cliente;
      notificarContratoCancelado(destinatario, contrato._id, nomeServico, ehCli ? 'O contratante' : 'O freelancer').catch(() => {});
      return salvarERetornar(req, res, contrato, 'Contrato cancelado.');
    }

    if (ehCliente(contrato, userId) && ['em_andamento', 'proposta_aceita', 'concluido'].includes(status)) {
      return erro(res, 403, 'Somente o freelancer pode dar andamento ou finalizar a entrega.');
    }

    if (!ehFreelancer(contrato, userId)) {
      return erro(res, 403, 'Sem permissão para fazer esta ação.');
    }

    if (status === 'proposta_aceita') {
      if (contrato.status !== 'proposta_pendente') {
        return erro(res, 400, 'Apenas propostas pendentes podem ser aceitas.');
      }
      contrato.status = 'proposta_aceita';
      notificarPropostaAceita(contrato.cliente, contrato._id, nomeServico).catch(() => {});
      return salvarERetornar(req, res, contrato, 'Proposta aceita com sucesso.');
    }

    if (status === 'em_andamento') {
      if (contrato.status === 'proposta_pendente') {
        contrato.status = 'proposta_aceita';
        notificarPropostaAceita(contrato.cliente, contrato._id, nomeServico).catch(() => {});
        return salvarERetornar(req, res, contrato, 'Proposta aceita com sucesso.');
      }

      if (!['pendente', 'proposta_aceita'].includes(contrato.status)) {
        return erro(res, 400, 'Este contrato não pode ser iniciado neste momento.');
      }

      contrato.status = 'em_andamento';
      notificarTrabalhoIniciado(contrato.cliente, contrato._id, nomeServico).catch(() => {});
      return salvarERetornar(req, res, contrato, 'Contrato iniciado.');
    }

    if (status === 'concluido') {
      if (!['em_andamento', 'proposta_aceita'].includes(contrato.status)) {
        return erro(res, 400, 'Este contrato ainda não pode ser marcado como concluído.');
      }

      contrato.status = 'concluido';
      notificarEntregaRealizada(contrato.cliente, contrato._id, nomeServico).catch(() => {});
      return salvarERetornar(req, res, contrato, 'Entrega marcada como concluída.');
    }

    return erro(res, 400, 'Status inválido.');
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao atualizar contrato.');
  }
};
