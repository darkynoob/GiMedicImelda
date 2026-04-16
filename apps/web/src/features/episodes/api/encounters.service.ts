import { apiRequest } from '../../../shared/http/api-client';
import type {
  CreateEncounterRequest,
  EncounterDetailResponse,
  EncounterMetaResponse,
  EncountersListResponse,
  UpdateEncounterRequest,
} from '../../../shared/types/contracts';

export interface EncountersListQuery {
  page: number;
  pageSize: number;
  search: string;
  encounterType?: string;
  status?: string;
  admissionSource?: string;
  facilityId?: string;
  patientId?: string;
}

export function fetchEncounters(token: string, query: EncountersListQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.encounterType?.trim()) {
    params.set('encounterType', query.encounterType.trim());
  }
  if (query.status?.trim()) params.set('status', query.status.trim());
  if (query.admissionSource?.trim()) {
    params.set('admissionSource', query.admissionSource.trim());
  }
  if (query.facilityId?.trim()) params.set('facilityId', query.facilityId.trim());
  if (query.patientId?.trim()) params.set('patientId', query.patientId.trim());

  return apiRequest<EncountersListResponse>(`/encounters?${params.toString()}`, {
    token,
  });
}

export function fetchEncounterMeta(token: string) {
  return apiRequest<EncounterMetaResponse>('/encounters/meta', { token });
}

export function fetchEncounterDetail(token: string, encounterNumber: string) {
  return apiRequest<EncounterDetailResponse>(`/encounters/${encounterNumber}`, {
    token,
  });
}

export function createEncounter(token: string, input: CreateEncounterRequest) {
  return apiRequest<EncounterDetailResponse>('/encounters', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updateEncounter(
  token: string,
  encounterNumber: string,
  input: UpdateEncounterRequest,
) {
  return apiRequest<EncounterDetailResponse>(`/encounters/${encounterNumber}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}
