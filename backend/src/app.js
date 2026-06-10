
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const ambiente = require('./config/ambiente');
const rotasAutenticacao = require('./routes/autenticacaoRoutes');
const rotasServico = require('./routes/servicoRoutes');
const rotasUsuario = require('./routes/usuarioRoutes');
const rotasContrato = require('./routes/contratoRoutes');
const rotasFavorito = require('./routes/favoritoRoutes');
const rotasAvaliacao = require('./routes/avaliacaoRoutes');
const rotasNotificacao = require('./routes/notificacaoRoutes');
const rotasMensagem = require('./routes/mensagemRoutes');
const { erro } = require('./utils/apiResponse');

const app = express();

// limita tentativas de login: no máximo 10 por ip em 15 minutos
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => erro(res, 429, 'Muitas tentativas de login. Tente novamente em 15 minutos.')
});

app.use(cors({ origin: ambiente.frontendUrl === '*' ? true : ambiente.frontendUrl }));

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true,
  immutable: true
}));

// rate limit cobre login e cadastro 
app.use('/api/autenticacao/login', limitadorLogin);

app.use('/api/autenticacao/cadastro', limitadorLogin);

app.use('/api/autenticacao/register', limitadorLogin);

app.use('/api/autenticacao', rotasAutenticacao);

app.use('/api/servicos', rotasServico);

app.use('/api/usuarios', rotasUsuario);

app.use('/api/contratos', rotasContrato);

app.use('/api/favoritos', rotasFavorito);

app.use('/api/avaliacoes', rotasAvaliacao);

app.use('/api/notificacoes', rotasNotificacao);

app.use('/api/mensagens', rotasMensagem);

app.get('/', (_req, res) => {
  res.json({ sucesso: true, mensagem: 'API Workly v2.1 — com notificações e chat.', message: 'API Workly v2.1' });
});

app.use((_req, res) => erro(res, 404, 'Rota não encontrada.'));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.name === 'MulterError') {
    return erro(res, 400, 'Erro no upload do arquivo.');
  }
  return erro(res, 500, error.message || 'Erro interno do servidor.');
});

module.exports = app;
