import { apiRequest } from '../../../shared/http/api-client';
import type { DiagnosisItem, MedicationOrderItem } from './clinical-history.service';

export type { DiagnosisItem, MedicationOrderItem };

export type ClinicalDocumentStatus = 'DRAFT' | 'FINALIZED';

export interface ReferenceAllergy {
  id: string;
  substance: string;
  reaction: string | null;
  severity: string | null;
  status: string | null;
}

export interface ReferenceChronicMedication {
  id: string;
  medicationName: string;
  dose: string | null;
  [key: string]: unknown;
}

export interface ConsultationReferenceContext {
  allergies: ReferenceAllergy[];
  chronicMedications: ReferenceChronicMedication[];
}

export interface ConsultationNoteVersion {
  id: string;
  consultationNoteId: string;
  versionNumber: number;
  status: ClinicalDocumentStatus;
  previousVersionId: string | null;
  recordedAt: string;
  finalizedAt: string | null;
  bodyMassIndex: number | null;

  chiefComplaint: string | null;
  secondaryComplaint: string | null;
  evolutionTimeValue: number | null;
  evolutionTimeUnit: string | null;

  currentIllnessOnsetDate: string | null;
  currentIllnessEvolutionType: string | null;
  currentIllnessDescription: string | null;
  currentIllnessEvaIntensity: number | null;
  currentIllnessLocation: string | null;
  currentIllnessIrradiation: string | null;
  currentIllnessAssociatedSymptoms: string | null;
  currentIllnessAggravatingFactors: string | null;
  currentIllnessRelievingFactors: string | null;
  currentIllnessPriorTreatments: string | null;

  vitalSystolicBp: number | null;
  vitalDiastolicBp: number | null;
  vitalHeartRate: number | null;
  vitalRespiratoryRate: number | null;
  vitalTemperatureC: number | null;
  vitalOxygenSaturation: number | null;
  vitalWeightKg: number | null;
  vitalHeightCm: number | null;
  vitalEva: number | null;
  vitalGlucose: number | null;
  vitalIrregularRhythm: boolean;

  examGeneralState: string | null;
  examHeadStatus: string | null;
  examHeadDetail: string | null;
  examNeckStatus: string | null;
  examNeckDetail: string | null;
  examCardiovascularStatus: string | null;
  examCardiovascularDetail: string | null;
  examRespiratoryStatus: string | null;
  examRespiratoryDetail: string | null;
  examAbdomenStatus: string | null;
  examAbdomenDetail: string | null;
  examGenitourinaryStatus: string | null;
  examGenitourinaryDetail: string | null;
  examExtremitiesStatus: string | null;
  examExtremitiesDetail: string | null;
  examNeurologicalStatus: string | null;
  examNeurologicalDetail: string | null;
  examSkinStatus: string | null;
  examSkinDetail: string | null;
  examLymphaticStatus: string | null;
  examLymphaticDetail: string | null;

  priorResultsSummary: string | null;

  primaryDiagnosisCode: string | null;
  primaryDiagnosisDescription: string | null;
  primaryDiagnosisType: string | null;
  primaryDiagnosisStatus: string | null;
  secondaryDiagnosesJson: DiagnosisItem[] | null;

  pharmacologicalTreatmentJson: MedicationOrderItem[] | null;
  nonPharmacologicalTreatment: string | null;
  plannedStudies: string | null;
  plannedReferrals: string | null;
  plannedConsultations: string | null;
  disabilityDays: number | null;
  disabilityFrom: string | null;
  disabilityTo: string | null;
  disabilityReason: string | null;
  prognosis: string | null;
  followUpDate: string | null;

  consentCurrent: boolean;
  consentExplanation: string | null;
  consentComprehension: string | null;

  riskSuddenSevereHeadache: boolean;
  riskFocalNeuroDeficit: boolean;
  riskVisionLoss: boolean;
  riskChestPain: boolean;
  riskDyspnea: boolean;
  riskHighFever: boolean;
  riskUnexplainedWeightLoss: boolean;
  riskActiveBleeding: boolean;
  riskAlteredConsciousness: boolean;
  riskFindingsNotes: string | null;

  functionalCapacity: string | null;
  functionalImpact: string | null;
  functionalDescription: string | null;

  pharmacologicalAdherence: string | null;
  nonPharmacologicalAdherence: string | null;
  adherenceNotes: string | null;

  [key: string]: unknown;
}

export interface ConsultationNoteDetailResponse {
  consultationNote: { id: string; encounterId: string } | null;
  versions: ConsultationNoteVersion[];
  referenceContext: ConsultationReferenceContext;
}

export function fetchConsultationNote(token: string, encounterNumber: string) {
  return apiRequest<ConsultationNoteDetailResponse>(
    `/encounters/${encounterNumber}/consultation-note`,
    { token },
  );
}

export function saveConsultationNoteDraft(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ConsultationNoteVersion>(
    `/encounters/${encounterNumber}/consultation-note/draft`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}

export function finalizeConsultationNote(token: string, encounterNumber: string) {
  return apiRequest<ConsultationNoteVersion>(
    `/encounters/${encounterNumber}/consultation-note/finalize`,
    { method: 'POST', token },
  );
}

export function createConsultationNoteNewVersion(
  token: string,
  encounterNumber: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ConsultationNoteVersion>(
    `/encounters/${encounterNumber}/consultation-note/new-version`,
    { method: 'POST', token, body: JSON.stringify(body) },
  );
}
