import { apiRequest } from '../../../shared/http/api-client';
import type {
  CreatePatientRequest,
  PatientDetailResponse,
  PatientsListResponse,
  UpdatePatientRequest,
} from '../../../shared/types/contracts';

interface PatientsListQuery {
  page: number;
  pageSize: number;
  search: string;
}

export function fetchPatients(token: string, query: PatientsListQuery) {
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

export function createPatient(token: string, input: CreatePatientRequest) {
  return apiRequest<PatientDetailResponse>('/patients', {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

export function updatePatient(
  token: string,
  patientId: string,
  input: UpdatePatientRequest,
) {
  return apiRequest<PatientDetailResponse>(`/patients/${patientId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(input),
  });
}
