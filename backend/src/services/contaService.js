const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Servico = require('../models/Servico');
const Contrato = require('../models/Contrato');
const Favorito = require('../models/Favorito');
const Mensagem = require('../models/Mensagem');
const Avaliacao = require('../models/Avaliacao');
const Notificacao = require('../models/Notificacao');
const { removerArquivoSeExistir } = require('../utils/arquivoUtils');
const { TEMPLATES } = require('../utils/notificacaoUtils');

const FOTO_PADRAO = '/uploads/perfis/perfil_padrao.svg';
const NOME_REMOVIDO = 'Usuário removido';
// a marca de verificação só cobre a checagem de contratos ativos; se o processo cair antes da
// confirmação, ela expira e a conta volta ao normal, porque nada destrutivo aconteceu ainda.
const MARCA_EXPIRADA_MS = 5 * 60 * 1000;

// regra técnica do projeto: excluir a conta anonimiza o registro em vez de apagá-lo,
// preservando contratos encerrados, avaliações e mensagens que fazem parte do histórico da outra parte.
// CPF e e-mail viram marcadores únicos (gravados pelo driver para não passar pelo validador de CPF),
// assim os índices únicos continuam válidos e os dados reais ficam livres para um novo cadastro.
function camposAnonimizados(id) {
  return {
    nome: NOME_REMOVIDO,
    email: `removido+${id}@conta-removida.invalid`,
    cpf: `removido:${id}`,
    senha: `!removido:${crypto.randomBytes(16).toString('hex')}`,
    telefone: '',
    areaAtuacao: '',
    fotoPerfil: FOTO_PADRAO,
    tituloProfissional: '',
    bio: '',
    localizacao: '',
    site: '',
    linkedin: '',
    github: '',
    instagram: '',
    portfolioTitulo: '',
    portfolioDescricao: '',
    portfolioUrl: '',
    disponibilidade: '',
    precoHora: '',
    metodoPagamento: '',
    chavePix: '',
    banco: '',
    notificacoesEmail: false,
    notificacoesPropostas: false,
    notificacoesMarketing: false,
    removido: true,
    removidoEm: new Date(),
    removendoDesde: null
  };
}

// a conta está fora de uso se já foi removida ou se a exclusão passou do ponto sem volta.
function contaEncerrada(usuario) {
  return Boolean(usuario?.removido || usuario?.exclusaoConfirmadaEm);
}

// troca o nome da conta removida nos textos das notificações de outras pessoas que a citam
// (mensagens enviadas e avaliações escritas por ela) e apaga as notificações da própria conta.
// Regenera o texto pelo mesmo modelo, então rodar de novo não muda nada.
async function anonimizarNotificacoes(usuarioId) {
  const [mensagens, avaliacoes] = await Promise.all([
    Mensagem.find({ remetente: usuarioId }).select('_id').lean(),
    Avaliacao.find({ autor: usuarioId }).select('_id notaFreelancer').lean()
  ]);
  if (mensagens.length) {
    await Notificacao.updateMany(
      { tipo: 'mensagem_nova', tipoReferencia: 'mensagem', referenciaId: { $in: mensagens.map((m) => m._id) } },
      { $set: { titulo: TEMPLATES.mensagem_nova(NOME_REMOVIDO, '').titulo } }
    );
  }
  if (avaliacoes.length) {
    await Notificacao.bulkWrite(
      avaliacoes.map((avaliacao) => ({
        updateMany: {
          filter: { tipo: 'avaliacao_recebida', tipoReferencia: 'avaliacao', referenciaId: avaliacao._id },
          update: { $set: TEMPLATES.avaliacao_recebida(NOME_REMOVIDO, Number(avaliacao.notaFreelancer)) }
        }
      }))
    );
  }
  await Notificacao.deleteMany({ destinatario: usuarioId });
}

// contrato ativo ligado a conta encerrada só existe se um pedido foi gravado durante a exclusão e o
// processo caiu antes da segunda checagem. Ele é cancelado (não apagado) para manter o registro.
async function cancelarContratosAtivosDe(ids) {
  if (!ids.length) return 0;
  const resultado = await Contrato.updateMany(
    { $or: [{ cliente: { $in: ids } }, { freelancer: { $in: ids } }], status: { $in: Contrato.STATUS_ATIVOS } },
    { $set: { status: 'cancelado' } }
  );
  return resultado.modifiedCount || 0;
}

// conclui uma exclusão já confirmada. Cada passo pode ser repetido sem efeito extra, então a mesma
// função serve para o fluxo normal e para retomar uma exclusão interrompida.
// A anonimização do usuário é o último passo: até lá a conta segue bloqueada por exclusaoConfirmadaEm.
async function concluirExclusao(usuarioId) {
  const usuario = await Usuario.findById(usuarioId).select('removido exclusaoConfirmadaEm fotoPerfil').lean();
  if (!usuario || !contaEncerrada(usuario)) return false;

  await cancelarContratosAtivosDe([usuario._id]);
  if (usuario.removido) return true;

  const servicos = await Servico.find({ freelancer: usuario._id, removido: { $ne: true } }).select('_id').lean();
  const servicoIds = servicos.map((servico) => servico._id);
  if (servicoIds.length) {
    await Servico.updateMany({ _id: { $in: servicoIds } }, { $set: { removido: true, removidoEm: new Date() } });
  }
  const todosServicos = await Servico.find({ freelancer: usuario._id }).select('_id').lean();
  await Favorito.deleteMany({
    $or: [{ usuario: usuario._id }, { servico: { $in: todosServicos.map((servico) => servico._id) } }]
  });
  await anonimizarNotificacoes(usuario._id);

  const foto = usuario.fotoPerfil;
  if (foto && foto.startsWith('/uploads/perfis/perfil_') && foto !== FOTO_PADRAO) {
    try {
      removerArquivoSeExistir(foto);
    } catch (error) {
      console.error('Falha ao remover foto de conta excluída:', error?.message || error);
    }
  }

  await Usuario.collection.updateOne(
    { _id: usuario._id, removido: { $ne: true } },
    { $set: camposAnonimizados(String(usuario._id)) }
  );
  // um pedido pode ter sido gravado enquanto os passos acima rodavam.
  await cancelarContratosAtivosDe([usuario._id]);
  return true;
}

// resultado: { ok: true } ou { status, mensagem }
async function excluirConta(usuarioId, senhaAtual) {
  if (typeof senhaAtual !== 'string' || !senhaAtual) {
    return { status: 400, mensagem: 'Informe sua senha atual para excluir a conta.' };
  }
  const usuario = await Usuario.findById(usuarioId).select('senha removido exclusaoConfirmadaEm');
  if (!usuario || contaEncerrada(usuario)) return { status: 404, mensagem: 'Usuário não encontrado.' };

  let senhaCorreta = false;
  try {
    senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
  } catch {
    senhaCorreta = false;
  }
  // 403, não 401: o frontend trata 401 nesta rota como sessão expirada e encerraria o login.
  if (!senhaCorreta) return { status: 403, mensagem: 'Senha atual incorreta.' };

  // fase 1 (reversível): marca a verificação antes de procurar contratos ativos. A criação de contratos
  // confere esta marca antes e depois de gravar, então pedidos simultâneos são recusados ou desfeitos.
  const marca = new Date();
  const marcado = await Usuario.findOneAndUpdate(
    {
      _id: usuario._id,
      removido: { $ne: true },
      exclusaoConfirmadaEm: null,
      $or: [{ removendoDesde: null }, { removendoDesde: { $lt: new Date(Date.now() - MARCA_EXPIRADA_MS) } }]
    },
    { $set: { removendoDesde: marca } }
  );
  if (!marcado) return { status: 409, mensagem: 'A exclusão desta conta já está em andamento.' };
  const liberarMarca = () =>
    Usuario.updateOne({ _id: usuario._id, removendoDesde: marca }, { $set: { removendoDesde: null } });

  let confirmado;
  try {
    const ativo = await Contrato.exists({
      $or: [{ cliente: usuario._id }, { freelancer: usuario._id }],
      status: { $in: Contrato.STATUS_ATIVOS }
    });
    if (ativo) {
      await liberarMarca();
      return {
        status: 409,
        mensagem:
          'Você possui contratos em andamento. Conclua ou cancele esses contratos antes de excluir a conta.'
      };
    }
    // fase 2 (sem volta): uma única gravação confirma a exclusão e invalida as sessões.
    // A partir daqui a conta não faz login nem participa de contratos, mesmo que o processo caia.
    confirmado = await Usuario.findOneAndUpdate(
      { _id: usuario._id, removendoDesde: marca, exclusaoConfirmadaEm: null },
      { $set: { exclusaoConfirmadaEm: new Date() }, $inc: { versaoSessao: 1 } }
    );
  } catch (error) {
    await liberarMarca().catch(() => {});
    throw error;
  }
  if (!confirmado) return { status: 409, mensagem: 'A exclusão desta conta já está em andamento.' };

  // se algo falhar aqui, a conta continua encerrada e a recuperação termina o trabalho.
  await concluirExclusao(usuario._id);
  return { ok: true };
}

// retoma exclusões interrompidas e cancela contratos ativos que tenham ficado ligados a contas encerradas.
// Roda na inicialização, periodicamente e pelo script src/scripts/recuperarExclusoes.js.
async function recuperarExclusoesPendentes() {
  const pendentes = await Usuario.find({ exclusaoConfirmadaEm: { $ne: null }, removido: { $ne: true } })
    .select('_id')
    .lean();
  for (const { _id } of pendentes) await concluirExclusao(_id);
  const encerradas = await Usuario.find({ $or: [{ removido: true }, { exclusaoConfirmadaEm: { $ne: null } }] })
    .select('_id')
    .lean();
  const contratosCancelados = await cancelarContratosAtivosDe(encerradas.map((usuario) => usuario._id));
  return { exclusoesConcluidas: pendentes.length, contratosCancelados };
}

// usada pela criação de contrato: conta inexistente, encerrada ou em verificação de exclusão não contrata.
async function contaPodeContratar(usuarioId) {
  const usuario = await Usuario.findById(usuarioId)
    .select('removido exclusaoConfirmadaEm removendoDesde')
    .lean();
  if (!usuario || contaEncerrada(usuario)) return false;
  const emVerificacao =
    usuario.removendoDesde && Date.now() - new Date(usuario.removendoDesde).getTime() < MARCA_EXPIRADA_MS;
  return !emVerificacao;
}

module.exports = {
  excluirConta,
  concluirExclusao,
  recuperarExclusoesPendentes,
  anonimizarNotificacoes,
  contaPodeContratar,
  contaEncerrada,
  FOTO_PADRAO,
  MARCA_EXPIRADA_MS,
  NOME_REMOVIDO
};
