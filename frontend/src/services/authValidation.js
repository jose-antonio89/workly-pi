import { newPasswordProblem } from './passwordValidation.js';

export const areas = [
  'Design',
  'Programação',
  'Vídeo/Edição',
  'Inteligência Artificial',
  'Escrita/Tradução',
  'Fotografia',
  'Áudio/Música'
];

export function cpfDigits(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 11);
}
export function formatCpf(value = '') {
  const d = cpfDigits(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Exact legacy messages and order; CPF deliberately does not check verification digits.
export function validateField(name, value, { required = false, type = 'text', senha = '' } = {}) {
  if (type === 'checkbox') return required && !value ? 'Este campo é obrigatório' : '';
  if (name === 'cpf') {
    const d = cpfDigits(value);
    if (!d) return 'CPF é obrigatório';
    if (d.length !== 11) return 'CPF deve ter 11 números';
    if (/^(\d)\1{10}$/.test(d)) return 'CPF não pode ter todos os números iguais';
    return '';
  }
  const text = String(value || '').trim();
  if (required && !text) return 'Este campo é obrigatório';
  if (type === 'email' && text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text))
    return 'Por favor, insira um email válido';
  if (name === 'senha' && value) {
    if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    return newPasswordProblem(value);
  }
  if (name === 'confirmar_senha' && value && senha && value !== senha)
    return 'As senhas não coincidem';
  return '';
}

export function registrationPayload(formData) {
  const data = Object.fromEntries(formData.entries());
  delete data.newsletter;
  delete data.termos;
  if (data.tipo_conta !== 'Freelancer') delete data.area_atuacao;
  data.cpf = cpfDigits(data.cpf);
  data.tipoConta = data.tipo_conta;
  data.areaAtuacao = data.area_atuacao;
  return data;
}
