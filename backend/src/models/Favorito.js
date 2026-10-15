const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    servico: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', required: true }
  },
  { timestamps: true }
);

favoritoSchema.index({ usuario: 1, servico: 1 }, { unique: true });
favoritoSchema.index({ servico: 1 });

module.exports = mongoose.model('Favorito', favoritoSchema);
