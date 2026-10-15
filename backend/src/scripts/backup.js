const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { mongoUri } = require('../config/ambiente');

function dataParaNomePasta(data = new Date()) {
  const pad = (valor) => String(valor).padStart(2, '0');
  return [
    data.getFullYear(),
    pad(data.getMonth() + 1),
    pad(data.getDate()),
    pad(data.getHours()),
    pad(data.getMinutes()),
    pad(data.getSeconds())
  ].join('-');
}

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

async function executarBackup() {
  const pastaBackups = path.resolve(__dirname, '../../backups');
  const nomeBackup = `workly-mongodump-${dataParaNomePasta()}`;
  const pastaDestino = path.join(pastaBackups, nomeBackup);

  fs.mkdirSync(pastaDestino, { recursive: true });

  const argumentos = ['--uri', mongoUri, '--out', pastaDestino, '--gzip'];

  console.log('Iniciando backup do MongoDB com mongodump...');
  console.log(`Destino: ${pastaDestino}`);

  await executarComando('mongodump', argumentos);

  console.log('Backup criado com sucesso.');
  console.log(`Pasta gerada: ${pastaDestino}`);
}

if (require.main === module) {
  executarBackup().catch((error) => {
    console.error('\nErro ao executar backup com mongodump.');
    console.error(
      'Verifique se o MongoDB Database Tools está instalado e se o comando mongodump funciona no terminal.'
    );
    console.error(`Detalhes: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { executarBackup };
