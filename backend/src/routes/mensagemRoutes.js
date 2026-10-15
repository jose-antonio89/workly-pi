const express = require('express');
const controller = require('../controllers/mensagemController');
const auth = require('../middleware/autenticacaoMiddleware');

const router = express.Router();

router.post('/', auth, controller.enviar);

router.get('/nao-lidas', auth, controller.contarNaoLidas);

router.get('/resumo', auth, controller.resumoPorContrato);

router.get('/contrato/:contratoId', auth, controller.listarPorContrato);

module.exports = router;
