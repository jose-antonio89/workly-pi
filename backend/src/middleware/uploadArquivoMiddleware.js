const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

function criarUpload(pasta, prefixo) {
  const destino = path.resolve(__dirname, `../../uploads/${pasta}`);
  fs.mkdirSync(destino, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destino),
    filename: (req, file, callback) => {
      const idUsuario = req.user?.id_usuario || req.user?.idUsuario || 'anon';
      callback(
        null,
        `${prefixo}_${idUsuario}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`
      );
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
      if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
        return callback(new Error('Apenas imagens JPG, JPEG, PNG ou WEBP são permitidas.'));
      }
      callback(null, true);
    }
  });
}

module.exports = {
  uploadPerfil: criarUpload('perfis', 'perfil'),
  uploadServico: criarUpload('servicos', 'servico')
};
