const Categoria = require('../models/Categoria');
const Servico = require('../models/Servico');
const Avaliacao = require('../models/Avaliacao');
const Usuario = require('../models/Usuario');
const Contrato = require('../models/Contrato');

function escaparRegex(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function obterPaginacao(query = {}) {
  const pagina = Math.max(Number(query.page || query.pagina || 1), 1);
  const limiteRecebido = Number(query.limit || query.limite || 24);
  const limite = Math.min(Math.max(Number.isFinite(limiteRecebido) ? limiteRecebido : 24, 1), 60);
  return { pagina, limite, skip: (pagina - 1) * limite };
}

function popularServico(query) {
  return query.populate({ path: 'categoria', select: 'legacyId nome slug' }).populate({
    path: 'freelancer',
    select: 'nome fotoPerfil avaliacaoMedia totalAvaliacoes tipoConta'
  });
}

async function anexarResumoAvaliacoes(servicos = []) {
  const ids = servicos.map((servico) => servico?._id).filter(Boolean);
  if (!ids.length) return [];

  const resumo = await Avaliacao.aggregate([
    { $match: { servico: { $in: ids } } },
    { $group: { _id: '$servico', total: { $sum: 1 }, media: { $avg: '$notaServico' } } }
  ]);

  const resumoPorServico = new Map(resumo.map((item) => [String(item._id), item]));
  return servicos.map((servico) => {
    const item = resumoPorServico.get(String(servico._id)) || { total: 0, media: 0 };
    return {
      ...servico,
      avaliacaoMediaServico: item.total ? Number(Number(item.media || 0).toFixed(1)) : 0,
      totalAvaliacoesServico: item.total || 0
    };
  });
}

async function montarFiltro(query = {}) {
  const filtro = {};
  const busca = String(query.busca || query.q || '').trim();
  const categoriaRecebida = query.categoria || query.categoriaId || query.genero_id;
  const min = query.min ?? query.precoMin;
  const max = query.max ?? query.precoMax;

  if (busca) {
    const regex = new RegExp(escaparRegex(busca), 'i');
    filtro.$or = [{ nome: regex }, { descricao: regex }, { extra: regex }];
  }

  if (categoriaRecebida) {
    const categoria = await Categoria.findOne({
      $or: [
        { legacyId: Number(categoriaRecebida) || -1 },
        { slug: String(categoriaRecebida).toLowerCase() }
      ]
    });
    filtro.categoria = categoria ? categoria._id : null;
  }

  const preco = {};
  if (min !== undefined && min !== '') {
    const valorMin = Number(min);
    if (Number.isFinite(valorMin)) preco.$gte = valorMin;
  }
  if (max !== undefined && max !== '') {
    const valorMax = Number(max);
    if (Number.isFinite(valorMax)) preco.$lte = valorMax;
  }
  if (Object.keys(preco).length) filtro.preco = preco;

  const localizacao = String(query.localizacao || query.location || '').trim();
  const disponibilidade = String(query.disponibilidade || query.availability || '').trim();

  if (localizacao || disponibilidade) {
    const filtroFreelancer = { tipoConta: 'Freelancer' };
    if (localizacao) filtroFreelancer.localizacao = new RegExp(escaparRegex(localizacao), 'i');
    if (disponibilidade)
      filtroFreelancer.disponibilidade = new RegExp(escaparRegex(disponibilidade), 'i');
    const freelancers = await Usuario.find(filtroFreelancer).select('_id').lean();
    filtro.freelancer = { $in: freelancers.map((freelancer) => freelancer._id) };
  }

  return filtro;
}

async function consultarServicos(filtro, { ordenar, skip, limite }) {
  const ordenacoes = {
    recentes: { createdAt: -1 },
    antigos: { createdAt: 1 },
    preco_asc: { preco: 1, createdAt: -1 },
    preco_desc: { preco: -1, createdAt: -1 }
  };

  let consulta = popularServico(Servico.find(filtro))
    .sort(ordenacoes[ordenar] || ordenacoes.recentes)
    .lean();

  if (limite) consulta = consulta.skip(skip || 0).limit(limite);
  return anexarResumoAvaliacoes(await consulta);
}

async function listar(query = {}) {
  const filtro = await montarFiltro(query);
  const { pagina, limite, skip } = obterPaginacao(query);
  const avaliacaoMin = Number(query.avaliacaoMin || query.avaliacao || 0);
  const filtrarAvaliacao = Number.isFinite(avaliacaoMin) && avaliacaoMin > 0;

  const [servicos, totalDocumentos] = await Promise.all([
    consultarServicos(filtro, {
      ordenar: query.ordenar,
      skip: filtrarAvaliacao ? 0 : skip,
      limite: filtrarAvaliacao ? undefined : limite
    }),
    filtrarAvaliacao ? Promise.resolve(null) : Servico.countDocuments(filtro)
  ]);

  const filtrados = filtrarAvaliacao
    ? servicos.filter((servico) => Number(servico.avaliacaoMediaServico || 0) >= avaliacaoMin)
    : servicos;
  const resultado = filtrarAvaliacao ? filtrados.slice(skip, skip + limite) : filtrados;
  const total = filtrarAvaliacao ? filtrados.length : totalDocumentos;

  return {
    servicos: resultado,
    pagination: {
      page: pagina,
      limit: limite,
      total,
      totalPages: Math.max(Math.ceil(total / limite), 1)
    }
  };
}

async function buscarPorCategoria(categoriaId, query = {}) {
  const categoria = await Categoria.findOne({ legacyId: Number(categoriaId) });
  if (!categoria) return null;

  const { pagina, limite, skip } = obterPaginacao(query);
  const filtro = { categoria: categoria._id };
  const [servicos, total] = await Promise.all([
    consultarServicos(filtro, { ordenar: query.ordenar, skip, limite }),
    Servico.countDocuments(filtro)
  ]);

  return {
    servicos,
    pagination: {
      page: pagina,
      limit: limite,
      total,
      totalPages: Math.max(Math.ceil(total / limite), 1)
    }
  };
}

async function buscarPorId(id) {
  const servico = await popularServico(Servico.findById(id)).lean();
  if (!servico) return null;

  const [servicoComResumo] = await anexarResumoAvaliacoes([servico]);
  return servicoComResumo || null;
}

function buscarDocumentoPorId(id) {
  return popularServico(Servico.findById(id));
}

async function criar({
  nome,
  descricao,
  preco,
  valorCombinar,
  extra,
  imagemServico,
  categoriaIdRecebido,
  freelancerId
}) {
  if (!nome || !descricao || (!valorCombinar && !preco) || !categoriaIdRecebido) {
    return { erro: 'campos_incompletos' };
  }

  const precoNumerico = valorCombinar ? null : Number(preco);
  if (!valorCombinar && (!Number.isFinite(precoNumerico) || precoNumerico <= 0)) {
    return { erro: 'preco_invalido' };
  }

  const categoria = await Categoria.findOne({ legacyId: Number(categoriaIdRecebido) });
  if (!categoria) return { erro: 'categoria_invalida' };

  const servico = await Servico.create({
    nome: String(nome).trim(),
    descricao: String(descricao).trim(),
    preco: precoNumerico,
    precoNegociavel: false,
    valorCombinar,
    extra: String(extra || '').trim(),
    imagemServico,
    categoria: categoria._id,
    freelancer: freelancerId
  });

  return { servico };
}

async function aplicarAtualizacao(
  servico,
  { nome, descricao, preco, valorCombinarCampo, categoriaIdRecebido, extra, imagemServico }
) {
  const valorCombinar =
    valorCombinarCampo === 'on' || valorCombinarCampo === 'true' || valorCombinarCampo === true;

  if (nome !== undefined) servico.nome = String(nome).trim();
  if (descricao !== undefined) servico.descricao = String(descricao).trim();
  if (extra !== undefined) servico.extra = String(extra || '').trim();
  servico.precoNegociavel = false;
  if (valorCombinarCampo !== undefined) servico.valorCombinar = valorCombinar;

  if (categoriaIdRecebido !== undefined && categoriaIdRecebido !== '') {
    const categoria = await Categoria.findOne({ legacyId: Number(categoriaIdRecebido) });
    if (!categoria) return { erro: 'categoria_invalida' };
    servico.categoria = categoria._id;
  }

  if (servico.valorCombinar) {
    servico.preco = null;
    servico.precoNegociavel = false;
  } else if (preco !== undefined && preco !== '') {
    const precoNumerico = Number(preco);
    if (!Number.isFinite(precoNumerico) || precoNumerico <= 0) return { erro: 'preco_invalido' };
    servico.preco = precoNumerico;
  }

  if (
    !servico.valorCombinar &&
    (!Number.isFinite(Number(servico.preco)) || Number(servico.preco) <= 0)
  ) {
    return { erro: 'preco_ou_valor_combinar_obrigatorio' };
  }

  const imagemAnterior = imagemServico ? servico.imagemServico : null;
  if (imagemServico) servico.imagemServico = imagemServico;

  return { imagemAnterior };
}

async function salvarAtualizacao(servico) {
  await servico.save();
  return servico;
}

async function remover(servico) {
  const contratosAtivos = await Contrato.countDocuments({
    servico: servico._id,
    status: {
      $in: ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento', 'entregue']
    }
  });
  if (contratosAtivos > 0) return { contratosAtivos: true };

  await Servico.deleteOne({ _id: servico._id });
  return { contratosAtivos: false };
}

module.exports = {
  listar,
  buscarPorCategoria,
  buscarPorId,
  buscarDocumentoPorId,
  criar,
  aplicarAtualizacao,
  salvarAtualizacao,
  remover
};
