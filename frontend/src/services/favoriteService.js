import { apiRequest } from './apiClient.js';
export async function myFavorites() {
  return (await apiRequest('/api/favoritos')).dados || [];
}
