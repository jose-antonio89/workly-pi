import { apiRequest } from './apiClient.js';
import { normalizarUsuario, salvarSessao } from './authService.js';
import { normalizeService } from './catalogService.js';

export function profilePayload(response) {
  const value = response.dados || response;
  return {
    user: normalizarUsuario(response.user || value.user),
    services: (response.services || value.services || []).map(normalizeService),
    reviews: response.reviews || value.reviews || [],
    reviewSummary: response.reviewSummary || value.reviewSummary || {},
    leads: response.leads || value.leads || [],
    dashboard: response.dashboard || value.dashboard || {}
  };
}

export async function readProfile(id) {
  const result = profilePayload(
    await apiRequest(id ? `/api/usuarios/publico/${id}` : '/api/usuarios/perfil')
  );
  if (!id) salvarSessao({ user: result.user });
  return result;
}

async function mutate(path, method, data) {
  const response = await apiRequest(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (response.user) salvarSessao({ user: response.user });
  return response;
}
export const updateProfile = (data) => mutate('/api/usuarios/perfil', 'PUT', data);
export const updateAccountType = (data) => mutate('/api/usuarios/tipo-conta', 'PATCH', data);
export const updatePassword = (data) => mutate('/api/usuarios/perfil/senha', 'PUT', data);
export const deleteAccount = () => apiRequest('/api/usuarios/perfil', { method: 'DELETE' });
export async function uploadPhoto(blob) {
  const body = new FormData();
  body.append('nova_foto', blob, 'foto-perfil.webp');
  const result = await apiRequest('/api/usuarios/perfil/foto', { method: 'POST', body });
  if (result.user) salvarSessao({ user: result.user });
  return result;
}
