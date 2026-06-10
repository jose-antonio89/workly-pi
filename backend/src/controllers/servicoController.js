
const Categoria = require('../models/Categoria');
const Servico = require('../models/Servico');
const Avaliacao = require('../models/Avaliacao');
const Usuario = require('../models/Usuario');
const Contrato = require('../models/Contrato');
const { mapServico } = require('../utils/mapeadoresResposta');
const { sucesso, erro } = require('../utils/apiResponse');
const { obterCampo } = require('../utils/requisicaoUtils');
const { removerArquivoSeExistir } = require('../utils/arquivoUtils');

function obterPaginacao(query = {}) {
  const pagina = Math.max(Number(query.page || query.pagina || 1), 1);
  const limiteRecebido = Number(query.limit || query.limite || 24);
  const limite = Math.min(Math.max(Number.isFinite(limiteRecebido) ? limiteRecebido : 24, 1), 60);
  return { pagina, limite, skip: (pagina - 1) * limite };
}

// busca serviços já trazendo somente os campos usados pelo front.
// lean() evita criar documentos Mongoose completos para listas grandes.
function popularServico(query) {
  return query
    .populate({ path: 'categoria', select: 'legacyId nome slug' })
    .populate({ path: 'freelancer', select: 'nome fotoPerfil avaliacaoMedia totalAvaliacoes tipoConta' });
}

async function listarServicos(filtro = {}, opcoes = {}) {
  const ordenar = opcoes.ordenar || 'recentes';
  const ordenacoes = {
    recentes: { createdAt: -1 },
    antigos: { createdAt: 1 },
    preco_asc: { preco: 1, createdAt: -1 },
    preco_desc: { preco: -1, createdAt: -1 }
  };

  let query = popularServico(Servico.find(filtro))
    .sort(ordenacoes[ordenar] || ordenacoes.recentes)
    .lean();

  if (opcoes.limite) {
    query = query.skip(opcoes.skip || 0).limit(opcoes.limite);
  }

  const servicos = await query;
  return anexarResumoAvaliacoes(servicos);
}

async function montarFiltroServicos(query = {}) {
  const filtro = {};
  const busca = String(query.busca || query.q || '').trim();
  const categoriaRecebida = query.categoria || query.categoriaId || query.genero_id;
  const min = query.min ?? query.precoMin;
  const max = query.max ?? query.precoMax;

  if (busca) {
    const regex = new RegExp(busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ nome: regex }, { descricao: regex }, { extra: regex }];
  }

  if (categoriaRecebida) {
    const categoria = await Categoria.findOne({
      $or: [
        { legacyId: Number(categoriaRecebida) || -1 },
        { slug: String(categoriaRecebida).toLowerCase() }
      ]
    });
    if (categoria) filtro.categoria = categoria._id;
    else filtro.categoria = null;
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

  // filtros por atributos do freelancer (localizacao e disponibilidade).
  // como esses campos ficam no usuario e não no servico, buscamos os ids dos
  // freelancers que casam com o filtro e adicionamos ao filtro principal.
  const localizacao = String(query.localizacao || query.location || '').trim();
  const disponibilidade = String(query.disponibilidade || query.availability || '').trim();

  if (localizacao || disponibilidade) {
    const filtroFreelancer = { tipoConta: 'Freelancer' };
    if (localizacao) {
      filtroFreelancer.localizacao = new RegExp(localizacao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    if (disponibilidade) {
      filtroFreelancer.disponibilidade = new RegExp(disponibilidade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const freelancers = await Usuario.find(filtroFreelancer).select('_id').lean();
    filtro.freelancer = { $in: freelancers.map(f => f._id) };
  }

  return filtro;
}

// calcula média e total de avaliações sem precisar salvar isso duplicado no serviço.
async function anexarResumoAvaliacoes(servicos = []) {
  const lista = Array.isArray(servicos) ? servicos : [servicos];
  const ids = lista.map(servico => servico?._id).filter(Boolean);
  if (!ids.length) return Array.isArray(servicos) ? [] : null;

  const resumo = await Avaliacao.aggregate([
    { $match: { servico: { $in: ids } } },
    { $group: { _id: '$servico', total: { $sum: 1 }, media: { $avg: '$notaServico' } } }
  ]);

  const resumoPorServico = new Map(resumo.map(item => [String(item._id), item]));
  const comResumo = lista.map(servico => {
    const base = servico?.toObject ? servico.toObject() : servico;
    const item = resumoPorServico.get(String(base._id)) || { total: 0, media: 0 };
    return {
      ...base,
      avaliacaoMediaServico: item.total ? Number(Number(item.media || 0).toFixed(1)) : 0,
      totalAvaliacoesServico: item.total || 0
    };
  });

  return Array.isArray(servicos) ? comResumo : comResumo[0];
}

// lista serviços com filtros e paginação básica.
// a parte de avaliação mínima é filtrada depois porque a média é calculada fora do documento do serviço.
exports.listarTodos = async (req, res) => {
  try {
    const filtro = await montarFiltroServicos(req.query);
    const { pagina, limite, skip } = obterPaginacao(req.query);
    const avaliacaoMin = Number(req.query.avaliacaoMin || req.query.avaliacao || 0);

    // quando existe filtro por avaliação, buscamos uma janela maior para filtrar pela média calculada.
    // isso mantém paginação sem precisar duplicar média de avaliação no documento serviço.
    const precisaFiltrarAvaliacao = Number.isFinite(avaliacaoMin) && avaliacaoMin > 0;
    const limiteBusca = precisaFiltrarAvaliacao ? Math.min(limite * 4, 120) : limite;

    const servicosPromise = listarServicos(filtro, {
      ordenar: req.query.ordenar,
      skip: precisaFiltrarAvaliacao ? 0 : skip,
      limite: limiteBusca
    });

    const totalPromise = precisaFiltrarAvaliacao
      ? Promise.resolve(null)
      : Servico.countDocuments(filtro);

    const [servicos, totalDocumentos] = await Promise.all([servicosPromise, totalPromise]);

    const filtrados = precisaFiltrarAvaliacao
      ? servicos.filter(servico => Number(servico.avaliacaoMediaServico || 0) >= avaliacaoMin)
      : servicos;

    const resultado = precisaFiltrarAvaliacao
      ? filtrados.slice(skip, skip + limite)
      : filtrados;

    const totalBase = precisaFiltrarAvaliacao ? filtrados.length : totalDocumentos;

    return sucesso(res, 200, 'Serviços carregados com sucesso.', resultado.map(servico => mapServico(req, servico)), {
      pagination: {
        page: pagina,
        limit: limite,
        total: totalBase,
        totalPages: Math.max(Math.ceil(totalBase / limite), 1)
      }
    });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao buscar serviços.');
  }
};

exports.buscarPorCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findOne({ legacyId: Number(req.params.id) });
    if (!categoria) {
      return sucesso(res, 200, 'Categoria não encontrada.', []);
    }

    const { pagina, limite, skip } = obterPaginacao(req.query);
    const filtro = { categoria: categoria._id };
    const [servicos, total] = await Promise.all([
      listarServicos(filtro, { ordenar: req.query.ordenar, skip, limite }),
      Servico.countDocuments(filtro)
    ]);

    return sucesso(res, 200, 'Serviços da categoria carregados com sucesso.', servicos.map(servico => mapServico(req, servico)), {
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages: Math.max(Math.ceil(total / limite), 1)
      }
    });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao buscar serviços por categoria.');
  }
};

// criação de anúncio: só freelancer pode criar serviço.
// cria serviço novo.
// se não tiver imagem enviada, o front/backend usam a imagem padrão.
exports.criar = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id_usuario);
    if (!usuario || usuario.tipoConta !== 'Freelancer') {
      // se o cara mandou imagem mas não pode criar anúncio, apaga o arquivo pra não virar lixo no servidor.
      if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
      return erro(res, 403, 'Acesso negado. Este usuário não é um freelancer.');
    }

    const nome = obterCampo(req.body, ['nome']);
    const descricao = obterCampo(req.body, ['descricao']);
    const preco = obterCampo(req.body, ['preco']);
    const precoNegociavel = false;
    const valorCombinar = obterCampo(req.body, ['valorCombinar', 'priceByContact']) === 'on' || obterCampo(req.body, ['valorCombinar', 'priceByContact']) === 'true' || obterCampo(req.body, ['valorCombinar', 'priceByContact']) === true;
    const categoriaIdRecebido = obterCampo(req.body, ['categoriaId', 'genero_id']);
    const extra = obterCampo(req.body, ['extra']);

    if (!nome || !descricao || (!valorCombinar && !preco) || !categoriaIdRecebido) {
      if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
      return erro(res, 400, 'Campos incompletos.');
    }

    const precoNumerico = valorCombinar ? null : Number(preco);
    if (!valorCombinar && (!Number.isFinite(precoNumerico) || precoNumerico <= 0)) {
      if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
      return erro(res, 400, 'Informe um preço válido maior que zero.');
    }

    const categoria = await Categoria.findOne({ legacyId: Number(categoriaIdRecebido) });
    if (!categoria) {
      if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
      return erro(res, 400, 'Categoria inválida.');
    }

    const servico = await Servico.create({
      nome: String(nome).trim(),
      descricao: String(descricao).trim(),
      preco: precoNumerico,
      precoNegociavel,
      valorCombinar,
      extra: String(extra || '').trim(),
      imagemServico: req.file ? `/uploads/servicos/${req.file.filename}` : '/uploads/servicos/servico_padrao.svg',
      categoria: categoria._id,
      freelancer: usuario._id
    });

    const servicoCompleto = await popularServico(Servico.findById(servico._id)).lean();
    const servicoComResumo = await anexarResumoAvaliacoes(servicoCompleto);
    return sucesso(res, 201, 'Serviço criado com sucesso!', mapServico(req, servicoComResumo));
  } catch (error) {
    console.error(error);
    if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
    return erro(res, 500, error.message || 'Erro ao criar o serviço.');
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const servico = await popularServico(Servico.findById(req.params.id)).lean();
    if (!servico) {
      return erro(res, 404, 'Serviço não encontrado.');
    }

    const servicoComResumo = await anexarResumoAvaliacoes(servico);
    return sucesso(res, 200, 'Serviço carregado com sucesso.', mapServico(req, servicoComResumo));
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao buscar serviço.');
  }
};

async function carregarServicoDoFreelancer(req, res) {
  const servico = await popularServico(Servico.findById(req.params.id));
  if (!servico) {
    erro(res, 404, 'Serviço não encontrado.');
    return null;
  }
  const userId = req.user.id_usuario || req.user.idUsuario;
  if (String(servico.freelancer?._id || servico.freelancer) !== String(userId)) {
    if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
    erro(res, 403, 'Você só pode editar serviços criados por você.');
    return null;
  }
  return servico;
}

exports.atualizar = async (req, res) => {
  try {
    const servico = await carregarServicoDoFreelancer(req, res);
    if (!servico) return;

    const nome = obterCampo(req.body, ['nome']);
    const descricao = obterCampo(req.body, ['descricao']);
    const preco = obterCampo(req.body, ['preco']);
    const valorCombinarCampo = obterCampo(req.body, ['valorCombinar', 'priceByContact']);
    const categoriaIdRecebido = obterCampo(req.body, ['categoriaId', 'genero_id']);
    const extra = obterCampo(req.body, ['extra']);

    const precoNegociavel = false;
    const valorCombinar = valorCombinarCampo === 'on' || valorCombinarCampo === 'true' || valorCombinarCampo === true;

    if (nome !== undefined) servico.nome = String(nome).trim();
    if (descricao !== undefined) servico.descricao = String(descricao).trim();
    if (extra !== undefined) servico.extra = String(extra || '').trim();
    servico.precoNegociavel = precoNegociavel;
    if (valorCombinarCampo !== undefined) servico.valorCombinar = valorCombinar;

    if (categoriaIdRecebido !== undefined && categoriaIdRecebido !== '') {
      const categoria = await Categoria.findOne({ legacyId: Number(categoriaIdRecebido) });
      if (!categoria) {
        if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
        return erro(res, 400, 'Categoria inválida.');
      }
      servico.categoria = categoria._id;
    }

    if (servico.valorCombinar) {
      servico.preco = null;
      servico.precoNegociavel = false;
    } else if (preco !== undefined && preco !== '') {
      const precoNumerico = Number(preco);
      if (!Number.isFinite(precoNumerico) || precoNumerico <= 0) {
        if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
        return erro(res, 400, 'Informe um preço válido maior que zero.');
      }
      servico.preco = precoNumerico;
    }

    if (!servico.valorCombinar && (!Number.isFinite(Number(servico.preco)) || Number(servico.preco) <= 0)) {
      if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
      return erro(res, 400, 'Informe um preço válido ou marque valor a combinar.');
    }

    if (req.file) {
      const imagemAnterior = servico.imagemServico;
      servico.imagemServico = `/uploads/servicos/${req.file.filename}`;
      if (imagemAnterior && !String(imagemAnterior).includes('servico_padrao.svg')) removerArquivoSeExistir(imagemAnterior);
    }

    await servico.save();
    const completo = await popularServico(Servico.findById(servico._id)).lean();
    const comResumo = await anexarResumoAvaliacoes(completo);
    return sucesso(res, 200, 'Serviço atualizado com sucesso.', mapServico(req, comResumo));
  } catch (error) {
    console.error(error);
    if (req.file) removerArquivoSeExistir(`/uploads/servicos/${req.file.filename}`);
    return erro(res, 500, error.message || 'Erro ao atualizar serviço.');
  }
};

exports.remover = async (req, res) => {
  try {
    const servico = await carregarServicoDoFreelancer(req, res);
    if (!servico) return;
    const contratosAtivos = await Contrato.countDocuments({
      servico: servico._id,
      status: { $in: ['pendente', 'proposta_pendente', 'proposta_aceita', 'em_andamento'] }
    });
    if (contratosAtivos > 0) return erro(res, 400, 'Não é possível remover um serviço com contratos ativos.');
    const imagemAnterior = servico.imagemServico;
    await Servico.deleteOne({ _id: servico._id });
    if (imagemAnterior && !String(imagemAnterior).includes('servico_padrao.svg')) removerArquivoSeExistir(imagemAnterior);
    return sucesso(res, 200, 'Serviço removido com sucesso.', { idServico: req.params.id });
  } catch (error) {
    console.error(error);
    return erro(res, 500, 'Erro ao remover serviço.');
  }
};

exports.getAll = exports.listarTodos;

exports.getByCategoria = exports.buscarPorCategoria;

exports.getById = exports.buscarPorId;

exports.create = exports.criar;

exports.update = exports.atualizar;

exports.delete = exports.remover;
