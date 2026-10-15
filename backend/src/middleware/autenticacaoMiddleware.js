const jwt = require('jsonwebtoken');
const ambiente = require('../config/ambiente');
const { erro } = require('../utils/apiResponse');

// middleware das rotas protegidas: só deixa passar quem mandar um jwt válido.
module.exports = function autenticacaoMiddleware(req, res, next) {
  const cabecalhoAutorizacao = req.header('Authorization');
  if (!cabecalhoAutorizacao) {
    return erro(res, 401, 'Acesso negado. Token não informado.');
  }

  const token = cabecalhoAutorizacao.replace('Bearer ', '').trim();
  if (!token) {
    return erro(res, 401, 'Acesso negado. Token inválido.');
  }

  try {
    const usuarioDecodificado = jwt.verify(token, ambiente.jwtSecret);
    // salva os dados do token dentro da req pra controller saber quem está logado.
    req.user = {
      ...usuarioDecodificado,
      idUsuario: usuarioDecodificado.id_usuario,
      tipoConta: usuarioDecodificado.tipo
    };
    next();
  } catch (_error) {
    return erro(res, 401, 'Token inválido ou expirado.');
  }
};
