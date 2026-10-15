import { apiRequest } from './apiClient.js';

export function serviceFormPayload(form, editing = false, byContact = false) {
  const body = form instanceof FormData ? form : new FormData(form);
  if (body.get('genero_id') && !body.get('categoriaId'))
    body.append('categoriaId', body.get('genero_id'));
  body.set('precoNegociavel', 'false');
  if (editing) body.set('valorCombinar', byContact ? 'true' : 'false');
  return body;
}
export function saveService(body, id) {
  return apiRequest(id ? `/api/servicos/${id}` : '/api/servicos', {
    method: id ? 'PUT' : 'POST',
    body
  });
}
