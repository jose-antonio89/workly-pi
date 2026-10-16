const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const ambiente = require('../config/ambiente');
const { motivoNovaSenhaInvalida } = require('../utils/senhaUtils');

// Recuperação de senha local.
// - O token tem 32 bytes aleatórios; o banco guarda só o SHA-256 dele, com validade de 30 minutos.
// - Uma nova solicitação substitui o token anterior do mesmo usuário.
// - A redefinição consome o token numa única gravação condicional: troca a senha, incrementa versaoSessao
//   (o que derruba todas as sessões) e remove o token. Só um uso vence.
// - A API nunca devolve o token nem o link.

const VALIDADE_MS = 30 * 60 * 1000;
const REGEX_TOKEN = /^[a-f0-9]{64}$/;

const MENSAGEM_SOLICITADA =
  'Se houver uma conta com esse e-mail, as instruções de redefinição serão disponibilizadas.';
const MENSAGEM_INDISPONIVEL =
  'A recuperação de senha está indisponível no momento. Se você está conectado, altere a senha nas configurações do perfil.';
const MENSAGEM_TOKEN_INVALIDO = 'Este link de redefinição é inválido ou expirou. Solicite um novo.';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function urlBaseFrontend() {
  const configurada = String(process.env.PASSWORD_RESET_URL_BASE || '').trim();
  if (configurada) return configurada.replace(/\/+$/, '');
  return ambiente.frontendUrl && ambiente.frontendUrl !== '*' ? ambiente.frontendUrl.replace(/\/+$/, '') : 'http://localhost:5173';
}

// PONTO DE INTEGRAÇÃO DO PROVEDOR DE E-MAIL (pendente: depende de contratar um provedor e configurar credenciais).
// Devolve o canal que entrega o link ao dono da conta, ou null quando não há nenhum.
// Hoje o único canal é o console, e só no desenvolvimento local, com as DUAS condições juntas:
//   NODE_ENV=development  e  PASSWORD_RESET_DEV_LINK=console
// Em teste, produção ou qualquer outra combinação, não há canal: a solicitação responde "indisponível",
// nenhum token é criado e nada é registrado.
// Para ligar um provedor real, devolva aqui { enviar: async (email, link) => ... } quando ele estiver configurado.
function canalDeEntrega() {
  if (process.env.NODE_ENV === 'development' && process.env.PASSWORD_RESET_DEV_LINK === 'console') {
    return {
      enviar: async (email, link) => {
        console.info(`[recuperação de senha][somente desenvolvimento] link para ${email}: ${link}`);
      }
    };
  }
  return null;
}

function normalizarEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// Mesma regra da troca/cadastro: pelo menos oito caracteres, sem truncar os 72 bytes do bcrypt.
function motivoSenhaInvalida(senha, confirmacao) {
  const motivo = motivoNovaSenhaInvalida(senha);
  if (motivo) return motivo;
  if (confirmacao !== undefined && confirmacao !== senha) return 'A confirmação da senha não confere.';
  return null;
}

// a resposta é a mesma exista o e-mail ou não. Os dois caminhos fazem o mesmo trabalho:
// gerar o token e uma única gravação condicional pelo e-mail (que simplesmente não encontra nada).
async function solicitar(emailBruto) {
  const canal = canalDeEntrega();
  if (!canal) return { status: 503, mensagem: MENSAGEM_INDISPONIVEL };

  const email = normalizarEmail(emailBruto);
  const token = crypto.randomBytes(32).toString('hex');
  if (email) {
    const usuario = await Usuario.findOneAndUpdate(
      { email, removido: { $ne: true }, exclusaoConfirmadaEm: null },
      { $set: { redefinicaoSenha: { hash: hashToken(token), expiraEm: new Date(Date.now() + VALIDADE_MS) } } },
      { projection: { email: 1 } }
    );
    if (usuario) {
      // o token vai no fragmento (#): navegadores não o enviam ao servidor nem no cabeçalho Referer.
      const link = `${urlBaseFrontend()}/redefinir-senha#token=${token}`;
      try {
        await canal.enviar(usuario.email, link);
      } catch (error) {
        console.error('Falha ao entregar o link de redefinição:', error?.message || error);
      }
    }
  }
  return { status: 200, mensagem: MENSAGEM_SOLICITADA };
}

async function redefinir(tokenBruto, senha, confirmacao) {
  const token = typeof tokenBruto === 'string' ? tokenBruto.trim().toLowerCase() : '';
  if (!REGEX_TOKEN.test(token)) return { status: 400, mensagem: MENSAGEM_TOKEN_INVALIDO };
  const motivo = motivoSenhaInvalida(senha, confirmacao);
  if (motivo) return { status: 400, mensagem: motivo };

  const novaSenha = await bcrypt.hash(senha, 10);
  const usuario = await Usuario.findOneAndUpdate(
    {
      'redefinicaoSenha.hash': hashToken(token),
      'redefinicaoSenha.expiraEm': { $gt: new Date() },
      removido: { $ne: true },
      exclusaoConfirmadaEm: null
    },
    { $set: { senha: novaSenha }, $inc: { versaoSessao: 1 }, $unset: { redefinicaoSenha: 1 } },
    { projection: { _id: 1 } }
  );
  if (!usuario) return { status: 400, mensagem: MENSAGEM_TOKEN_INVALIDO };
  return { status: 200, mensagem: 'Senha redefinida. Entre com a nova senha.' };
}

module.exports = {
  solicitar,
  redefinir,
  hashToken,
  canalDeEntrega,
  VALIDADE_MS,
  MENSAGEM_SOLICITADA,
  MENSAGEM_INDISPONIVEL,
  MENSAGEM_TOKEN_INVALIDO
};
