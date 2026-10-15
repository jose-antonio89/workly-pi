const mongoose = require('mongoose');

// tipos de notificação disponíveis no sistema.
// cada tipo mapeia para um evento do ciclo de vida de contrato ou avaliação.
const TIPOS_VALIDOS = [
  'contrato_novo',
  'proposta_nova', // contratação negociável recebida pelo freelancer
  'proposta_aceita', // cliente recebe quando freelancer aceita
  'proposta_recusada', // cliente recebe quando freelancer recusa
  'trabalho_iniciado', // cliente recebe quando freelancer inicia
  'entrega_realizada', // cliente recebe quando freelancer entrega
  'contrato_cancelado', // a outra parte recebe quando alguém cancela
  'avaliacao_recebida', // freelancer recebe quando cliente avalia
  'mensagem_nova' // destinatário recebe quando alguém envia mensagem no chat
];

const notificacaoSchema = new mongoose.Schema(
  {
    destinatario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    tipo: { type: String, enum: TIPOS_VALIDOS, required: true },
    titulo: { type: String, required: true, trim: true },
    mensagem: { type: String, required: true, trim: true },
    lida: { type: Boolean, default: false },
    // referência opcional ao documento que gerou a notificação (contrato, avaliação etc.)
    referenciaId: { type: mongoose.Schema.Types.ObjectId, default: null },
    tipoReferencia: {
      type: String,
      enum: ['contrato', 'avaliacao', 'mensagem', null],
      default: null
    }
  },
  { timestamps: true }
);

// índice para buscar notificações de um usuário ordenadas por data, filtrando não-lidas.
notificacaoSchema.index({ destinatario: 1, lida: 1, createdAt: -1 });
notificacaoSchema.index({ destinatario: 1, tipo: 1, referenciaId: 1, lida: 1 });

module.exports = mongoose.model('Notificacao', notificacaoSchema, 'notificacoes');
