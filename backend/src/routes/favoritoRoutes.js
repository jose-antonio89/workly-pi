const express = require('express');
const controller = require('../controllers/favoritoController');
const auth = require('../middleware/autenticacaoMiddleware');

const router = express.Router();

router.get('/', auth, controller.listar);

router.get('/servico/:servicoId', auth, controller.verificar);

router.post('/', auth, controller.criar);

router.delete('/servico/:servicoId', auth, controller.removerPorServico);

module.exports = router;
