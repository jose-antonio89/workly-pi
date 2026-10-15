const Contrato = require('../models/Contrato');
const Servico = require('../models/Servico');
const Avaliacao = require('../models/Avaliacao');
const { sucesso, erro } = require('../utils/apiResponse');
const { mapContrato } = require('../utils/mapeadoresResposta');
const { idMongoValido } = require('../utils/requisicaoUtils');
const { contaPodeContratar } = require('../services/contaService');
const {
  notificarContratoNovo,
  notificarPropostaAceita,
  notificarPropostaRecusada,
  notificarTrabalhoIniciado,
  notificarEntregaRealizada,
  notificarContratoCancelado
} = require('../utils/notificacaoUtils');

const { STATUS_ATIVOS } = Contrato;
const MENSAGEM_DUPLICADO = 'Você já possui uma contratação ativa para este serviço.';
const MENSAGEM_SERVICO_INDISPONIVEL = 'Este serviço não está mais disponível para contratação.';
const MENSAGEM_INDISPONIVEL =
  'Novos pedidos e propostas estão temporariamente indisponíveis. Tente novamente mais tarde.';
const STATUS_FINAIS = ['cancelado', 'concluido', 'encerrado'];

function popularContrato(query) {
  const camposUsuario =
    'nome fotoPerfil tipoConta areaAtuacao tituloProfissional bio localizacao site linkedin github instagram avaliacaoMedia totalAvaliacoes removido';
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
  if (!idMongoValido(req.params.id)) {
    erro(res, 400, 'Identificador de contrato inválido.');
    return null;
  }
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

// cria uma contratação nova.
// aqui também nasce o fluxo de proposta quando o serviço é valor a combinar.
exports.criar = async (req, res) => {
  try {
    // a consulta prévia abaixo não basta contra pedidos simultâneos: sem o índice único verificado, nada é criado.
    if (!(await Contrato.protecaoContratosDisponivel())) {
      return erro(res, 503, MENSAGEM_INDISPONIVEL);
    }
    const { servicoId } = req.body;
    const mensagem = String(req.body.mensagem || '').trim();
    const detalhesPedido = String(req.body.detalhesPedido || req.body.detalhes_pedido || '').trim();
    const prazoDesejado = String(req.body.prazoDesejado || req.body.prazo_desejado || '').trim();
    const referencias = String(req.body.referencias || '').trim();
    const precoPropostoRaw =
      req.body.precoProposto ?? req.body.preco_proposto ?? req.body.valorProposto;
    const precoProposto = normalizarValor(precoPropostoRaw);

    if (!servicoId) return erro(res, 400, 'Serviço não informado.');
    if (!idMongoValido(servicoId)) return erro(res, 400, 'Identificador de serviço inválido.');
    if (
      precoPropostoRaw !== undefined &&
      precoPropostoRaw !== null &&
      precoPropostoRaw !== '' &&
      (!Number.isFinite(precoProposto) || precoProposto <= 0)
    ) {
      return erro(res, 400, 'O valor proposto deve ser um número maior que zero.');
    }
    const servico = await Servico.findById(servicoId).populate('freelancer');
    if (!servico) return erro(res, 404, 'Serviço não encontrado.');
    // serviço retirado, ou de freelancer removido/inexistente, não aceita novos pedidos.
    if (servico.removido || !servico.freelancer || servico.freelancer.removido) {
      return erro(res, 409, MENSAGEM_SERVICO_INDISPONIVEL);
    }

    const userId = usuarioDoToken(req);
    if (String(servico.freelancer._id) === String(userId))
      return erro(res, 400, 'Você não pode contratar o próprio serviço.');

    const tipoContratacao = servico.valorCombinar ? 'combinar' : 'fixo';

    if (tipoContratacao === 'combinar' && !mensagem) {
      return erro(res, 400, 'Envie uma mensagem para combinar o valor com o freelancer.');
    }

    if (tipoContratacao === 'fixo' && !detalhesPedido) {
      return erro(res, 400, 'Informe os detalhes do serviço antes de concluir a contratação.');
    }

    const existente = await Contrato.findOne({
      cliente: userId,
      servico: servico._id,
      status: { $in: STATUS_ATIVOS }
    });
    if (existente) {
      return erro(res, 409, MENSAGEM_DUPLICADO);
    }

    const partes = [userId, servico.freelancer._id];
    if (!(await Promise.all(partes.map(contaPodeContratar))).every(Boolean)) {
      return erro(res, 409, MENSAGEM_SERVICO_INDISPONIVEL);
    }

    const contrato = await Contrato.create({
      cliente: userId,
      freelancer: servico.freelancer._id,
      servico: servico._id,
      preco: tipoContratacao === 'fixo' ? servico.preco : precoProposto || null,
      precoProposto: tipoContratacao === 'fixo' ? null : precoProposto || null,
      mensagem,
      detalhesPedido,
      prazoDesejado,
      referencias,
      tipoContratacao,
      status: tipoContratacao === 'fixo' ? 'pendente' : 'proposta_pendente'
    });

    // a exclusão de conta marca o usuário antes de procurar contratos ativos. Conferir de novo depois
    // de gravar fecha a corrida: se uma das partes entrou em exclusão, este pedido recém-criado é desfeito.
    if (!(await Promise.all(partes.map(contaPodeContratar))).every(Boolean)) {
      await Contrato.deleteOne({ _id: contrato._id });
      return erro(res, 409, MENSAGEM_SERVICO_INDISPONIVEL);
    }

    // a notificação só sai depois que o contrato existe; uma falha nela não desfaz o pedido.
    await notificarDepois(() =>
      notificarContratoNovo(servico.freelancer._id, contrato._id, servico.nome, tipoContratacao)
    );
    const completo = await popularContrato(Contrato.findById(contrato._id));
    return sucesso(
      res,
      201,
      tipoContratacao === 'fixo'
        ? 'Contratação criada com sucesso.'
        : 'Proposta enviada com sucesso.',
      mapContrato(req, completo, userId)
    );
  } catch (error) {
    // pedidos simultâneos: o índice único parcial deixa passar só o primeiro.
    if (error?.code === 11000) return erro(res, 409, MENSAGEM_DUPLICADO);
    console.error(error);
    return erro(res, 500, 'Erro ao criar contratação.');
  }
};

exports.meus = async (req, res) => {
  try {
    const userId = usuarioDoToken(req);
    const contratos = await popularContrato(
      Contrato.find({ $or: [{ cliente: userId }, { freelancer: userId }] }).sort({ createdAt: -1 })
    ).lean();
    const avaliacoes = await Avaliacao.find({
      autor: userId,
      contrato: { $in: contratos.map((c) => c._id) }
    })
      .select('contrato')
      .lean();

    const contratosAvaliados = new Set(avaliacoes.map((a) => String(a.contrato)));
    return sucesso(
      res,
      200,
      'Contratos carregados com sucesso.',
      contratos.map((c) => ({
        ...mapContrato(req, c, userId),
        jaAvaliado: contratosAvaliados.has(String(c._id)),
        ja_avaliado: contratosAvaliados.has(String(c._id))
      }))
    );
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao buscar contratos.');
  }
};

// mensagem única para quando outra requisição mudou o contrato entre a leitura e a gravação.
const MENSAGEM_CONFLITO =
  'Este contrato acabou de ser atualizado por outra ação. Atualize a página para ver a situação atual.';

const PODE_CANCELAR = {
  cliente: ['pendente', 'proposta_pendente', 'proposta_aceita'],
  freelancer: ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento']
};

// notificações só depois da gravação. Se falharem, a transição continua válida e só registramos a falha,
// para o cliente da API não repetir uma ação que já foi aplicada.
async function notificarDepois(enviar) {
  try {
    await enviar();
  } catch (error) {
    console.error('Falha ao notificar transição de contrato:', error?.message || error);
  }
}

// aplica uma transição de forma atômica: só grava se o contrato ainda estiver no status lido
// e o usuário continuar no papel exigido. Assim duas ações concorrentes nunca se sobrescrevem.
// definicao: { papel(contrato, userId) -> 'cliente' | 'freelancer' | null, erroPapel,
//   de(papel) -> status permitidos, erroStatus, codigoErroStatus, para(contrato), extra(contrato),
//   mensagem(contrato), notificar(contrato, userId, nomeServico) }
async function executarTransicao(req, res, definicao) {
  const dados = await carregarContratoAutorizado(req, res);
  if (!dados) return;
  const { contrato, userId } = dados;

  const papel = definicao.papel(contrato, userId);
  if (!papel) return erro(res, 403, definicao.erroPapel);
  if (!definicao.de(papel).includes(contrato.status)) {
    return erro(res, definicao.codigoErroStatus || 400, definicao.erroStatus);
  }

  const statusAnterior = contrato.status;
  const atualizado = await Contrato.findOneAndUpdate(
    { _id: contrato._id, status: statusAnterior, [papel]: userId },
    { $set: { status: definicao.para(contrato), ...(definicao.extra ? definicao.extra(contrato) : {}) } },
    { new: true }
  );
  if (!atualizado) return erro(res, 409, MENSAGEM_CONFLITO);

  if (definicao.notificar) {
    const nomeServico = await obterNomeServico(atualizado).catch(() => 'Serviço');
    await notificarDepois(() => definicao.notificar(atualizado, userId, nomeServico));
  }

  const completo = await popularContrato(Contrato.findById(atualizado._id));
  return sucesso(
    res,
    200,
    definicao.mensagem(contrato),
    mapContrato(req, completo || atualizado, userId)
  );
}

const somenteFreelancer = (erroPapel) => ({
  papel: (contrato, userId) => (ehFreelancer(contrato, userId) ? 'freelancer' : null),
  erroPapel
});

const TRANSICOES = {
  // freelancer aceita: contrato fixo já entra em andamento; proposta de valor a combinar vira proposta_aceita.
  aceitar: {
    ...somenteFreelancer('Somente o freelancer pode aceitar a proposta.'),
    de: () => ['proposta_pendente', 'pendente'],
    erroStatus: 'Este contrato não está aguardando início.',
    para: (contrato) => (contrato.tipoContratacao === 'fixo' ? 'em_andamento' : 'proposta_aceita'),
    mensagem: (contrato) =>
      contrato.tipoContratacao === 'fixo' ? 'Contrato iniciado.' : 'Proposta aceita.',
    notificar: (contrato, _userId, nomeServico) =>
      (contrato.tipoContratacao === 'fixo' ? notificarTrabalhoIniciado : notificarPropostaAceita)(
        contrato.cliente,
        contrato._id,
        nomeServico
      )
  },
  recusar: {
    ...somenteFreelancer('Somente o freelancer pode recusar a proposta.'),
    de: () => ['proposta_pendente', 'pendente'],
    erroStatus: 'Este contrato não pode ser recusado agora.',
    para: () => 'cancelado',
    mensagem: () => 'Proposta recusada.',
    notificar: (contrato, _userId, nomeServico) =>
      notificarPropostaRecusada(contrato.cliente, contrato._id, nomeServico)
  },
  iniciar: {
    ...somenteFreelancer('Somente o freelancer pode iniciar o trabalho.'),
    de: () => ['pendente', 'proposta_aceita'],
    erroStatus: 'Este contrato não pode ser iniciado agora.',
    para: () => 'em_andamento',
    mensagem: () => 'Trabalho iniciado.',
    notificar: (contrato, _userId, nomeServico) =>
      notificarTrabalhoIniciado(contrato.cliente, contrato._id, nomeServico)
  },
  // o freelancer entrega; só o cliente confirma o recebimento.
  entregar: {
    ...somenteFreelancer('Somente o freelancer pode finalizar a entrega.'),
    de: () => ['proposta_aceita', 'em_andamento'],
    erroStatus: 'Este contrato não pode ser finalizado agora.',
    para: () => 'entregue',
    mensagem: () => 'Entrega enviada. Aguardando confirmação do cliente.',
    notificar: (contrato, _userId, nomeServico) =>
      notificarEntregaRealizada(contrato.cliente, contrato._id, nomeServico)
  },
  confirmar: {
    papel: (contrato, userId) => (ehCliente(contrato, userId) ? 'cliente' : null),
    erroPapel: 'Somente o cliente pode confirmar a entrega.',
    de: () => ['entregue'],
    erroStatus: 'Este contrato não possui uma entrega aguardando confirmação.',
    para: () => 'concluido',
    mensagem: () => 'Entrega confirmada. Contrato concluído.'
  },
  cancelar: {
    papel: (contrato, userId) =>
      ehCliente(contrato, userId) ? 'cliente' : ehFreelancer(contrato, userId) ? 'freelancer' : null,
    erroPapel: 'Este contrato não pode ser cancelado por você neste momento.',
    de: (papel) => PODE_CANCELAR[papel],
    erroStatus: 'Este contrato não pode ser cancelado por você neste momento.',
    codigoErroStatus: 403,
    para: () => 'cancelado',
    mensagem: () => 'Contrato cancelado.',
    notificar: (contrato, userId, nomeServico) => {
      const canceladoPeloCliente = ehCliente(contrato, userId);
      return notificarContratoCancelado(
        canceladoPeloCliente ? contrato.freelancer : contrato.cliente,
        contrato._id,
        nomeServico,
        canceladoPeloCliente ? 'O contratante' : 'O freelancer'
      );
    }
  }
};

function rotaDeTransicao(nome, mensagemErro) {
  return async (req, res) => {
    try {
      return await executarTransicao(req, res, TRANSICOES[nome]);
    } catch (error) {
      console.error(error);
      return erro(res, 500, mensagemErro);
    }
  };
}

exports.aceitar = rotaDeTransicao('aceitar', 'Erro ao aceitar contrato.');
exports.recusar = rotaDeTransicao('recusar', 'Erro ao recusar contrato.');
exports.iniciar = rotaDeTransicao('iniciar', 'Erro ao iniciar contrato.');
exports.entregar = rotaDeTransicao('entregar', 'Erro ao finalizar entrega.');
exports.confirmarEntrega = rotaDeTransicao('confirmar', 'Erro ao confirmar entrega.');
exports.cancelar = rotaDeTransicao('cancelar', 'Erro ao cancelar contrato.');

// compatibilidade com o front antigo: PATCH /status vira uma das transições acima,
// com as mesmas permissões, mensagens e a mesma gravação atômica.
const ACEITAR_PROPOSTA_ANTIGA = {
  ...somenteFreelancer('Sem permissão para fazer esta ação.'),
  de: () => ['proposta_pendente'],
  erroStatus: 'Apenas propostas pendentes podem ser aceitas.',
  para: () => 'proposta_aceita',
  mensagem: () => 'Proposta aceita com sucesso.',
  notificar: (contrato, _userId, nomeServico) =>
    notificarPropostaAceita(contrato.cliente, contrato._id, nomeServico)
};
const INICIAR_ANTIGO = {
  ...somenteFreelancer('Sem permissão para fazer esta ação.'),
  de: () => ['pendente', 'proposta_aceita'],
  erroStatus: 'Este contrato não pode ser iniciado neste momento.',
  para: () => 'em_andamento',
  mensagem: () => 'Contrato iniciado.',
  notificar: TRANSICOES.iniciar.notificar
};

exports.atualizarStatus = async (req, res) => {
  try {
    const status = typeof req.body?.status === 'string' ? req.body.status : '';
    if (status === 'cancelado') return await executarTransicao(req, res, TRANSICOES.cancelar);
    if (status === 'concluido') return await executarTransicao(req, res, TRANSICOES.confirmar);
    if (status === 'proposta_aceita') return await executarTransicao(req, res, ACEITAR_PROPOSTA_ANTIGA);
    if (status === 'em_andamento') {
      return await executarTransicao(req, res, {
        ...INICIAR_ANTIGO,
        // no fluxo antigo, "em andamento" sobre proposta pendente significa aceitar a proposta.
        de: () => ['pendente', 'proposta_aceita', 'proposta_pendente'],
        para: (contrato) => (contrato.status === 'proposta_pendente' ? 'proposta_aceita' : 'em_andamento'),
        mensagem: (contrato) =>
          contrato.status === 'proposta_pendente' ? 'Proposta aceita com sucesso.' : 'Contrato iniciado.',
        notificar: (contrato, userId, nomeServico) =>
          (contrato.status === 'proposta_aceita' ? ACEITAR_PROPOSTA_ANTIGA : INICIAR_ANTIGO).notificar(
            contrato,
            userId,
            nomeServico
          )
      });
    }
    return erro(res, 400, 'Status inválido.');
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao atualizar contrato.');
  }
};
