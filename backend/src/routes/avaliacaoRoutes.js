const express = require('express');
const controller = require('../controllers/avaliacaoController');
const auth = require('../middleware/autenticacaoMiddleware');

const router = express.Router();

router.post('/', auth, controller.criar);

router.get('/minhas', auth, controller.minhas);

router.get('/servico/:servicoId', controller.porServico);

module.exports = router;
