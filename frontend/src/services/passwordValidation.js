export function newPasswordProblem(senha, confirmacao = senha) {
  if (typeof senha !== 'string' || !senha) return 'Informe a nova senha.';
  if (senha.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.';
  if (senha.length > 128) return 'A nova senha deve ter no máximo 128 caracteres.';
  if (new TextEncoder().encode(senha).length > 72)
    return 'A senha deve ter no máximo 72 bytes (acentos e emojis podem ocupar mais de um byte).';
  if (senha !== confirmacao) return 'A confirmação da senha não confere.';
  return '';
}
