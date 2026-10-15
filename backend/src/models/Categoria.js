const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    legacyId: { type: Number, required: true, unique: true },
    nome: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
