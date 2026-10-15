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
