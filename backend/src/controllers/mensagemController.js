
const mongoose = require('mongoose');
const Mensagem = require('../models/Mensagem');
const Contrato = require('../models/Contrato');
const Notificacao = require('../models/Notificacao');
const { sucesso, erro } = require('../utils/apiResponse');
const { notificarMensagemNova } = require('../utils/notificacaoUtils');

function usuarioId(req) {
  return req.user.id_usuario || req.user.idUsuario;
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

// verifica se o usuário é parte do contrato e retorna os ids das duas partes.
// só deixa ler/enviar mensagem se o usuário fizer parte do contrato.
// sem isso qualquer pessoa poderia tentar abrir conversa pelo id.
async function carregarContratoDoUsuario(contratoId, userId) {
  const contrato = await Contrato.findById(contratoId)
    .select('servico cliente freelancer')
    .populate('servico', 'nome')
    .populate('cliente', 'nome')
    .populate('freelancer', 'nome')
    .lean();

  if (!contrato) return null;

  const ehCliente = String(contrato.cliente._id) === String(userId);
  const ehFreelancer = String(contrato.freelancer._id) === String(userId);

  if (!ehCliente && !ehFreelancer) return null;

  return contrato;
}

// envia uma mensagem no chat de um contrato.
// apenas as duas partes do contrato podem escrever — contratos finalizados aceitam mensagens também,
// pois as partes podem precisar trocar informações mesmo após a conclusão.
// envia uma mensagem dentro de um contrato e avisa a outra pessoa com notificação.
exports.enviar = async (req, res) => {
  try {
    const userId = usuarioId(req);
    const contratoId = req.body.contratoId || req.body.contrato_id;
    const texto = String(req.body.texto || '').trim();

    if (!contratoId) return erro(res, 400, 'Informe o contrato.');
    if (!texto) return erro(res, 400, 'A mensagem não pode estar vazia.');
    if (texto.length > 2000) return erro(res, 400, 'Mensagem muito longa (máximo 2000 caracteres).');

    const contrato = await carregarContratoDoUsuario(contratoId, userId);
    if (!contrato) return erro(res, 403, 'Você não faz parte deste contrato ou ele não existe.');

    const mensagem = await Mensagem.create({
      contrato: contratoId,
      remetente: userId,
      texto
    });

    // notifica a outra parte do contrato.
    const ehRemetenteCliente = String(contrato.cliente._id) === String(userId);
    const destinatario = ehRemetenteCliente ? contrato.freelancer._id : contrato.cliente._id;
    const nomeRemetente = ehRemetenteCliente ? contrato.cliente.nome : contrato.freelancer.nome;
    const nomeServico = contrato.servico?.nome || 'Serviço';

    await notificarMensagemNova(destinatario, mensagem._id, nomeRemetente, nomeServico);

    const mensagemPopulada = await Mensagem.findById(mensagem._id).populate('remetente', 'nome fotoPerfil tipoConta');

    return sucesso(res, 201, 'Mensagem enviada.', mapMensagem(req, mensagemPopulada));
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao enviar mensagem.');
  }
};

// retorna resumo de mensagens por contrato sem marcar como lidas.
// usado pela central de mensagens para mostrar preview e badge por conversa.
// usado pela lista lateral da central de mensagens.
// importante: essa rota não marca nada como lido, só monta preview e contador.
exports.resumoPorContrato = async (req, res) => {
  try {
    const userId = usuarioId(req);

    const contratos = await Contrato.find({
      $or: [{ cliente: userId }, { freelancer: userId }]
    }).select('_id').lean();

    const contratoIds = contratos.map(c => c._id);
    if (!contratoIds.length) {
      return sucesso(res, 200, 'Resumo carregado.', []);
    }

    const userObjectId = toObjectId(userId);

    // Antes esta rota carregava TODAS as mensagens de todos os contratos.
    // Agora o MongoDB devolve só a última mensagem e a contagem de não lidas por contrato.
    const [ultimas, naoLidas] = await Promise.all([
      Mensagem.aggregate([
        { $match: { contrato: { $in: contratoIds } } },
        { $sort: { contrato: 1, createdAt: -1 } },
        { $group: { _id: '$contrato', ultimaMensagem: { $first: '$$ROOT' } } },
        { $sort: { 'ultimaMensagem.createdAt': -1 } }
      ]),
      Mensagem.aggregate([
        { $match: { contrato: { $in: contratoIds }, remetente: { $ne: userObjectId }, lida: false } },
        { $group: { _id: '$contrato', naoLidas: { $sum: 1 } } }
      ])
    ]);

    const naoLidasPorContrato = new Map(naoLidas.map(item => [String(item._id), item.naoLidas]));
    const mensagens = ultimas.map(item => item.ultimaMensagem);
    await Mensagem.populate(mensagens, { path: 'remetente', select: 'nome fotoPerfil tipoConta' });

    const resumo = mensagens.map((mensagem) => ({
      contratoId: String(mensagem.contrato),
      ultimaMensagem: mapMensagem(req, mensagem),
      naoLidas: naoLidasPorContrato.get(String(mensagem.contrato)) || 0
    }));

    return sucesso(res, 200, 'Resumo carregado.', resumo);
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao carregar resumo das mensagens.');
  }
};

// lista todas as mensagens de um contrato em ordem cronológica.
// ao listar, marca automaticamente as mensagens do outro usuário como lidas.
// quando abre a conversa de verdade, aí sim as mensagens do outro usuário viram lidas.
exports.listarPorContrato = async (req, res) => {
  try {
    const userId = usuarioId(req);
    const { contratoId } = req.params;

    const contrato = await carregarContratoDoUsuario(contratoId, userId);
    if (!contrato) return erro(res, 403, 'Você não faz parte deste contrato ou ele não existe.');

    // marca como lidas as mensagens enviadas pelo outro usuário neste contrato.
    // Depois limpa as notificações dessas mensagens para o sino não ficar preso.
    const mensagensPendentes = await Mensagem.find({
      contrato: contratoId,
      remetente: { $ne: userId },
      lida: false
    }).select('_id').lean();

    const mensagemIds = mensagensPendentes.map(item => item._id);

    await Promise.all([
      Mensagem.updateMany(
        { contrato: contratoId, remetente: { $ne: userId }, lida: false },
        { lida: true }
      ),
      mensagemIds.length
        ? Notificacao.updateMany(
            { destinatario: userId, tipo: 'mensagem_nova', referenciaId: { $in: mensagemIds }, lida: false },
            { lida: true }
          )
        : Promise.resolve()
    ]);

    const mensagens = await Mensagem.find({ contrato: contratoId })
      .populate('remetente', 'nome fotoPerfil tipoConta')
      .sort({ createdAt: 1 })
      .lean();

    return sucesso(res, 200, 'Mensagens carregadas.', mensagens.map(m => mapMensagem(req, m)));
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao buscar mensagens.');
  }
};

// conta mensagens não lidas do usuário logado em todos os contratos.
// útil para o badge geral de chat no header.
// contador geral usado no sininho do topo.
exports.contarNaoLidas = async (req, res) => {
  try {
    const userId = usuarioId(req);

    // busca contratos nos quais o usuário participa.
    const contratos = await Contrato.find({
      $or: [{ cliente: userId }, { freelancer: userId }]
    }).select('_id').lean();

    const contratoIds = contratos.map(c => c._id);

    const total = await Mensagem.countDocuments({
      contrato: { $in: contratoIds },
      remetente: { $ne: userId },
      lida: false
    });

    return sucesso(res, 200, 'Contagem carregada.', { naoLidas: total });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao contar mensagens.');
  }
};

function mapMensagem(req, mensagem) {
  const remetente = mensagem.remetente || {};
  const host = `${req.protocol}://${req.get('host')}`;
  const fotoPerfil = remetente.fotoPerfil
    ? (remetente.fotoPerfil.startsWith('http') ? remetente.fotoPerfil : `${host}${remetente.fotoPerfil}`)
    : `${host}/uploads/perfis/perfil_padrao.svg`;

  return {
    idMensagem: mensagem._id.toString(),
    id_mensagem: mensagem._id.toString(),
    contratoId: mensagem.contrato?.toString() || '',
    remetente: {
      idUsuario: remetente._id?.toString() || '',
      nome: remetente.nome || '',
      fotoPerfil,
      tipoConta: remetente.tipoConta || ''
    },
    texto: mensagem.texto,
    lida: mensagem.lida,
    createdAt: mensagem.createdAt,
    created_at: mensagem.createdAt
  };
}
