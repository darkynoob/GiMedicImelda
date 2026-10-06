import { apiRequest } from '../../../shared/http/api-client';
import type { DiagnosisItem } from './clinical-history.service';

export type { DiagnosisItem };

export type DocumentStatus = 'DRAFT' | 'FINALIZED';

export const OUTPATIENT_DOCUMENT_TYPES = [
  'LAB_REQUEST',
  'IMAGING_REQUEST',
  'REFERRAL',
  'INFORMED_CONSENT',
  'CERTIFICATE',
  'CLOSURE_NOTE',
] as const;
export type OutpatientDocumentTypeCode = (typeof OUTPATIENT_DOCUMENT_TYPES)[number];

export const documentTypeLabels: Record<OutpatientDocumentTypeCode, string> = {
  LAB_REQUEST: 'Solicitud de laboratorio',
  IMAGING_REQUEST: 'Solicitud de imagenología',
  REFERRAL: 'Referencia / contrarreferencia',
  INFORMED_CONSENT: 'Consentimiento informado',
  CERTIFICATE: 'Certificado / constancia',
  CLOSURE_NOTE: 'Nota de cierre del episodio',
};

export interface LabStudyItem {
  name?: string;
  type?: string;
  specialNotes?: string;
}

export interface WitnessItem {
  fullName?: string;
  relationship?: string;
}

export interface EducationalAttachmentItem {
  title?: string;
  type?: string;
  attachmentId?: string;
}

export interface DocumentContent {
  recordedAt?: string;

  labReasonForRequest?: string;
  labStudies?: LabStudyItem[];
  labDiagnosisCode?: string;
  labDiagnosisDescription?: string;
  labObservations?: string;
  labPriority?: string;

  imagingReasonForStudy?: string;
  imagingModality?: string;
  imagingModalityOtherDetail?: string;
  imagingStudyRequested?: string;
  imagingAnatomicalRegion?: string;
  imagingPresumptiveDiagnosisCode?: string;
  imagingPresumptiveDiagnosisDescription?: string;
  imagingSpecialInstructions?: string;
  imagingPriority?: string;

  referralType?: string;
  referralDestinationUnit?: string;
  referralOriginUnit?: string;
  referralReason?: string;
  referralClinicalSummary?: string;
  referralDiagnoses?: DiagnosisItem[];
  referralCurrentTreatmentSummary?: string;
  referralStudiesPerformed?: string;
  referralRecommendations?: string;
  referralPriority?: string;
  referralDestinationSpecialty?: string;

  consentProcedureType?: string;
  consentProcedureDescription?: string;
  consentRisks?: string;
  consentBenefits?: string;
  consentAlternatives?: string;
  consentPrognosisWithoutTreatment?: string;
  consentPatientOrGuardianName?: string;
  consentRelationship?: string;
  consentRelationshipDetail?: string;
  consentContingencyAuthorization?: boolean;
  consentContingencyNotes?: string;
  consentWitness1?: WitnessItem;
  consentWitness2?: WitnessItem;
  consentDateTime?: string;

  certificateType?: string;
  certificateTypeOtherDetail?: string;
  certificateDocumentUse?: string;
  certificateReason?: string;
  certificateDiagnosisCode?: string;
  certificateDiagnosisDescription?: string;
  certificateRestStartDate?: string;
  certificateRestEndDate?: string;
  certificateObservations?: string;
  certificateHideDiagnosisInPdf?: boolean;

  closureReason?: string;
  closureFinalClinicalSummary?: string;
  closureFinalDiagnoses?: DiagnosisItem[];
  closureFinalStatus?: string;
  closureDischargeInstructions?: string;
  closureFollowUpPlan?: string;
  closureNextAppointmentDate?: string;
  closureDestination?: string;

  legalSnapshot?: unknown;
  [key: string]: unknown;
}

export interface DocumentSummary {
  id: string;
  encounterId: string;
  title: string;
  status: DocumentStatus;
  documentDate: string;
  lockedAt: string | null;
  currentVersionId: string | null;
  downloadCount: number;
  metadataJson: { documentTypeCode?: string } | null;
}

export interface DocumentVersionSummary {
  id: string;
  documentId: string;
  versionNumber: number;
  contentJson: DocumentContent;
  createdAt: string;
}

export interface DocumentListResponse {
  documents: DocumentSummary[];
}

export interface DocumentDetailResponse {
  document: DocumentSummary;
  typeCode: OutpatientDocumentTypeCode;
  content: DocumentContent | null;
  versions: DocumentVersionSummary[];
}

export function fetchDocuments(token: string, encounterNumber: string) {
  return apiRequest<DocumentListResponse>(`/encounters/${encounterNumber}/documents`, {
    token,
  });
}

export function fetchDocumentDetail(token: string, encounterNumber: string, documentId: string) {
  return apiRequest<DocumentDetailResponse>(
    `/encounters/${encounterNumber}/documents/${documentId}`,
    { token },
  );
}

export function createDocument(
  token: string,
  encounterNumber: string,
  documentTypeCode: OutpatientDocumentTypeCode,
  content: DocumentContent,
) {
  return apiRequest<DocumentSummary>(`/encounters/${encounterNumber}/documents`, {
    method: 'POST',
    token,
    body: JSON.stringify({ documentTypeCode, ...content }),
  });
}

export function saveDocumentDraft(
  token: string,
  encounterNumber: string,
  documentId: string,
  content: DocumentContent,
) {
  return apiRequest<DocumentSummary>(
    `/encounters/${encounterNumber}/documents/${documentId}/draft`,
    { method: 'POST', token, body: JSON.stringify(content) },
  );
}

export function finalizeDocument(token: string, encounterNumber: string, documentId: string) {
  return apiRequest<DocumentSummary>(
    `/encounters/${encounterNumber}/documents/${documentId}/finalize`,
    { method: 'POST', token },
  );
}

export function createDocumentNewVersion(
  token: string,
  encounterNumber: string,
  documentId: string,
  content: DocumentContent,
) {
  return apiRequest<DocumentSummary>(
    `/encounters/${encounterNumber}/documents/${documentId}/new-version`,
    { method: 'POST', token, body: JSON.stringify(content) },
  );
}

export function registerDocumentDownload(
  token: string,
  encounterNumber: string,
  documentId: string,
) {
  return apiRequest<DocumentSummary>(
    `/encounters/${encounterNumber}/documents/${documentId}/download`,
    { method: 'POST', token },
  );
}
