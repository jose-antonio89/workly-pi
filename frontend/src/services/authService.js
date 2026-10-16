import { apiRequest } from './apiClient.js';

// Reused selectively from the local migration; response aliases match login.js.
export async function login({ email, senha }) {
  const response = await apiRequest('/api/autenticacao/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  const payload = response?.dados || response;
  return {
    token: payload?.token || response?.token,
    user: normalizarUsuario(
      payload?.user || response?.user || payload?.usuario || response?.usuario
    ),
    mensagem: response?.mensagem || 'Login realizado com sucesso.'
  };
}

export function cadastrar(dados) {
  return apiRequest('/api/autenticacao/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
}

// password recovery: the API never returns the token or link, only a neutral message
// (or 503 while recovery is unavailable).
export function requestPasswordReset(email) {
  return apiRequest('/api/autenticacao/recuperar-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export function resetPassword({ token, novaSenha, confirmarSenha }) {
  return apiRequest('/api/autenticacao/redefinir-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, novaSenha, confirmarSenha })
  });
}

// The reset link carries the token in the fragment (#token=...), which browsers never send to servers or in
// Referer. On first read the token moves to memory and is removed from the address bar (and history entry).
// A legacy ?token= query is accepted and removed the same way. Calling again returns the same token,
// so React's double render in development does not lose it; the page clears it on unmount.
let pendingResetToken = '';
export function takeResetToken(win = window) {
  const { pathname, search, hash } = win.location;
  const query = new URLSearchParams(search);
  const found = new URLSearchParams(hash.replace(/^#/, '')).get('token') || query.get('token');
  if (found) {
    pendingResetToken = found;
    query.delete('token');
    const rest = query.toString();
    win.history.replaceState(win.history.state, '', pathname + (rest ? `?${rest}` : ''));
  }
  return pendingResetToken;
}
export function clearResetToken() {
  pendingResetToken = '';
}

// mirrors the server rule (8 to 128 characters); the server has the final say.
export function newPasswordProblem(senha, confirmacao) {
  if (!senha) return 'Informe a nova senha.';
  if (senha.length < 8) return 'A nova senha deve ter pelo menos 8 caracteres.';
  if (senha.length > 128) return 'A nova senha deve ter no máximo 128 caracteres.';
  if (senha !== confirmacao) return 'A confirmação da senha não confere.';
  return '';
}

export function obterToken() {
  return localStorage.getItem('token');
}

export function normalizarUsuario(user) {
  if (!user) return null;
  return {
    ...user,
    idUsuario: user.idUsuario || user.id_usuario || '',
    tipoConta: user.tipoConta || user.tipo_conta || '',
    areaAtuacao: user.areaAtuacao || user.area_atuacao || '',
    fotoPerfil: user.fotoPerfil || user.foto_perfil || '/assets/img/perfis/perfil_padrao.svg',
    tituloProfissional: user.tituloProfissional || user.professional_title || '',
    localizacao: user.localizacao || user.location || '',
    site: user.site || user.website || ''
  };
}

export function obterUsuario() {
  try {
    return normalizarUsuario(JSON.parse(localStorage.getItem('user')));
  } catch {
    return null;
  }
}

export function salvarSessao({ token, user }) {
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(normalizarUsuario(user)));
}

export function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function buscarUsuarioAtual(force = false) {
  if (!obterToken()) return null;
  const stored = obterUsuario();
  if (!force && stored) return stored;
  try {
    const response = await apiRequest('/api/usuarios/perfil');
    const user = normalizarUsuario(response.user || response.dados?.user);
    salvarSessao({ user });
    return user;
  } catch (error) {
    if (error.status === 401) limparSessao();
    return obterUsuario();
  }
}
