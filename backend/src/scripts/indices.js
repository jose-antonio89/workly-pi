// instala os índices do contrato sem subir a API (útil em deploy): node src/scripts/indices.js
const mongoose = require('mongoose');
const connectDatabase = require('../config/db');
const { garantirIndicesContrato, relatarProblemaIndice } = require('../models/Contrato');

(async () => {
  try {
    await connectDatabase();
    const resultado = await garantirIndicesContrato();
    if (resultado.instalado) {
      console.log('Índices de contrato instalados e verificados.');
    } else {
      relatarProblemaIndice(resultado);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Erro ao instalar índices:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
