import { apiRequest } from '../../../shared/http/api-client';

export interface PriorStudyItem {
  id?: string;
  studyType?: string;
  name?: string;
  date?: string;
  result?: string;
  interpretation?: string;
}

export interface MedicationOrderItem {
  id?: string;
  medication?: string;
  dose?: number;
  unit?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  indication?: string;
  notes?: string;
}

export interface DiagnosisItem {
  code?: string;
  description?: string;
  diagnosisType?: string;
  status?: string;
}

export type ClinicalDocumentStatus = 'DRAFT' | 'FINALIZED';

export interface ClinicalHistoryVersion {
  id: string;
  clinicalHistoryId: string;
  versionNumber: number;
  status: ClinicalDocumentStatus;
  previousVersionId: string | null;
  recordedAt: string;
  finalizedAt: string | null;
  currentIllness: string | null;
  familyHistoryDiabetes: boolean;
  familyHistoryHypertension: boolean;
  familyHistoryCancer: boolean;
  familyHistoryHeartDisease: boolean;
  familyHistoryStroke: boolean;
  familyHistoryKidneyDisease: boolean;
  familyHistoryAutoimmune: boolean;
  familyHistoryPsychiatric: boolean;
  familyHistoryOther: boolean;
  familyHistoryOtherDetail: string | null;
  familyHistoryNotes: string | null;
  allergiesSnapshotJson: Array<{ substance: string; reaction: string | null; severity: string | null }> | null;
  allergiesStatus: string | null;
  vitalTemperatureC: number | null;
  vitalSystolicBp: number | null;
  vitalDiastolicBp: number | null;
  vitalHeartRate: number | null;
  vitalRespiratoryRate: number | null;
  vitalWeightKg: number | null;
  vitalHeightCm: number | null;
  primaryDiagnosisCode: string | null;
  primaryDiagnosisDescription: string | null;
  primaryDiagnosisType: string | null;
  secondaryDiagnosesJson: DiagnosisItem[] | null;
  priorStudiesJson: PriorStudyItem[] | null;
  priorStudiesSummary: string | null;
  currentTreatmentMedicationsJson: MedicationOrderItem[] | null;
  chronicMedicationsJson: MedicationOrderItem[] | null;
  nonPharmacologicalTreatment: string | null;
  followUpPlan: string | null;
  prognosis: string | null;
  [key: string]: unknown;
}

export interface ClinicalHistoryDetailResponse {
  clinicalHistory: { id: string; encounterId: string } | null;
  versions: ClinicalHistoryVersion[];
}

export function fetchClinicalHistory(token: string, encounterNumber: string) {
  return apiRequest<ClinicalHistoryDetailResponse>(
    `/encounters/${encounterNumber}/clinical-history`,
    { token },
  );
}

export function saveClinicalHistoryDraft(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ClinicalHistoryVersion>(
    `/encounters/${encounterNumber}/clinical-history/draft`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function finalizeClinicalHistory(token: string, encounterNumber: string) {
  return apiRequest<ClinicalHistoryVersion>(
    `/encounters/${encounterNumber}/clinical-history/finalize`,
    { method: 'POST', token },
  );
}

export function createClinicalHistoryNewVersion(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ClinicalHistoryVersion>(
    `/encounters/${encounterNumber}/clinical-history/new-version`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}
