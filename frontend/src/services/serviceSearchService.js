import { apiRequest } from './apiClient.js';
import { categories, servicePagePayload } from './catalogService.js';

export function servicePageNumber(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}

export function readServiceFilters(params) {
  const select = (value, choices) => (choices.includes(value) ? value : '');
  return {
    page: servicePageNumber(params.get('page')),
    q: (params.get('q') || params.get('busca') || '').trim(),
    categoria: select(
      params.get('id_categoria') || params.get('id') || params.get('categoria') || '',
      categories.map((item) => item.id)
    ),
    min: params.get('min') || params.get('precoMin') || '',
    max: params.get('max') || params.get('precoMax') || '',
    avaliacaoMin: select(params.get('avaliacaoMin') || '', ['4.5', '4', '3']),
    ordenar: select(params.get('ordenar') || 'recentes', [
      'recentes',
      'preco_asc',
      'preco_desc',
      'avaliacao'
    ])
  };
}

export function serviceSearchParams(filters) {
  const params = new URLSearchParams();
  for (const key of ['q', 'categoria', 'min', 'max', 'avaliacaoMin', 'ordenar']) {
    const value = key === 'q' ? filters.q.trim() : filters[key];
    if (value) params.set(key, value);
  }
  params.set('page', String(servicePageNumber(filters.page)));
  params.set('limit', '24');
  return params;
}

export function serviceSearchTitle(filters, originalParams) {
  const term = (filters.q || originalParams.get('q') || originalParams.get('busca') || '').trim();
  const id =
    filters.categoria ||
    originalParams.get('id_categoria') ||
    originalParams.get('id') ||
    originalParams.get('categoria');
  const category = categories.find((item) => item.id === id);
  if (term)
    return {
      heading: `Resultados para "${term}"${id ? ` em ${category?.label || 'categoria'}` : ''}`,
      title: 'Workly - Busca'
    };
  if (id)
    return {
      heading: category ? `Serviços de ${category.label}` : '',
      title: category ? `Workly - ${category.name}` : 'Workly - Categoria'
    };
  return { heading: 'Todos os Serviços', title: 'Workly - Todos os Serviços' };
}

export async function searchServices(filters, options = {}) {
  return (await searchServicePage(filters, options)).services;
}
export async function searchServicePage(filters, options = {}) {
  const response = await apiRequest(`/api/servicos?${serviceSearchParams(filters)}`, options);
  return servicePagePayload(response);
}
