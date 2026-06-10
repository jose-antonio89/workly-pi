
const mongoose = require('mongoose');

// mensagens de chat vinculadas a um contrato específico.
// apenas as duas partes do contrato (cliente e freelancer) podem ver e enviar.
const mensagemSchema = new mongoose.Schema({
  contrato: { type: mongoose.Schema.Types.ObjectId, ref: 'Contrato', required: true },
  remetente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: true, trim: true, maxlength: 2000 },
  lida: { type: Boolean, default: false }
}, { timestamps: true });

// índice principal: buscar todas as mensagens de um contrato em ordem cronológica.
mensagemSchema.index({ contrato: 1, createdAt: 1 });
// índice para contar não-lidas por destinatário dentro de um contrato.
mensagemSchema.index({ contrato: 1, remetente: 1, lida: 1 });
mensagemSchema.index({ lida: 1, remetente: 1, contrato: 1 });

module.exports = mongoose.model('Mensagem', mensagemSchema, 'mensagens');
