// lê um limite numérico de configuração. Só aceita texto com dígitos que forme um inteiro positivo seguro;
// qualquer outra coisa (Infinity, 1e309, 0, negativos, decimais, texto vazio ou ausente) usa o padrão,
// para um valor malformado nunca deixar a proteção ilimitada ou desligada.
function lerLimitePositivo(bruto, padrao) {
  const texto = typeof bruto === 'string' ? bruto.trim() : '';
  if (!/^\d+$/.test(texto)) return padrao;
  const valor = Number(texto);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : padrao;
}

module.exports = { lerLimitePositivo };
