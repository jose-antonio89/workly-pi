const express = require('express');
const controller = require('../controllers/contratoController');
const auth = require('../middleware/autenticacaoMiddleware');

const router = express.Router();

router.post('/', auth, controller.criar);

router.get('/meus', auth, controller.meus);

// rotas de ação deixam as permissões mais claras que um patch genérico de status.
router.post('/:id/aceitar', auth, controller.aceitar);

router.post('/:id/recusar', auth, controller.recusar);

router.post('/:id/iniciar', auth, controller.iniciar);

router.post('/:id/entregar', auth, controller.entregar);

router.post('/:id/confirmar', auth, controller.confirmarEntrega);

router.post('/:id/solicitar-ajuste', auth, controller.solicitarAjuste);

// negociação de valor dos contratos a combinar.
router.post('/:id/propor-valor', auth, controller.proporValor);

router.post('/:id/aprovar-valor', auth, controller.aprovarValor);

router.post('/:id/cancelar', auth, controller.cancelar);

// mantido para não quebrar telas antigas.
router.patch('/:id/status', auth, controller.atualizarStatus);

module.exports = router;
