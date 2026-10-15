const jwt = require('jsonwebtoken');
const ambiente = require('../config/ambiente');

const ALGORITMO = 'HS256';

// tokens sem "sv" (emitidos antes desta versão) são tratados como versão 0.
function emitirToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario._id.toString(),
      nome: usuario.nome,
      tipo: usuario.tipoConta,
      sv: Number(usuario.versaoSessao || 0)
    },
    ambiente.jwtSecret,
    { expiresIn: '7d', algorithm: ALGORITMO }
  );
}

function verificarToken(token) {
  return jwt.verify(token, ambiente.jwtSecret, { algorithms: [ALGORITMO] });
}

module.exports = { emitirToken, verificarToken, ALGORITMO };
