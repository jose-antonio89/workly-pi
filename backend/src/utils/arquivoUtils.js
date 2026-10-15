const fs = require('fs');
const path = require('path');

function removerArquivoSeExistir(caminhoRelativo) {
  if (
    !caminhoRelativo ||
    typeof caminhoRelativo !== 'string' ||
    !caminhoRelativo.startsWith('/uploads/')
  ) {
    return;
  }

  const caminhoAbsoluto = path.resolve(__dirname, `../../.${caminhoRelativo}`);
  if (fs.existsSync(caminhoAbsoluto)) {
    fs.unlinkSync(caminhoAbsoluto);
  }
}

module.exports = { removerArquivoSeExistir };
