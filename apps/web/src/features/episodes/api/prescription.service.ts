import { apiRequest } from '../../../shared/http/api-client';
import type { DiagnosisItem } from './clinical-history.service';

export type { DiagnosisItem };

export type ClinicalDocumentStatus = 'DRAFT' | 'FINALIZED';

export interface PrescriptionMedicationItem {
  id?: string;
  medication?: string;
  activeIngredient?: string;
  presentation?: string;
  doseQuantity?: number;
  doseUnit?: string;
  route?: string;
  routeDetail?: string;
  frequencyPreset?: string;
  intervalHours?: number;
  durationValue?: number;
  durationUnit?: string;
  medicationType?: string;
  instructions?: string;
  warnings?: string;
}

export interface WarningSignItem {
  sign?: string;
  severity?: string;
}

export interface EducationalMaterialItem {
  title?: string;
  type?: string;
  attachmentId?: string;
}

export interface AllergyValidationMatch {
  medication: string;
  substance: string;
}

export interface DuplicateTherapyGroup {
  key: string;
  names: string[];
}

export interface PrescriptionVersion {
  id: string;
  prescriptionId: string;
  versionNumber: number;
  status: ClinicalDocumentStatus;
  previousVersionId: string | null;
  recordedAt: string;
  finalizedAt: string | null;
  verificationCode: string | null;

  prescriptionType: string;
  validityOption: string | null;
  validityExpiresAt: string | null;

  primaryDiagnosisCode: string | null;
  primaryDiagnosisDescription: string | null;
  secondaryDiagnosesJson: DiagnosisItem[] | null;

  generalInstructions: string | null;
  medicationsJson: PrescriptionMedicationItem[] | null;

  allergyValidationStatus: string | null;
  allergyValidationDetailJson: AllergyValidationMatch[] | null;
  duplicateTherapyValidationStatus: string | null;
  duplicateTherapyDetailJson: DuplicateTherapyGroup[] | null;
  interactionValidationStatus: string | null;
  criticalAlertAcknowledged: boolean;
  criticalAlertJustification: string | null;

  warningSignsJson: WarningSignItem[] | null;

  nextAppointmentDate: string | null;

  educationInfoProvided: string | null;
  educationNonPharmacological: string | null;
  patientComprehension: string | null;
  educationalMaterialsJson: EducationalMaterialItem[] | null;

  followUpType: string | null;
  followUpInstructions: string | null;

  officialPdfAvailableAt: string | null;
  downloadCount: number;

  [key: string]: unknown;
}

export interface PrescriptionSummary {
  id: string;
  encounterId: string;
  prescriptionNumber: number;
  folio: string;
  versions: PrescriptionVersion[];
}

export interface PrescriptionListResponse {
  prescriptions: PrescriptionSummary[];
}

export function fetchPrescriptions(token: string, encounterNumber: string) {
  return apiRequest<PrescriptionListResponse>(
    `/encounters/${encounterNumber}/prescriptions`,
    { token },
  );
}

export function createPrescription(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<PrescriptionVersion>(`/encounters/${encounterNumber}/prescriptions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

export function savePrescriptionDraft(
  token: string,
  encounterNumber: string,
  prescriptionId: string,
  body: Record<string, unknown>,
) {
  return apiRequest<PrescriptionVersion>(
    `/encounters/${encounterNumber}/prescriptions/${prescriptionId}/draft`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function finalizePrescription(
  token: string,
  encounterNumber: string,
  prescriptionId: string,
) {
  return apiRequest<PrescriptionVersion>(
    `/encounters/${encounterNumber}/prescriptions/${prescriptionId}/finalize`,
    { method: 'POST', token },
  );
}

export function createPrescriptionNewVersion(
  token: string,
  encounterNumber: string,
  prescriptionId: string,
  body: Record<string, unknown>,
) {
  return apiRequest<PrescriptionVersion>(
    `/encounters/${encounterNumber}/prescriptions/${prescriptionId}/new-version`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function registerPrescriptionDownload(
  token: string,
  encounterNumber: string,
  prescriptionId: string,
  versionId: string,
) {
  return apiRequest<PrescriptionVersion>(
    `/encounters/${encounterNumber}/prescriptions/${prescriptionId}/versions/${versionId}/download`,
    { method: 'POST', token },
  );
}
