const app = require('./app');
const connectDatabase = require('./config/db');
const ambiente = require('./config/ambiente');
const { popularBancoDemo } = require('./seed');

// ponto de partida do backend: conecta no mongo, prepara os dados demo se estiver ligado e sobe a api
(async () => {
  try {
    await connectDatabase();

    if (ambiente.autoSeed) {
      // banco já começa com categorias/serviços de exemplo.
      await popularBancoDemo();
    }

    app.listen(ambiente.port, () => {
      console.log(`Servidor rodando em http://localhost:${ambiente.port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
})();
