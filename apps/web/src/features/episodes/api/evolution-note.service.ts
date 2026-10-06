import { apiRequest } from '../../../shared/http/api-client';
import type { MedicationOrderItem } from './clinical-history.service';

export type { MedicationOrderItem };

export type ClinicalDocumentStatus = 'DRAFT' | 'FINALIZED';

export interface EvolutionDiagnosisItem {
  code?: string;
  description?: string;
  status?: string;
  linkedProblemId?: string;
}

export interface EvolutionNoteVersion {
  id: string;
  evolutionNoteId: string;
  versionNumber: number;
  status: ClinicalDocumentStatus;
  previousVersionId: string | null;
  recordedAt: string;
  finalizedAt: string | null;
  bodyMassIndex?: number | null;

  clinicalStatus: string | null;
  complications: string | null;

  subjective: string | null;

  vitalSystolicBp: number | null;
  vitalDiastolicBp: number | null;
  vitalHeartRate: number | null;
  vitalRespiratoryRate: number | null;
  vitalTemperatureC: number | null;
  vitalOxygenSaturation: number | null;
  vitalWeightKg: number | null;
  vitalHeightCm: number | null;
  vitalCapillaryGlucose: number | null;
  vitalEva: number | null;

  objectiveFindings: string | null;
  recentResults: string | null;

  primaryDiagnosisCode: string | null;
  primaryDiagnosisDescription: string | null;
  primaryDiagnosisStatus: string | null;
  primaryDiagnosisLinkedProblemId: string | null;
  secondaryDiagnosesJson: EvolutionDiagnosisItem[] | null;

  prognosisStatus: string | null;
  prognosisDetail: string | null;
  treatmentChangeType: string | null;
  treatmentNotes: string | null;
  proposedMedicationsJson: MedicationOrderItem[] | null;
  plannedStudies: string | null;
  plannedConsultations: string | null;
  followUpNotes: string | null;
  nextAssessmentDate: string | null;

  consentCurrent: boolean;
  informationProvided: string | null;

  trend: string | null;
  comparativeAnalysis: string | null;

  pharmacologicalResponse: string | null;
  adverseEvents: string | null;
  clinicalJustification: string | null;

  glasgowOcular: number | null;
  glasgowVerbal: number | null;
  glasgowMotor: number | null;
  cardiovascularRisk: string | null;
  karnofskyScore: number | null;
  otherScaleName: string | null;
  otherScaleResult: string | null;

  [key: string]: unknown;
}

export interface EvolutionNoteSummary {
  id: string;
  encounterId: string;
  noteNumber: number;
  versions: EvolutionNoteVersion[];
}

export interface PreviousEvolution {
  noteNumber: number;
  recordedAt: string;
  clinicalStatus: string | null;
}

export interface EvolutionNoteListResponse {
  notes: EvolutionNoteSummary[];
}

export interface EvolutionNoteDetailResponse {
  note: { id: string; encounterId: string; noteNumber: number };
  versions: EvolutionNoteVersion[];
  previousEvolution: PreviousEvolution | null;
}

export function fetchEvolutionNotes(token: string, encounterNumber: string) {
  return apiRequest<EvolutionNoteListResponse>(
    `/encounters/${encounterNumber}/evolution-notes`,
    { token },
  );
}

export function fetchEvolutionNoteDetail(
  token: string,
  encounterNumber: string,
  noteId: string,
) {
  return apiRequest<EvolutionNoteDetailResponse>(
    `/encounters/${encounterNumber}/evolution-notes/${noteId}`,
    { token },
  );
}

export function createEvolutionNote(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<EvolutionNoteVersion>(
    `/encounters/${encounterNumber}/evolution-notes`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function saveEvolutionNoteDraft(
  token: string,
  encounterNumber: string,
  noteId: string,
  body: Record<string, unknown>,
) {
  return apiRequest<EvolutionNoteVersion>(
    `/encounters/${encounterNumber}/evolution-notes/${noteId}/draft`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function finalizeEvolutionNote(
  token: string,
  encounterNumber: string,
  noteId: string,
) {
  return apiRequest<EvolutionNoteVersion>(
    `/encounters/${encounterNumber}/evolution-notes/${noteId}/finalize`,
    { method: 'POST', token },
  );
}

export function createEvolutionNoteNewVersion(
  token: string,
  encounterNumber: string,
  noteId: string,
  body: Record<string, unknown>,
) {
  return apiRequest<EvolutionNoteVersion>(
    `/encounters/${encounterNumber}/evolution-notes/${noteId}/new-version`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}
