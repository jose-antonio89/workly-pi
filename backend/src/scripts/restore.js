const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { mongoUri } = require('../config/ambiente');

function executarComando(comando, argumentos) {
  return new Promise((resolve, reject) => {
    const processo = spawn(comando, argumentos, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    processo.on('error', (error) => reject(error));

    processo.on('close', (codigo) => {
      if (codigo === 0) {
        resolve();
        return;
      }

      reject(new Error(`${comando} finalizou com código ${codigo}`));
    });
  });
}

function resolverPastaBackup(argumento) {
  if (!argumento) {
    throw new Error(
      'Informe o caminho da pasta do backup. Exemplo: npm run restore -- ./backups/workly-mongodump-2026-06-10-12-00-00'
    );
  }

  const caminho = path.resolve(process.cwd(), argumento);

  if (!fs.existsSync(caminho)) {
    throw new Error(`Pasta de backup não encontrada: ${caminho}`);
  }

  return caminho;
}

async function executarRestore() {
  const pastaBackup = resolverPastaBackup(process.argv[2]);

  const argumentos = ['--uri', mongoUri, '--gzip', '--drop', pastaBackup];

  console.log('Iniciando restauração do MongoDB com mongorestore...');
  console.log(`Origem: ${pastaBackup}`);

  await executarComando('mongorestore', argumentos);

  console.log('Backup restaurado com sucesso.');
}

if (require.main === module) {
  executarRestore().catch((error) => {
    console.error('\nErro ao restaurar backup com mongorestore.');
    console.error(
      'Verifique se o MongoDB Database Tools está instalado e se o comando mongorestore funciona no terminal.'
    );
    console.error(`Detalhes: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { executarRestore };
