const Usuario = require('../models/Usuario');
const Servico = require('../models/Servico');
const Contrato = require('../models/Contrato');
const Mensagem = require('../models/Mensagem');
const Avaliacao = require('../models/Avaliacao');
const Favorito = require('../models/Favorito');
const Categoria = require('../models/Categoria');
const Notificacao = require('../models/Notificacao');
const { sucesso, erro } = require('../utils/apiResponse');

function arredondar(valor = 0, casas = 2) {
  const numero = Number(valor || 0);
  if (!Number.isFinite(numero)) return 0;
  return Number(numero.toFixed(casas));
}

// Rota de demonstração da parte de MongoDB do PI.
// A ideia é mostrar no navegador/Postman que o sistema usa Aggregation Pipeline de verdade.
exports.resumoMongo = async (_req, res) => {
  try {
    const [
      totaisBase,
      usuariosPorTipo,
      servicosPorCategoria,
      contratosPorStatus,
      contratosPorMes,
      mediaAvaliacoes,
      rankingFreelancers,
      servicosMaisContratados,
      mensagensPorContrato,
      favoritosPorCategoria
    ] = await Promise.all([
      Promise.all([
        Usuario.countDocuments(),
        Servico.countDocuments(),
        Contrato.countDocuments(),
        Mensagem.countDocuments(),
        Avaliacao.countDocuments(),
        Favorito.countDocuments(),
        Categoria.countDocuments(),
        Notificacao.countDocuments()
      ]),

      Usuario.aggregate([
        { $group: { _id: '$tipoConta', total: { $sum: 1 } } },
        { $project: { _id: 0, tipoConta: '$_id', total: 1 } },
        { $sort: { total: -1 } }
      ]),

      Servico.aggregate([
        {
          $lookup: {
            from: 'categorias',
            localField: 'categoria',
            foreignField: '_id',
            as: 'categoria'
          }
        },
        { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$categoria.nome', 'Sem categoria'] },
            total: { $sum: 1 },
            precoMedio: { $avg: '$preco' },
            valorCombinar: { $sum: { $cond: ['$valorCombinar', 1, 0] } }
          }
        },
        {
          $project: {
            _id: 0,
            categoria: '$_id',
            total: 1,
            precoMedio: { $round: ['$precoMedio', 2] },
            valorCombinar: 1
          }
        },
        { $sort: { total: -1 } }
      ]),

      Contrato.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: 1 },
            valorTotal: { $sum: { $ifNull: ['$precoProposto', { $ifNull: ['$preco', 0] }] } }
          }
        },
        {
          $project: { _id: 0, status: '$_id', total: 1, valorTotal: { $round: ['$valorTotal', 2] } }
        },
        { $sort: { total: -1 } }
      ]),

      Contrato.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            totalContratos: { $sum: 1 },
            valorEstimado: { $sum: { $ifNull: ['$precoProposto', { $ifNull: ['$preco', 0] }] } }
          }
        },
        {
          $project: {
            _id: 0,
            mes: '$_id',
            totalContratos: 1,
            valorEstimado: { $round: ['$valorEstimado', 2] }
          }
        },
        { $sort: { mes: 1 } }
      ]),

      Avaliacao.aggregate([
        {
          $group: {
            _id: null,
            totalAvaliacoes: { $sum: 1 },
            mediaServico: { $avg: '$notaServico' },
            mediaFreelancer: { $avg: '$notaFreelancer' }
          }
        },
        {
          $project: {
            _id: 0,
            totalAvaliacoes: 1,
            mediaServico: { $round: ['$mediaServico', 2] },
            mediaFreelancer: { $round: ['$mediaFreelancer', 2] }
          }
        }
      ]),

      Avaliacao.aggregate([
        {
          $group: {
            _id: '$freelancer',
            totalAvaliacoes: { $sum: 1 },
            mediaFreelancer: { $avg: '$notaFreelancer' }
          }
        },
        { $sort: { mediaFreelancer: -1, totalAvaliacoes: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'freelancer' } },
        { $unwind: '$freelancer' },
        {
          $project: {
            _id: 0,
            freelancerId: '$_id',
            nome: '$freelancer.nome',
            totalAvaliacoes: 1,
            mediaFreelancer: { $round: ['$mediaFreelancer', 2] }
          }
        }
      ]),

      Contrato.aggregate([
        {
          $group: {
            _id: '$servico',
            totalContratos: { $sum: 1 },
            valorTotal: { $sum: { $ifNull: ['$precoProposto', { $ifNull: ['$preco', 0] }] } }
          }
        },
        { $sort: { totalContratos: -1, valorTotal: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'servicos', localField: '_id', foreignField: '_id', as: 'servico' } },
        { $unwind: '$servico' },
        {
          $project: {
            _id: 0,
            servicoId: '$_id',
            nome: '$servico.nome',
            totalContratos: 1,
            valorTotal: { $round: ['$valorTotal', 2] }
          }
        }
      ]),

      Mensagem.aggregate([
        {
          $group: {
            _id: '$contrato',
            totalMensagens: { $sum: 1 },
            naoLidas: { $sum: { $cond: ['$lida', 0, 1] } }
          }
        },
        { $sort: { totalMensagens: -1 } },
        { $limit: 8 },
        { $lookup: { from: 'contratos', localField: '_id', foreignField: '_id', as: 'contrato' } },
        { $unwind: '$contrato' },
        {
          $lookup: {
            from: 'servicos',
            localField: 'contrato.servico',
            foreignField: '_id',
            as: 'servico'
          }
        },
        { $unwind: { path: '$servico', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            contratoId: '$_id',
            servico: { $ifNull: ['$servico.nome', 'Serviço removido'] },
            totalMensagens: 1,
            naoLidas: 1
          }
        }
      ]),

      Favorito.aggregate([
        {
          $lookup: { from: 'servicos', localField: 'servico', foreignField: '_id', as: 'servico' }
        },
        { $unwind: '$servico' },
        {
          $lookup: {
            from: 'categorias',
            localField: 'servico.categoria',
            foreignField: '_id',
            as: 'categoria'
          }
        },
        { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$categoria.nome', 'Sem categoria'] },
            totalFavoritos: { $sum: 1 }
          }
        },
        { $project: { _id: 0, categoria: '$_id', totalFavoritos: 1 } },
        { $sort: { totalFavoritos: -1 } }
      ])
    ]);

    const [
      usuarios,
      servicos,
      contratos,
      mensagens,
      avaliacoes,
      favoritos,
      categorias,
      notificacoes
    ] = totaisBase;

    return sucesso(res, 200, 'Resumo MongoDB carregado com aggregations.', {
      totais: {
        usuarios,
        servicos,
        contratos,
        mensagens,
        avaliacoes,
        favoritos,
        categorias,
        notificacoes
      },
      usuariosPorTipo,
      servicosPorCategoria,
      contratosPorStatus,
      contratosPorMes,
      mediaAvaliacoes: mediaAvaliacoes[0] || {
        totalAvaliacoes: 0,
        mediaServico: 0,
        mediaFreelancer: 0
      },
      rankingFreelancers,
      servicosMaisContratados,
      mensagensPorContrato,
      favoritosPorCategoria,
      observacao:
        'Dados gerados com Aggregation Pipeline do MongoDB: $lookup, $group, $sort, $project, $dateToString e $limit.',
      indicesRelevantes: [
        'usuarios: email único, cpf único, tipoConta/localizacao',
        'servicos: categoria/createdAt, freelancer/createdAt, preco/createdAt e índice textual em nome/descricao/extra',
        'contratos: cliente/servico/status, freelancer/status/createdAt, cliente/createdAt',
        'mensagens: contrato/createdAt, contrato/remetente/lida',
        'avaliacoes: autor/contrato único, servico, freelancer/createdAt',
        'favoritos: usuario/servico único',
        'notificacoes: destinatario/lida/createdAt'
      ]
    });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao gerar resumo MongoDB.');
  }
};
