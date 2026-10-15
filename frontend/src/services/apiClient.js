const API_BASE_URL = String(import.meta.env?.VITE_API_URL || '').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data?.mensagem ||
      data?.message ||
      (typeof data === 'string' ? data : 'Erro na requisi\u00e7\u00e3o.');
    const isSessionFailure =
      response.status === 401 &&
      token &&
      (path === '/api/usuarios/perfil' || /token/i.test(message));
    if (isSessionFailure && localStorage.getItem('token') === token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('workly:session-expired'));
    }
    const error = new Error(message);
    error.status = response.status;
    error.response = response;
    error.data = data;
    throw error;
  }
  return data;
}
