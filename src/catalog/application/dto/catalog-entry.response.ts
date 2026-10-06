export interface IcdCatalogEntryResponse {
  id: string;
  code: string;
  description: string;
  chapter: string | null;
}

export interface MedicationCatalogEntryResponse {
  id: string;
  name: string;
  activeIngredient: string | null;
  presentation: string | null;
  defaultRoute: string | null;
}
