import { apiRequest } from '../../../shared/http/api-client';
import type {
  PatientDetailResponse,
  PatientsListResponse,
} from '../../../shared/types/contracts';

interface PatientsListQuery {
  page: number;
  pageSize: number;
  search: string;
}

export function fetchPatients(
  token: string,
  query: PatientsListQuery,
) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.search.trim()) {
    params.set('search', query.search.trim());
  }

  return apiRequest<PatientsListResponse>(`/patients?${params.toString()}`, {
    token,
  });
}

export function fetchPatientDetail(token: string, patientId: string) {
  return apiRequest<PatientDetailResponse>(`/patients/${patientId}`, { token });
}
