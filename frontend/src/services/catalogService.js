import { apiRequest } from './apiClient.js';

export const defaultServiceImage = '/assets/img/servicos/servico_padrao.svg';
export const defaultProfileImage = '/assets/img/perfis/perfil_padrao.svg';
export const categories = [
  {
    id: '1',
    name: 'Design',
    icon: 'fa-paint-brush',
    description: 'Serviços criativos para identidade visual, interfaces e mais.'
  },
  {
    id: '2',
    name: 'Programação',
    icon: 'fa-code',
    description: 'Desenvolvimento web, mobile, automações e sistemas.'
  },
  {
    id: '3',
    name: 'Video/Edição',
    navName: 'Vídeo/Edição',
    icon: 'fa-film',
    description: 'Edição de vídeos, motion e conteúdo audiovisual.'
  },
  {
    id: '4',
    name: 'Inteligência Artificial',
    icon: 'fa-wifi',
    description: 'Soluções com IA, automação e modelos inteligentes.'
  },
  {
    id: '5',
    name: 'Tradução/Escritor',
    icon: 'fa-book',
    description: 'Textos, revisão, copy e tradução profissional.'
  },
  {
    id: '6',
    name: 'Fotografia',
    icon: 'fa-camera',
    description: 'Ensaios, tratamento de imagem e cobertura visual.'
  },
  {
    id: '7',
    name: 'Áudio/Música',
    icon: 'fa-headphones',
    description: 'Produção sonora, mixagem, locução e trilhas.'
  }
];

export function normalizeService(service) {
  if (!service) return null;
  return {
    ...service,
    idServico: service.idServico || service.id_servico || service.id,
    imagemServico: service.imagemServico || service.imagem_servico || defaultServiceImage,
    categoriaId: service.categoriaId || service.genero_id || null,
    nomeCategoria: service.nomeCategoria || service.nome_genero || '',
    idUsuario: service.idUsuario || service.id_usuario || null,
    nomeFreelancer: service.nomeFreelancer || service.nome_freelancer || '',
    fotoPerfil: service.fotoPerfil || service.foto_perfil || defaultProfileImage,
    precoNegociavel: false,
    valorCombinar: Boolean(service.valorCombinar || service.valor_combinar),
    avaliacaoMediaServico: Number(
      service.avaliacaoMediaServico ??
        service.avaliacao_media_servico ??
        service.mediaAvaliacoes ??
        0
    ),
    totalAvaliacoesServico: Number(
      service.totalAvaliacoesServico ??
        service.total_avaliacoes_servico ??
        service.totalAvaliacoes ??
        0
    ),
    createdAt: service.createdAt || service.created_at || null,
    updatedAt: service.updatedAt || service.updated_at || null
  };
}

export const formatCurrency = (value) =>
  `R$ ${Number(value || 0)
    .toFixed(2)
    .replace('.', ',')}`;
export function serviceDate(service, fallback = '--/--/----') {
  const value = service?.createdAt || service?.created_at;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('pt-BR') : fallback;
}
export function isNewToday(service, now = new Date()) {
  const value = service?.createdAt || service?.created_at;
  const date = value ? new Date(value) : null;
  return Boolean(
    date &&
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
export function serviceRating(service) {
  const normalized = normalizeService(service);
  const media = Number(normalized?.avaliacaoMediaServico || 0),
    total = Number(normalized?.totalAvaliacoesServico || 0);
  return total > 0 && media > 0
    ? `${media.toFixed(1).replace('.', ',')} (${total})`
    : 'Sem avaliações';
}
export function serviceSummary(description, seller, category) {
  const text = String(description || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text && !text.startsWith('O freelancer ainda'))
    return text.length > 170 ? `${text.slice(0, 167).trim()}...` : text;
  return `${seller} publicou este serviço na categoria ${category}. Confira a descrição e combine os detalhes antes de contratar.`;
}

export async function featuredServices(options = {}) {
  const response = await apiRequest('/api/servicos?avaliacaoMin=4.5&ordenar=recentes', options);
  return (response.dados || []).map(normalizeService).slice(0, 6);
}
export async function categoryServices(id, options = {}) {
  const response = await apiRequest(`/api/servicos/categoria/${id}`, options);
  return (response.dados || []).map(normalizeService);
}
export async function serviceDetail(id, options = {}) {
  const response = await apiRequest(`/api/servicos/${id}`, options);
  const raw = response.dados || response;
  return { raw, service: normalizeService(raw) };
}
export async function favoriteStatus(id) {
  const response = await apiRequest(`/api/favoritos/servico/${id}`);
  return Boolean((response.dados || response).favoritado);
}
export function updateFavorite(id, saved) {
  return saved
    ? apiRequest(`/api/favoritos/servico/${id}`, { method: 'DELETE' })
    : apiRequest('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId: id })
      });
}
