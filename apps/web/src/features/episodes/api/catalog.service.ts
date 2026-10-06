import { apiRequest } from '../../../shared/http/api-client';

export interface Icd10CatalogEntry {
  id: string;
  code: string;
  description: string;
  chapter: string | null;
}

export interface MedicationCatalogEntry {
  id: string;
  name: string;
  activeIngredient: string | null;
  presentation: string | null;
  defaultRoute: string | null;
}

export function searchIcd10(token: string, query: string) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  return apiRequest<Icd10CatalogEntry[]>(`/catalog/cie10?${params.toString()}`, { token });
}

export function searchMedicationCatalog(token: string, query: string) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  return apiRequest<MedicationCatalogEntry[]>(`/catalog/medications?${params.toString()}`, { token });
}
