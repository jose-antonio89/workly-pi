const express = require('express');
const controller = require('../controllers/dashboardMongoController');

const router = express.Router();

// Rota pública para facilitar a apresentação do PI.
// Mostra as aggregations e estatísticas do MongoDB sem precisar fazer login no Postman.
router.get('/mongo', controller.resumoMongo);

module.exports = router;
