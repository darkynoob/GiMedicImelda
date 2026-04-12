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
  patientStatus?: string;
  sexAtBirth?: string;
  allergiesFilter?: string;
}

export function fetchPatients(token: string, query: PatientsListQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.search.trim()) {
    params.set('search', query.search.trim());
  }

  if (query.patientStatus?.trim()) {
    params.set('patientStatus', query.patientStatus.trim());
  }

  if (query.sexAtBirth?.trim()) {
    params.set('sexAtBirth', query.sexAtBirth.trim());
  }

  if (query.allergiesFilter?.trim()) {
    params.set('allergiesFilter', query.allergiesFilter.trim());
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

export function uploadPatientAttachments(
  token: string,
  patientId: string,
  files: File[],
) {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  return apiRequest<
    Array<{
      id: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: string;
      uploadedAt: string;
    }>
  >(`/patients/${patientId}/attachments`, {
    method: 'POST',
    token,
    body: formData,
  });
}

export function deletePatientAttachment(
  token: string,
  patientId: string,
  attachmentId: string,
) {
  return apiRequest<{ success: boolean }>(
    `/patients/${patientId}/attachments/${attachmentId}`,
    {
      method: 'DELETE',
      token,
    },
  );
}
