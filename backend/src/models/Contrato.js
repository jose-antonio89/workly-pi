
const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  servico: { type: mongoose.Schema.Types.ObjectId, ref: 'Servico', required: true },
  preco: { type: Number, default: null },
  precoProposto: { type: Number, default: null },
  mensagem: { type: String, default: '', trim: true },
  detalhesPedido: { type: String, default: '', trim: true },
  prazoDesejado: { type: String, default: '', trim: true },
  referencias: { type: String, default: '', trim: true },
  tipoContratacao: { type: String, enum: ['fixo', 'negociavel', 'combinar'], default: 'fixo' },
  status: {
    type: String,
    enum: [
      'pendente',
      'proposta_pendente',
      'proposta_aceita',
      'em_andamento',
      'concluido',
      'cancelado',
      'encerrado'
    ],
    default: 'pendente'
  }
}, { timestamps: true });

contratoSchema.index({ cliente: 1, servico: 1, status: 1 });
contratoSchema.index({ freelancer: 1, status: 1, createdAt: -1 });
contratoSchema.index({ freelancer: 1, createdAt: -1 });
contratoSchema.index({ cliente: 1, createdAt: -1 });

module.exports = mongoose.model('Contrato', contratoSchema);
