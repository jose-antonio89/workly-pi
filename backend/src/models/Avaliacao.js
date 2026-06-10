
const mongoose = require('mongoose');

const avaliacaoSchema = new mongoose.Schema({
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  servico: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', required: true },
  contrato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrato', required: true },
  notaServico: { type: Number, min: 1, max: 5, required: true },
  notaFreelancer: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String, default: '', trim: true }
}, { timestamps: true });

avaliacaoSchema.index({ autor: 1, contrato: 1 }, { unique: true });
avaliacaoSchema.index({ servico: 1 });
avaliacaoSchema.index({ freelancer: 1, createdAt: -1 });

// terceiro parâmetro força o mongodb a usar exatamente "avaliacoes".
// sem isso, o mongoose pluraliza "avaliacao" como "avaliacaos".
module.exports = mongoose.model('Avaliacao', avaliacaoSchema, 'avaliacoes');
