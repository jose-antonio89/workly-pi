const Usuario = require('../models/Usuario');
const { verificarToken } = require('../utils/tokenSessao');
const { idMongoValido } = require('../utils/requisicaoUtils');
const { erro } = require('../utils/apiResponse');

// middleware das rotas protegidas: exige jwt válido de um usuário que ainda existe
// e cuja versão de sessão não foi invalidada por troca de senha.
// as mensagens de 401 citam "token" porque o frontend usa isso para encerrar a sessão local.
module.exports = async function autenticacaoMiddleware(req, res, next) {
  const cabecalhoAutorizacao = req.header('Authorization');
  if (!cabecalhoAutorizacao) {
    return erro(res, 401, 'Acesso negado. Token não informado.');
  }

  const token = cabecalhoAutorizacao.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return erro(res, 401, 'Acesso negado. Token inválido.');
  }

  let usuarioDecodificado;
  try {
    usuarioDecodificado = verificarToken(token);
  } catch (_error) {
    return erro(res, 401, 'Token inválido ou expirado.');
  }

  const idUsuario = usuarioDecodificado?.id_usuario;
  if (!idMongoValido(idUsuario)) {
    return erro(res, 401, 'Token inválido ou expirado.');
  }

  try {
    const usuario = await Usuario.findById(idUsuario).select('nome tipoConta versaoSessao removido exclusaoConfirmadaEm').lean();
    if (!usuario || usuario.removido || usuario.exclusaoConfirmadaEm) {
      return erro(res, 401, 'Sessão encerrada: token de uma conta que não existe mais.');
    }
    if (Number(usuarioDecodificado.sv || 0) !== Number(usuario.versaoSessao || 0)) {
      return erro(res, 401, 'Sessão encerrada: token revogado. Entre novamente.');
    }

    // tipo e nome vêm do banco, não do token, para refletir mudanças recentes.
    req.user = {
      ...usuarioDecodificado,
      id_usuario: idUsuario,
      idUsuario,
      nome: usuario.nome,
      tipo: usuario.tipoConta,
      tipoConta: usuario.tipoConta
    };
    return next();
  } catch (error) {
    return next(error);
  }
};
