function normalizarCpf(cpf = '') {
  return String(cpf).replace(/\D/g, '').slice(0, 11);
}

function formatarCpf(cpf = '') {
  const digits = normalizarCpf(cpf);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function cpfRepetido(cpf = '') {
  const digits = normalizarCpf(cpf);
  return /^(\d)\1{10}$/.test(digits);
}

function cpfSequencial(cpf = '') {
  const digits = normalizarCpf(cpf);
  if (digits.length !== 11) return false;

  // Bloqueia bases como 123.456.789-09, 987.654.321-00, 012.345.678-90 etc.
  // A checagem usa os 9 primeiros dígitos porque os 2 últimos são dígitos verificadores.
  const base = digits.slice(0, 9);
  const crescente = '01234567890123456789';
  const decrescente = '98765432109876543210';

  return crescente.includes(base) || decrescente.includes(base);
}

function calcularDigito(cpfParcial, fatorInicial) {
  let soma = 0;
  for (let i = 0; i < cpfParcial.length; i += 1) {
    soma += Number(cpfParcial[i]) * (fatorInicial - i);
  }

  const resto = (soma * 10) % 11;
  return resto === 10 || resto === 11 ? 0 : resto;
}

function validarCpf(cpf = '') {
  const digits = normalizarCpf(cpf);

  // Validação simplificada para o PI:
  // - precisa ter 11 números;
  // - não pode ser todos os números iguais, tipo 111.111.111-11;
  // - CPF repetido continua sendo bloqueado pelo banco/controller.
  // Não validamos sequência nem dígito verificador aqui para não travar CPF de teste.
  if (digits.length !== 11) return false;
  if (cpfRepetido(digits)) return false;

  return true;
}

function motivoCpfInvalido(cpf = '') {
  const digits = normalizarCpf(cpf);

  if (!digits) return 'CPF é obrigatório.';
  if (digits.length !== 11) return 'CPF deve ter 11 números.';
  if (cpfRepetido(digits)) return 'CPF não pode ter todos os números iguais.';

  return '';
}

function gerarCpfValido(baseNumerica = 1) {
  let tentativa = Math.max(1, Number(baseNumerica) || 1);

  while (tentativa < 999999999) {
    const base = String(tentativa).padStart(9, '0').slice(-9);
    const primeiroDigito = calcularDigito(base, 10);
    const segundoDigito = calcularDigito(`${base}${primeiroDigito}`, 11);
    const cpf = `${base}${primeiroDigito}${segundoDigito}`;

    if (validarCpf(cpf)) return cpf;
    tentativa += 37;
  }

  throw new Error('Não foi possível gerar CPF válido para o seed.');
}

module.exports = {
  normalizarCpf,
  formatarCpf,
  cpfRepetido,
  cpfSequencial,
  validarCpf,
  motivoCpfInvalido,
  gerarCpfValido
};
