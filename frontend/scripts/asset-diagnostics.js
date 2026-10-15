export const defaultAvatarPath = '/uploads/perfis/perfil_padrao.svg';

export function assetStatusError(url, status) {
  if (status !== 404) return null;
  if (new URL(url).pathname === defaultAvatarPath) {
    return `DEPENDENCIA DE AMBIENTE: ${url} retornou 404. Falta o avatar gerado pelo seed em backend${defaultAvatarPath}; preparar o arquivo exato sem executar o seed completo.`;
  }
  return `Asset retornou 404: ${url}`;
}

export function isAssetRequest(request) {
  return ['image', 'stylesheet', 'script', 'font', 'media'].includes(request.resourceType());
}
